/**
 * Authentication Service
 * Handles user registration, login, and token management
 */

import bcryptjs from 'bcryptjs';
import { AppDataSource } from '../core/database';
import { User } from '../core/entities/User';
import { UserRole, AuthCredentials, AuthTokens, JWTPayload } from '../core/types';
import { generateToken } from '../middleware/auth';
import logger from '../utils/logger';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      passwordSalt: salt,
      role: UserRole.USER,
      isActive: true,
    });

    await this.userRepository.save(user);
    logger.info(`User registered: ${email}`);

    return user;
  }

  /**
   * Authenticate user and generate tokens
   */
  async login(credentials: AuthCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.userRepository.findOne({ where: { email: credentials.email } });

    if (!user || !user.isActive) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Generate JWT
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    const accessToken = generateToken(payload);

    logger.info(`User logged in: ${email}`);

    return {
      user,
      tokens: {
        accessToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const salt = await bcryptjs.genSalt(10);
    user.passwordHash = await bcryptjs.hash(newPassword, salt);
    user.passwordSalt = salt;

    await this.userRepository.save(user);
    logger.info(`Password updated for user: ${user.email}`);
  }

  /**
   * List all users (admin only)
   */
  async listUsers(limit: number = 10, offset: number = 0): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = false;
    await this.userRepository.save(user);
    logger.info(`User deactivated: ${user.email}`);
  }
}

export const authService = new AuthService();
