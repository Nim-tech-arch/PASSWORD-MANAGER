/**
 * Core TypeScript types and interfaces for the Password Manager
 */

export interface PasswordEntry {
  id: string;
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
  path: string;
  masterPasswordRequired: boolean;
}

export interface ExportData {
  version: string;
  exportedAt: Date;
  entries: PasswordEntry[];
}
