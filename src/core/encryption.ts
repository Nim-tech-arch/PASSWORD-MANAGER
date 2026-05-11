/**
 * Encryption/Decryption module using AES-256-GCM
 * Provides secure password encryption with salt and IV
 */

import crypto from 'crypto';
import { EncryptionOptions } from './types';

const DEFAULT_OPTIONS: EncryptionOptions = {
  algorithm: 'aes-256-gcm',
  iterations: 100000,
  keyLength: 32,
  ivLength: 16,
};

export class EncryptionService {
  private options: EncryptionOptions;

  constructor(options: Partial<EncryptionOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Derives a key from the master password using PBKDF2
   */
  private deriveKey(masterPassword: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      masterPassword,
      salt,
      this.options.iterations,
      this.options.keyLength,
      'sha256'
    );
  }

  /**
   * Encrypts a password string
   * Returns format: salt:iv:encryptedData:authTag (all base64 encoded)
   */
  encryptPassword(plainPassword: string, masterPassword: string): string {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(32);
      const iv = crypto.randomBytes(this.options.ivLength);

      // Derive key from master password
      const key = this.deriveKey(masterPassword, salt);

      // Create cipher and encrypt
      const cipher = crypto.createCipheriv(this.options.algorithm, key, iv);
      let encrypted = cipher.update(plainPassword, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine all parts and return as base64
      const combined = Buffer.concat([salt, iv, Buffer.from(encrypted, 'hex'), authTag]);
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypts an encrypted password string
   */
  decryptPassword(encryptedData: string, masterPassword: string): string {
    try {
      // Decode the base64 data
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components (salt: 32 bytes, iv: 16 bytes, authTag: 16 bytes)
      const salt = combined.slice(0, 32);
      const iv = combined.slice(32, 32 + this.options.ivLength);
      const authTag = combined.slice(combined.length - 16);
      const encrypted = combined.slice(32 + this.options.ivLength, combined.length - 16);

      // Derive key from master password
      const key = this.deriveKey(masterPassword, salt);

      // Create decipher and decrypt
      const decipher = crypto.createDecipheriv(this.options.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Hashes a password for master password verification
   */
  hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, this.options.iterations, 64, 'sha256')
      .toString('hex');
    return { hash, salt };
  }

  /**
   * Verifies a password against its hash
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const verifyHash = crypto
        .pbkdf2Sync(password, salt, this.options.iterations, 64, 'sha256')
        .toString('hex');
      return verifyHash === hash;
    } catch {
      return false;
    }
  }
}

export default EncryptionService;
