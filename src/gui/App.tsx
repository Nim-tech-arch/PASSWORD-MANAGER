/**
 * Main App Component
 * Handles authentication state and routing
 */

import React, { useEffect, useState } from 'react';
import SetupScreen from './components/SetupScreen';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

interface ElectronAPI {
  db: {
    hasMasterPassword: () => Promise<boolean>;
    verifyMasterPassword: (password: string) => Promise<boolean>;
    setMasterPassword: (password: string) => Promise<any>;
    addEntry: (entry: any) => Promise<any>;
    getAllEntries: () => Promise<any[]>;
    searchEntries: (query: string) => Promise<any[]>;
    updateEntry: (id: string, updates: any) => Promise<any>;
    deleteEntry: (id: string) => Promise<void>;
    getEntry: (id: string) => Promise<any>;
  };
  password: {
    generate: (options: any) => Promise<string>;
    checkStrength: (password: string) => Promise<any>;
  };
  io: {
    exportPasswords: (entries: any[], format: string, masterPassword?: string) => Promise<any>;
    importPasswords: (format: string, masterPassword?: string) => Promise<any>;
  };
  app: {
    copyToClipboard: (text: string) => Promise<any>;
    quit: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

type AppState = 'setup' | 'login' | 'dashboard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('login');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkMasterPassword = async () => {
      try {
        const hasMasterPassword = await window.electronAPI.db.hasMasterPassword();
        if (hasMasterPassword) {
          setState('login');
        } else {
          setState('setup');
        }
      } catch (error) {
        console.error('Error checking master password:', error);
        setState('setup');
      } finally {
        setLoading(false);
      }
    };

    checkMasterPassword();
  }, []);

  const handleSetupComplete = () => {
    setState('login');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setState('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setState('login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1>🔐 Password Manager</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  switch (state) {
    case 'setup':
      return <SetupScreen onSetupComplete={handleSetupComplete} />;
    case 'login':
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    case 'dashboard':
      return isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    default:
      return <div>Unknown state</div>;
  }
};

export default App;
