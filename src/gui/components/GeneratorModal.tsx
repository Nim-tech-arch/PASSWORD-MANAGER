/**
 * Password Generator Modal Component
 * Generates and displays strong random passwords
 */

import React, { useState, useEffect } from 'react';
import '../styles/modal.css';

interface GeneratorModalProps {
  onClose: () => void;
}

const GeneratorModal: React.FC<GeneratorModalProps> = ({ onClose }) => {
  const [options, setOptions] = useState({
    length: 16,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    excludeAmbiguous: true,
  });

  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generatePassword();
  }, [options]);

  const generatePassword = async () => {
    try {
      const newPassword = await window.electronAPI.password.generate(options);
      setPassword(newPassword);

      const strength = await window.electronAPI.password.checkStrength(newPassword);
      setStrength(strength);
      setCopied(false);
    } catch (error) {
      console.error('Error generating password:', error);
    }
  };

  const handleOptionChange = (option: string, value: any) => {
    setOptions((prev) => ({ ...prev, [option]: value }));
  };

  const copyPassword = async () => {
    try {
      await window.electronAPI.app.copyToClipboard(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying password:', error);
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
          <h2>⚡ Password Generator</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="generator-container">
          <div className="password-display">
            <input
              type="text"
              value={password}
              readOnly
              className="password-output"
            />
            <button
              className="copy-btn large"
              onClick={copyPassword}
              title="Copy to clipboard"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>

          {strength && (
            <div className="strength-display">
              <div className="strength-bar-large">
                <div
                  className="strength-fill"
                  style={{
                    width: `${(strength.score / 5) * 100}%`,
                    backgroundColor: getStrengthColor(strength.level),
                  }}
                ></div>
              </div>
              <span
                className="strength-level"
                style={{ color: getStrengthColor(strength.level) }}
              >
                {strength.level}
              </span>
            </div>
          )}

          <div className="generator-options">
            <div className="option-group">
              <label>Length: {options.length} characters</label>
              <input
                type="range"
                min="8"
                max="32"
                value={options.length}
                onChange={(e) => handleOptionChange('length', parseInt(e.target.value))}
                className="slider"
              />
              <div className="length-inputs">
                <button
                  className="length-btn"
                  onClick={() =>
                    handleOptionChange('length', Math.max(8, options.length - 1))
                  }
                >
                  −
                </button>
                <input
                  type="number"
                  min="8"
                  max="32"
                  value={options.length}
                  onChange={(e) => handleOptionChange('length', parseInt(e.target.value) || 16)}
                  className="length-input"
                />
                <button
                  className="length-btn"
                  onClick={() =>
                    handleOptionChange('length', Math.min(32, options.length + 1))
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.useUppercase}
                  onChange={(e) => handleOptionChange('useUppercase', e.target.checked)}
                />
                Uppercase (A-Z)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={options.useLowercase}
                  onChange={(e) => handleOptionChange('useLowercase', e.target.checked)}
                />
                Lowercase (a-z)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={options.useNumbers}
                  onChange={(e) => handleOptionChange('useNumbers', e.target.checked)}
                />
                Numbers (0-9)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={options.useSymbols}
                  onChange={(e) => handleOptionChange('useSymbols', e.target.checked)}
                />
                Symbols (!@#$...)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={options.excludeAmbiguous}
                  onChange={(e) => handleOptionChange('excludeAmbiguous', e.target.checked)}
                />
                Exclude ambiguous characters (il1Lo0O)
              </label>
            </div>
          </div>

          <button
            className="btn btn-primary full-width"
            onClick={generatePassword}
          >
            🔄 Generate New Password
          </button>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratorModal;
