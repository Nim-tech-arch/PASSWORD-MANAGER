/**
 * Electron Main Process
 * Handles window creation, IPC communication, and application lifecycle
 */

import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import DatabaseService from './core/database';
import PasswordGenerator from './core/passwordGenerator';
import PasswordValidator from './core/passwordValidator';
import ImportExportService from './utils/importExport';
import { PasswordEntry } from './core/types';

let mainWindow: BrowserWindow | null = null;
let db: DatabaseService | null = null;
let importExport: ImportExportService | null = null;

/**
 * Creates the main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  const startUrl = isDev ? 'http://localhost:8080' : `file://${path.join(__dirname, 'gui', 'index.html')}`;
  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initializes the database
 */
async function initializeDatabase(): Promise<void> {
  try {
    db = new DatabaseService(path.join(app.getPath('userData'), 'passwords.db'));
    await db.initialize();
    importExport = new ImportExportService();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    dialog.showErrorBox('Error', 'Failed to initialize database');
  }
}

// ============================================================================
// IPC Handlers
// ============================================================================

/**
 * Check if master password is set
 */
ipcMain.handle('db:hasMasterPassword', async () => {
  try {
    return db ? await db.hasMasterPassword() : false;
  } catch (error) {
    console.error('Error checking master password:', error);
    throw error;
  }
});

/**
 * Set master password (first time setup)
 */
ipcMain.handle('db:setMasterPassword', async (_event, masterPassword: string) => {
  try {
    if (!db) throw new Error('Database not initialized');
    await db.setMasterPassword(masterPassword);
    return { success: true };
  } catch (error) {
    console.error('Error setting master password:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
});

/**
 * Verify master password
 */
ipcMain.handle('db:verifyMasterPassword', async (_event, masterPassword: string) => {
  try {
    if (!db) throw new Error('Database not initialized');
    const isValid = await db.verifyMasterPassword(masterPassword);
    return isValid;
  } catch (error) {
    console.error('Error verifying master password:', error);
    return false;
  }
});

/**
 * Add new password entry
 */
ipcMain.handle(
  'db:addEntry',
  async (
    _event,
    entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (!db) throw new Error('Database not initialized');
      const newEntry = await db.addEntry(entry);
      return newEntry;
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }
);

/**
 * Get password entry by ID
 */
ipcMain.handle('db:getEntry', async (_event, id: string) => {
  try {
    if (!db) throw new Error('Database not initialized');
    return await db.getEntry(id);
  } catch (error) {
    console.error('Error getting entry:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
});

/**
 * Get all password entries
 */
ipcMain.handle('db:getAllEntries', async () => {
  try {
    if (!db) throw new Error('Database not initialized');
    return await db.getAllEntries();
  } catch (error) {
    console.error('Error getting all entries:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
});

/**
 * Search password entries
 */
ipcMain.handle('db:searchEntries', async (_event, query: string) => {
  try {
    if (!db) throw new Error('Database not initialized');
    return await db.searchEntries(query);
  } catch (error) {
    console.error('Error searching entries:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
});

/**
 * Update password entry
 */
ipcMain.handle('db:updateEntry', async (_event, id: string, updates: Partial<PasswordEntry>) => {
  try {
    if (!db) throw new Error('Database not initialized');
    return await db.updateEntry(id, updates);
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
});

/**
 * Delete password entry
 */
ipcMain.handle('db:deleteEntry', async (_event, id: string) => {
  try {
    if (!db) throw new Error('Database not initialized');
    await db.deleteEntry(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
});

/**
 * Generate strong password
 */
ipcMain.handle('password:generate', async (_event, options: any) => {
  try {
    const password = PasswordGenerator.generate(options);
    return password;
  } catch (error) {
    console.error('Error generating password:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
});

/**
 * Check password strength
 */
ipcMain.handle('password:checkStrength', async (_event, password: string) => {
  try {
    const strength = PasswordValidator.checkStrength(password);
    return strength;
  } catch (error) {
    console.error('Error checking password strength:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
});

/**
 * Export passwords
 */
ipcMain.handle(
  'io:exportPasswords',
  async (_event, entries: PasswordEntry[], format: string, masterPassword: string) => {
    try {
      if (!importExport) throw new Error('Import/Export service not initialized');

      const result = await dialog.showSaveDialog(mainWindow || new BrowserWindow(), {
        defaultPath: `password-backup-${Date.now()}`,
        filters: [{ name: format.toUpperCase(), extensions: [format === 'json' ? 'json' : 'csv'] }],
      });

      if (!result.filePath) return { success: false, message: 'Export cancelled' };

      if (format === 'json') {
        await importExport.exportToJSON(entries, result.filePath, masterPassword);
      } else {
        await importExport.exportToCSV(entries, result.filePath);
      }

      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('Error exporting passwords:', error);
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }
);

/**
 * Import passwords
 */
ipcMain.handle('io:importPasswords', async (_event, format: string, masterPassword?: string) => {
  try {
    if (!importExport) throw new Error('Import/Export service not initialized');

    const result = await dialog.showOpenDialog(mainWindow || new BrowserWindow(), {
      properties: ['openFile'],
      filters: [{ name: format.toUpperCase(), extensions: [format === 'json' ? 'json' : 'csv'] }],
    });

    if (!result.filePaths.length) return { success: false, message: 'Import cancelled' };

    const filePath = result.filePaths[0];
    let entries: any[];

    if (format === 'json') {
      if (!masterPassword) throw new Error('Master password required for JSON import');
      const imported = await importExport.importFromJSON(filePath, masterPassword);
      entries = imported;
    } else {
      entries = await importExport.importFromCSV(filePath);
    }

    return { success: true, entries, count: entries.length };
  } catch (error) {
    console.error('Error importing passwords:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
});

/**
 * Copy to clipboard
 */
ipcMain.handle('app:copyToClipboard', async (_event, text: string) => {
  try {
    const { clipboard } = require('electron');
    clipboard.writeText(text);

    // Auto-clear after 30 seconds
    setTimeout(() => {
      clipboard.writeText('');
    }, 30000);

    return { success: true };
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw error instanceof Error ? error : new Error('Unknown error');
  }
});

/**
 * Close database on app quit
 */
ipcMain.handle('app:quit', async () => {
  if (db) {
    await db.close();
  }
  app.quit();
});

// ============================================================================
// Application Lifecycle
// ============================================================================

app.on('ready', async () => {
  await initializeDatabase();
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Creates the application menu
 */
function createMenu(): void {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'Ctrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow || new BrowserWindow(), {
              type: 'info',
              title: 'About Password Manager',
              message: 'Password Manager v0.1.0',
              detail: 'A secure password manager with end-to-end encryption.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

export default app;
