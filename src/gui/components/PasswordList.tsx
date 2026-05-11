/**
 * Password List Component
 * Displays password entries in a table
 */

import React from 'react';
import { PasswordEntry } from '../../core/types';
import '../styles/password-list.css';

interface PasswordListProps {
  entries: PasswordEntry[];
  onViewPassword: (entry: PasswordEntry) => void;
}

const PasswordList: React.FC<PasswordListProps> = ({ entries, onViewPassword }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="password-list-container">
      <table className="password-list">
        <thead>
          <tr>
            <th>Service</th>
            <th>Username</th>
            <th>Email</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="password-row">
              <td className="service-cell">
                <strong>{entry.service}</strong>
              </td>
              <td className="username-cell">{entry.username}</td>
              <td className="email-cell">{entry.email || '—'}</td>
              <td className="date-cell">{formatDate(entry.createdAt)}</td>
              <td className="action-cell">
                <button
                  className="btn btn-view"
                  onClick={() => onViewPassword(entry)}
                  title="View and manage this password"
                >
                  👁️ View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PasswordList;
