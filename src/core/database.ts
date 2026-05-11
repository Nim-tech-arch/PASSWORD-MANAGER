/**
 * SQLite Database Layer
 * Handles password entry persistence with encryption
 */

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { PasswordEntry, MasterPassword } from './types';
import EncryptionService from './encryption';

export class DatabaseService {
  private db: Database | null = null;
  private encryptionService: EncryptionService;
  private dbPath: string;
  private masterPassword: string | null = null;

  constructor(dbPath: string = './data/passwords.db') {
    this.dbPath = dbPath;
    this.encryptionService = new EncryptionService();
  }

  /**
   * Initializes the database and creates tables if they don't exist
   */
  async initialize(): Promise<void> {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database,
      });

      // Enable foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON;');

      // Create master password table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS master_password (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          iterations INTEGER NOT NULL DEFAULT 100000
        );
      `);

      // Create password entries table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS password_entries (
          id TEXT PRIMARY KEY,
          service TEXT NOT NULL,
          username TEXT NOT NULL,
          email TEXT,
          encrypted_password TEXT NOT NULL,
          url TEXT,
          notes TEXT,
          tags TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_used DATETIME,
          UNIQUE(service, username)
        );
      `);

      // Create indexes for faster searches
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_service ON password_entries(service);
        CREATE INDEX IF NOT EXISTS idx_username ON password_entries(username);
        CREATE INDEX IF NOT EXISTS idx_email ON password_entries(email);
      `);

      console.log('Database initialized successfully');
    } catch (error) {
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sets the master password (first time setup)
   */
  async setMasterPassword(masterPassword: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const existing = await this.db.get('SELECT COUNT(*) as count FROM master_password');
      if (existing.count > 0) {
        throw new Error('Master password is already set');
      }

      const { hash, salt } = this.encryptionService.hashPassword(masterPassword);
      await this.db.run(
        'INSERT INTO master_password (id, hash, salt, iterations) VALUES (1, ?, ?, 100000)',
        [hash, salt]
      );

      this.masterPassword = masterPassword;
    } catch (error) {
      throw new Error(`Failed to set master password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifies the master password
   */
  async verifyMasterPassword(masterPassword: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const row = await this.db.get('SELECT hash, salt FROM master_password LIMIT 1');
      if (!row) {
        throw new Error('Master password not set');
      }

      const isValid = this.encryptionService.verifyPassword(masterPassword, row.hash, row.salt);
      if (isValid) {
        this.masterPassword = masterPassword;
      }
      return isValid;
    } catch (error) {
      throw new Error(`Master password verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if master password is set
   */
  async hasMasterPassword(): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const row = await this.db.get('SELECT COUNT(*) as count FROM master_password');
      return row.count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Adds a new password entry
   */
  async addEntry(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasswordEntry> {
    if (!this.db || !this.masterPassword) {
      throw new Error('Database not initialized or master password not set');
    }

    try {
      const id = this.generateId();
      const now = new Date();
      const encryptedPassword = this.encryptionService.encryptPassword(entry.password, this.masterPassword);

      await this.db.run(
        `INSERT INTO password_entries (
          id, service, username, email, encrypted_password, url, notes, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          entry.service,
          entry.username,
          entry.email || null,
          encryptedPassword,
          entry.url || null,
          entry.notes || null,
          entry.tags ? JSON.stringify(entry.tags) : null,
          now.toISOString(),
          now.toISOString(),
        ]
      );

      return {
        id,
        service: entry.service,
        username: entry.username,
        email: entry.email,
        password: entry.password,
        url: entry.url,
        notes: entry.notes,
        tags: entry.tags,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      throw new Error(`Failed to add password entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves a password entry by ID (decrypted)
   */
  async getEntry(id: string): Promise<PasswordEntry | null> {
    if (!this.db || !this.masterPassword) {
      throw new Error('Database not initialized or master password not set');
    }

    try {
      const row = await this.db.get('SELECT * FROM password_entries WHERE id = ?', [id]);
      if (!row) return null;

      return this.decryptEntry(row);
    } catch (error) {
      throw new Error(`Failed to retrieve entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Searches for entries by service or username
   */
  async searchEntries(query: string): Promise<PasswordEntry[]> {
    if (!this.db || !this.masterPassword) {
      throw new Error('Database not initialized or master password not set');
    }

    try {
      const rows = await this.db.all(
        `SELECT * FROM password_entries 
         WHERE service LIKE ? OR username LIKE ? OR email LIKE ?
         ORDER BY service ASC`,
        [`%${query}%`, `%${query}%`, `%${query}%`]
      );

      return rows.map((row) => this.decryptEntry(row));
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets all password entries
   */
  async getAllEntries(): Promise<PasswordEntry[]> {
    if (!this.db || !this.masterPassword) {
      throw new Error('Database not initialized or master password not set');
    }

    try {
      const rows = await this.db.all('SELECT * FROM password_entries ORDER BY service ASC');
      return rows.map((row) => this.decryptEntry(row));
    } catch (error) {
      throw new Error(`Failed to get entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates a password entry
   */
  async updateEntry(id: string, updates: Partial<PasswordEntry>): Promise<PasswordEntry> {
    if (!this.db || !this.masterPassword) {
      throw new Error('Database not initialized or master password not set');
    }

    try {
      const now = new Date();
      const updateData: Record<string, any> = {
        updated_at: now.toISOString(),
      };

      if (updates.service) updateData.service = updates.service;
      if (updates.username) updateData.username = updates.username;
      if (updates.email) updateData.email = updates.email;
      if (updates.password) {
        updateData.encrypted_password = this.encryptionService.encryptPassword(
          updates.password,
          this.masterPassword
        );
      }
      if (updates.url) updateData.url = updates.url;
      if (updates.notes) updateData.notes = updates.notes;
      if (updates.tags) updateData.tags = JSON.stringify(updates.tags);

      const setClause = Object.keys(updateData)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(updateData), id];

      await this.db.run(`UPDATE password_entries SET ${setClause} WHERE id = ?`, values);

      const updated = await this.getEntry(id);
      if (!updated) throw new Error('Entry not found after update');

      return updated;
    } catch (error) {
      throw new Error(`Failed to update entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes a password entry
   */
  async deleteEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.run('DELETE FROM password_entries WHERE id = ?', [id]);
    } catch (error) {
      throw new Error(`Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Closes the database connection
   */
  async close(): Promise<void> {
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
