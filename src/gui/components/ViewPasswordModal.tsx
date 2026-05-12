/**
 * View Password Modal Component
 * Displays password details with edit and delete options
 */

import React, { useState } from 'react';
import { PasswordEntry } from '../../core/types';
import '../styles/modal.css';

interface ViewPasswordModalProps {
  entry: PasswordEntry;
  onClose: () => void;
  onUpdate: (updates: Partial<PasswordEntry>) => void;
  onDelete: () => void;
}

const ViewPasswordModal: React.FC<ViewPasswordModalProps> = ({
  entry,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: entry.username,
    password: entry.password,
    url: entry.url || '',
    notes: entry.notes || '',
  });
  const [strength, setStrength] = useState<any>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      checkStrength(value);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate({
        username: formData.username,
        password: formData.password,
        url: formData.url || undefined,
        notes: formData.notes || undefined,
      });
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await window.electronAPI.app.copyToClipboard(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (isEditing) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Edit Password - {entry.service}</h2>
            <button className="modal-close" onClick={() => setIsEditing(false)}>
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
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
            </div>

            <div className="form-group">
              <label>URL</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔐 {entry.service}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="view-content">
          <div className="detail-group">
            <label>Username</label>
            <div className="detail-value">
              <span>{entry.username}</span>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(entry.username)}
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
          </div>

          <div className="detail-group">
            <label>Password</label>
            <div className="detail-value">
              <span>{showPassword ? entry.password : '•'.repeat(entry.password.length)}</span>
              <button
                className="toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(entry.password)}
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
          </div>

          {entry.email && (
            <div className="detail-group">
              <label>Email</label>
              <div className="detail-value">
                <span>{entry.email}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(entry.email!)}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
          )}

          {entry.url && (
            <div className="detail-group">
              <label>URL</label>
              <div className="detail-value">
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  {entry.url}
                </a>
              </div>
            </div>
          )}

          {entry.notes && (
            <div className="detail-group">
              <label>Notes</label>
              <div className="detail-value">{entry.notes}</div>
            </div>
          )}

          <div className="meta-info">
            <p>
              <small>Created: {formatDate(entry.createdAt)}</small>
            </p>
            <p>
              <small>Updated: {formatDate(entry.updatedAt)}</small>
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Are you sure? This cannot be undone.')) {
                onDelete();
              }
            }}
            disabled={loading}
          >
            🗑️ Delete
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsEditing(true)}
            disabled={loading}
          >
            ✏️ Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPasswordModal;
