/**
 * PostgreSQL Database setup and entities using TypeORM
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import logger from '../utils/logger';

// ============ Database Configuration ============
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'password_manager',
  synchronize: process.env.NODE_ENV !== 'production', // Auto-migrate in dev
  logging: process.env.DB_LOGGING === 'true',
  entities: ['src/core/entities/*.ts'],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});

// ============ Database Connection ============
export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('✅ Database connection established');
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  }
}

export async function seedDatabase(): Promise<void> {
  // Placeholder for seed data
  logger.info('Database seeding complete');
}

export default AppDataSource;

    if (this.db) {
      await this.db.close();
      this.db = null;
      this.masterPassword = null;
    }
  }

  /**
   * Helper: Decrypts an entry from the database
   */
  private decryptEntry(row: any): PasswordEntry {
    if (!this.masterPassword) {
      throw new Error('Master password not set');
    }

    return {
      id: row.id,
      service: row.service,
      username: row.username,
      email: row.email,
      password: this.encryptionService.decryptPassword(row.encrypted_password, this.masterPassword),
      url: row.url,
      notes: row.notes,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastUsed: row.last_used ? new Date(row.last_used) : undefined,
    };
  }

  /**
   * Helper: Generates a unique ID
   */
  private generateId(): string {
    return `pwd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default DatabaseService;
