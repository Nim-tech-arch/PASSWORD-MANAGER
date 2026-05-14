/**
 * Login Screen Component
 * Handles master password verification
 */

import React, { useState } from 'react';
import '../styles/auth.css';

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        onLoginSuccess(data.token);
      } else {
        setAttempts((prev) => prev + 1);
        setError(data.error || 'Incorrect master password');
        setPassword('');

        if (attempts >= 3) {
          setError('Too many failed attempts. Please restart the application.');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔐 Password Manager</h1>
          <p>Unlock your vault</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your master password"
              disabled={loading || attempts >= 3}
              className="form-input"
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          {attempts > 0 && attempts < 3 && (
            <div className="warning-message">
              {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining
            </div>
          )}

          <button
            type="submit"
            disabled={loading || attempts >= 3}
            className="auth-button"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>

        <div className="auth-footer">
          <p>🔒 Your passwords are encrypted with AES-256-GCM</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
