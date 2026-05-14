/**
 * Password Service
 * Handles password entry CRUD operations with user isolation
 */

import { AppDataSource } from '../core/database';
import { PasswordEntry as PasswordEntryEntity } from '../core/entities/PasswordEntry';
import { PasswordEntry, PasswordListResponse } from '../core/types';
import EncryptionService from '../core/encryption';
import logger from '../utils/logger';

export class PasswordService {
  private passwordRepository = AppDataSource.getRepository(PasswordEntryEntity);
  private encryptionService = new EncryptionService();

  /**
   * Create a new password entry
   * User isolation: only the authenticated user can create entries for themselves
   */
  async createPassword(
    userId: string,
    data: Omit<PasswordEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<PasswordEntry> {
    // Encrypt the password
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key';
    const encryptedPassword = this.encryptionService.encryptPassword(
      data.password,
      encryptionKey
    );

    const entry = this.passwordRepository.create({
      userId,
      service: data.service,
      username: data.username,
      email: data.email,
      encryptedPassword,
      url: data.url,
      notes: data.notes,
      tags: data.tags,
    });

    await this.passwordRepository.save(entry);
    logger.debug(`Password entry created for user ${userId}: ${data.service}`);

    return this.decryptEntry(entry as any);
  }

  /**
   * Get a single password entry
   * User isolation: user can only access their own passwords
   */
  async getPassword(userId: string, passwordId: string): Promise<PasswordEntry | null> {
    const entry = await this.passwordRepository.findOne({
      where: {
        id: passwordId,
        userId,
      },
    });

    if (!entry) {
      return null;
    }

    return this.decryptEntry(entry as any);
  }

  /**
   * List user's password entries with pagination
   * IMPORTANT: Never return all passwords at once
   */
  async listPasswords(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ): Promise<PasswordListResponse> {
    // Ensure reasonable pagination
    pageSize = Math.min(pageSize, 50);
    const offset = (page - 1) * pageSize;

    let query = this.passwordRepository
      .createQueryBuilder('password')
      .where('password.userId = :userId', { userId })
      .orderBy('password.service', 'ASC');

    if (search) {
      query = query.andWhere(
        '(password.service ILIKE :search OR password.username ILIKE :search OR password.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [entries, total] = await query
      .skip(offset)
      .take(pageSize)
      .getManyAndCount();

    const decrypted = entries.map((entry) => this.decryptEntry(entry as any));

    return {
      passwords: decrypted,
      count: decrypted.length,
      page,
      pageSize,
    };
  }

  /**
   * Update a password entry
   * User isolation: user can only update their own passwords
   */
  async updatePassword(
    userId: string,
    passwordId: string,
    updates: Partial<Omit<PasswordEntry, 'id' | 'userId' | 'createdAt'>>
  ): Promise<PasswordEntry> {
    const entry = await this.passwordRepository.findOne({
      where: {
        id: passwordId,
        userId,
      },
    });

    if (!entry) {
      throw new Error('Password entry not found');
    }

    if (updates.service) entry.service = updates.service;
    if (updates.username) entry.username = updates.username;
    if (updates.email) entry.email = updates.email;
    if (updates.password) {
      const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key';
      entry.encryptedPassword = this.encryptionService.encryptPassword(
        updates.password,
        encryptionKey
      );
    }
    if (updates.url) entry.url = updates.url;
    if (updates.notes) entry.notes = updates.notes;
    if (updates.tags) entry.tags = updates.tags;
    if (updates.lastUsed) entry.lastUsed = updates.lastUsed;

    await this.passwordRepository.save(entry);
    logger.debug(`Password entry updated for user ${userId}: ${entry.service}`);

    return this.decryptEntry(entry as any);
  }

  /**
   * Delete a password entry
   * User isolation: user can only delete their own passwords
   */
  async deletePassword(userId: string, passwordId: string): Promise<void> {
    const result = await this.passwordRepository.delete({
      id: passwordId,
      userId,
    });

    if (result.affected === 0) {
      throw new Error('Password entry not found');
    }

    logger.debug(`Password entry deleted for user ${userId}: ${passwordId}`);
  }

  /**
   * Get password count for a user
   */
  async getPasswordCount(userId: string): Promise<number> {
    return this.passwordRepository.count({
      where: { userId },
    });
  }

  /**
   * Decrypt a password entry for response
   */
  private decryptEntry(entry: any): PasswordEntry {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key';
    const decryptedPassword = this.encryptionService.decryptPassword(
      entry.encryptedPassword,
      encryptionKey
    );

    return {
      id: entry.id,
      userId: entry.userId,
      service: entry.service,
      username: entry.username,
      email: entry.email,
      password: decryptedPassword,
      encryptedPassword: entry.encryptedPassword,
      url: entry.url,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      lastUsed: entry.lastUsed,
      tags: entry.tags,
    };
  }
}

export const passwordService = new PasswordService();
