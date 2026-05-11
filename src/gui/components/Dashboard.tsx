/**
 * Dashboard Component
 * Main password manager interface
 */

import React, { useEffect, useState } from 'react';
import { PasswordEntry } from '../../core/types';
import PasswordList from './PasswordList';
import AddPasswordModal from './AddPasswordModal';
import ViewPasswordModal from './ViewPasswordModal';
import GeneratorModal from './GeneratorModal';
import '../styles/dashboard.css';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<PasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchQuery]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const allEntries = await window.electronAPI.db.getAllEntries();
      setEntries(allEntries);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    if (!searchQuery.trim()) {
      setFilteredEntries(entries);
      return;
    }

    try {
      const filtered = entries.filter(
        (entry) =>
          entry.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (entry.email && entry.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredEntries(filtered);
    } catch {
      setFilteredEntries(entries);
    }
  };

  const handleAddPassword = async (newEntry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const added = await window.electronAPI.db.addEntry(newEntry);
      setEntries([...entries, added]);
      setShowAddModal(false);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add password');
    }
  };

  const handleViewPassword = (entry: PasswordEntry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  };

  const handleUpdatePassword = async (updates: Partial<PasswordEntry>) => {
    if (!selectedEntry) return;

    try {
      const updated = await window.electronAPI.db.updateEntry(selectedEntry.id, updates);
      setEntries(entries.map((e) => (e.id === updated.id ? updated : e)));
      setShowViewModal(false);
      setSelectedEntry(null);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update password');
    }
  };

  const handleDeletePassword = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this password?')) return;

    try {
      await window.electronAPI.db.deleteEntry(id);
      setEntries(entries.filter((e) => e.id !== id));
      setShowViewModal(false);
      setSelectedEntry(null);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete password');
    }
  };

  const handleLogout = async () => {
    onLogout();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🔐 Password Manager</h1>
          <p>{entries.length} passwords stored</p>
        </div>
        <div className="header-right">
          <button className="btn btn-generator" onClick={() => setShowGeneratorModal(true)}>
            ⚡ Generate
          </button>
          <button className="btn btn-add" onClick={() => setShowAddModal(true)}>
            ➕ Add Password
          </button>
          <button className="btn btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search passwords by service, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading passwords...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">
            <p>📭 No passwords found</p>
            <button className="btn btn-add" onClick={() => setShowAddModal(true)}>
              Add your first password
            </button>
          </div>
        ) : (
          <PasswordList entries={filteredEntries} onViewPassword={handleViewPassword} />
        )}
      </div>

      {showAddModal && (
        <AddPasswordModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPassword}
        />
      )}

      {showViewModal && selectedEntry && (
        <ViewPasswordModal
          entry={selectedEntry}
          onClose={() => setShowViewModal(false)}
          onUpdate={handleUpdatePassword}
          onDelete={() => handleDeletePassword(selectedEntry.id)}
        />
      )}

      {showGeneratorModal && (
        <GeneratorModal onClose={() => setShowGeneratorModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;
