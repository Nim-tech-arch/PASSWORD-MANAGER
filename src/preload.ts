/**
 * Preload Script
 * Provides secure IPC bridge between renderer and main process
 */

import { contextBridge, ipcRenderer } from 'electron';
import { PasswordEntry } from './core/types';

const api = {
  // Database operations
  db: {
    hasMasterPassword: () => ipcRenderer.invoke('db:hasMasterPassword'),
    setMasterPassword: (password: string) => ipcRenderer.invoke('db:setMasterPassword', password),
    verifyMasterPassword: (password: string) => ipcRenderer.invoke('db:verifyMasterPassword', password),
    addEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) =>
      ipcRenderer.invoke('db:addEntry', entry),
    getEntry: (id: string) => ipcRenderer.invoke('db:getEntry', id),
    getAllEntries: () => ipcRenderer.invoke('db:getAllEntries'),
    searchEntries: (query: string) => ipcRenderer.invoke('db:searchEntries', query),
    updateEntry: (id: string, updates: Partial<PasswordEntry>) =>
      ipcRenderer.invoke('db:updateEntry', id, updates),
    deleteEntry: (id: string) => ipcRenderer.invoke('db:deleteEntry', id),
  },

  // Password operations
  password: {
    generate: (options: any) => ipcRenderer.invoke('password:generate', options),
    checkStrength: (password: string) => ipcRenderer.invoke('password:checkStrength', password),
  },

  // Import/Export operations
  io: {
    exportPasswords: (entries: PasswordEntry[], format: string, masterPassword?: string) =>
      ipcRenderer.invoke('io:exportPasswords', entries, format, masterPassword),
    importPasswords: (format: string, masterPassword?: string) =>
      ipcRenderer.invoke('io:importPasswords', format, masterPassword),
  },

  // App operations
  app: {
    copyToClipboard: (text: string) => ipcRenderer.invoke('app:copyToClipboard', text),
    quit: () => ipcRenderer.invoke('app:quit'),
  },
};

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

declare global {
  interface Window {
    electronAPI: typeof api;
  }
}
