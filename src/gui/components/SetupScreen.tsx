/**
 * Setup Screen Component
 * Handles initial master password setup
 */

import React, { useState } from 'react';
import '../styles/auth.css';

interface SetupScreenProps {
  onSetupComplete: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState<any>(null);

  const checkStrength = async (pwd: string) => {
    if (pwd.length === 0) {
      setStrength(null);
      return;
    }
    try {
      const result = await window.electronAPI.password.checkStrength(pwd);
      setStrength(result);
    } catch (error) {
      console.error('Error checking strength:', error);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    checkStrength(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Both fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (strength && strength.score < 3) {
      setError('Password is too weak. Add uppercase, numbers, and symbols.');
      return;
    }

    setLoading(true);
    try {
      await window.electronAPI.db.setMasterPassword(password);
      onSetupComplete();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to set master password');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'Very Weak':
      case 'Weak':
        return '#ff4444';
      case 'Fair':
        return '#ffaa00';
      case 'Good':
        return '#88dd00';
      case 'Strong':
      case 'Very Strong':
        return '#00dd00';
      default:
        return '#ccc';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔐 Password Manager</h1>
          <p>First Time Setup</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Master Password</label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter a strong master password"
              disabled={loading}
              className="form-input"
            />
            {strength && (
              <div className="strength-indicator">
                <div
                  className="strength-bar"
                  style={{
                    width: `${(strength.score / 5) * 100}%`,
                    backgroundColor: getStrengthColor(strength.level),
                  }}
                ></div>
                <span className="strength-text" style={{ color: getStrengthColor(strength.level) }}>
                  {strength.level}
                </span>
              </div>
            )}
            {strength && strength.feedback.length > 0 && (
              <div className="strength-feedback">
                {strength.feedback.map((feedback: string, i: number) => (
                  <p key={i}>• {feedback}</p>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your master password"
              disabled={loading}
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="info-box">
            <p>
              <strong>⚠️ Important:</strong> Your master password cannot be recovered if forgotten. Choose a strong,
              unique password and store it securely.
            </p>
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Setting up...' : 'Create Master Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupScreen;
