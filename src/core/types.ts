/**
 * Core TypeScript types and interfaces for the Multi-User Password Manager API
 */

// ============ User Types ============
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  twoFactorEnabled: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  passwordCount: number;
}

// ============ Password Entry Types ============
export interface PasswordEntry {
  id: string;
  userId: string; // User isolation: every password belongs to a specific user
  service: string;
  username: string;
  email?: string;
  password: string;
  encryptedPassword?: string;
  url?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  tags?: string[];
}

export interface PasswordListResponse {
  passwords: PasswordEntry[];
  count: number;
  page: number;
  pageSize: number;
}

// ============ Authentication Types ============
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// ============ Validation Types ============
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  timestamp: Date;
}

// ============ Legacy Types (for backwards compatibility) ============
export interface MasterPassword {
  hash: string;
  salt: string;
  iterations: number;
}

export interface PasswordStrength {
  score: number; // 0-5
  level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  feedback: string[];
}

export interface EncryptionOptions {
  algorithm: string;
  iterations: number;
  keyLength: number;
  ivLength: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  logging: boolean;
}

export interface ExportData {
  version: string;
  exportedAt: Date;
  entries: PasswordEntry[];
}
