/**
 * Import/Export Utilities
 * Handles importing and exporting password data
 */

import fs from 'fs/promises';
import path from 'path';
import { PasswordEntry, ExportData } from '../core/types';
import EncryptionService from '../core/encryption';

export class ImportExportService {
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = new EncryptionService();
  }

  /**
   * Exports all password entries to a JSON file (encrypted)
   */
  async exportToJSON(
    entries: PasswordEntry[],
    filePath: string,
    masterPassword: string
  ): Promise<void> {
    try {
      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date(),
        entries: entries.map((entry) => ({
          ...entry,
          password: this.encryptionService.encryptPassword(entry.password, masterPassword),
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      await fs.writeFile(filePath, jsonString, 'utf-8');
      console.log(`Successfully exported ${entries.length} entries to ${filePath}`);
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Imports password entries from a JSON file
   */
  async importFromJSON(filePath: string, masterPassword: string): Promise<PasswordEntry[]> {
    try {
      const jsonString = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(jsonString) as ExportData;

      if (data.version !== '1.0.0') {
        throw new Error(`Unsupported export format version: ${data.version}`);
      }

      const entries = data.entries.map((entry) => ({
        ...entry,
        password: this.encryptionService.decryptPassword(entry.password, masterPassword),
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      }));

      console.log(`Successfully imported ${entries.length} entries from ${filePath}`);
      return entries;
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Exports to CSV format (for spreadsheet applications)
   * WARNING: Only exports unencrypted data - use with caution!
   */
  async exportToCSV(entries: PasswordEntry[], filePath: string): Promise<void> {
    try {
      const headers = ['Service', 'Username', 'Email', 'Password', 'URL', 'Notes'];
      const csvRows = [headers];

      for (const entry of entries) {
        const row = [
          this.escapeCSV(entry.service),
          this.escapeCSV(entry.username),
          this.escapeCSV(entry.email || ''),
          this.escapeCSV(entry.password),
          this.escapeCSV(entry.url || ''),
          this.escapeCSV(entry.notes || ''),
        ];
        csvRows.push(row);
      }

      const csvContent = csvRows.map((row) => row.join(',')).join('\n');
      await fs.writeFile(filePath, csvContent, 'utf-8');
      console.log(`Successfully exported ${entries.length} entries to ${filePath}`);
    } catch (error) {
      throw new Error(`CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Imports from CSV format
   */
  async importFromCSV(filePath: string): Promise<Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[]> {
    try {
      const csvContent = await fs.readFile(filePath, 'utf-8');
      const lines = csvContent.split('\n');

      if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = this.parseCSVRow(lines[i]);
        const entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          service: values[0] || '',
          username: values[1] || '',
          email: values[2],
          password: values[3] || '',
          url: values[4],
          notes: values[5],
        };

        if (entry.service && entry.password) {
          entries.push(entry);
        }
      }

      console.log(`Successfully imported ${entries.length} entries from ${filePath}`);
      return entries;
    } catch (error) {
      throw new Error(`CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper: Escapes CSV values
   */
  private escapeCSV(value: string | undefined): string {
    if (!value) return '';
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  /**
   * Helper: Parses a CSV row (handles quoted values)
   */
  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = row[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}

export default ImportExportService;
