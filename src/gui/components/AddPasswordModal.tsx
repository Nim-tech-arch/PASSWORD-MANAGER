/**
 * Add Password Modal Component
 * Form for adding new password entries
 */

import React, { useState } from 'react';
import { PasswordEntry } from '../../core/types';
import '../styles/modal.css';

interface AddPasswordModalProps {
  onClose: () => void;
  onAdd: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const AddPasswordModal: React.FC<AddPasswordModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    service: '',
    username: '',
    email: '',
    password: '',
    url: '',
    notes: '',
    tags: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    setError('');

    if (!formData.service.trim()) {
      setError('Service name is required');
      return;
    }

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        service: formData.service.trim(),
        username: formData.username.trim(),
        email: formData.email.trim() || undefined,
        password: formData.password,
        url: formData.url.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : undefined,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add password');
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Add New Password</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Service Name *</label>
            <input
              type="text"
              name="service"
              value={formData.service}
              onChange={handleChange}
              placeholder="e.g., Gmail, GitHub, Netflix"
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Your username"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email (optional)"
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Your password"
              className="form-input"
              disabled={loading}
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
          </div>

          <div className="form-group">
            <label>URL</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
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
              placeholder="Add any notes about this password..."
              rows={3}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Comma-separated tags (work, personal, important)"
              className="form-input"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPasswordModal;
