# 🔐 Secure Password Manager

A modern, TypeScript-based password manager with end-to-end encryption, CLI interface, and planned GUI support.

## ✨ Features

- **🔒 AES-256-GCM Encryption** - Military-grade encryption for all passwords
- **🔑 Master Password Protection** - Single master password protects all entries
- **🛠️ Password Generator** - Generate strong, random passwords (16-32 characters)
- **📊 Password Strength Analyzer** - Real-time strength checking with feedback
- **💾 SQLite Database** - Lightweight, local-first data storage
- **📤 Import/Export** - Encrypted JSON export, CSV support
- **🔍 Search & Filter** - Quick retrieval of password entries
- **📝 Rich Entry Details** - Service name, username, email, URL, notes, tags
- **⚡ CLI Interface** - Full-featured command-line interface
- **🎨 GUI (Coming Soon)** - Electron-based graphical interface

## 🚀 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd password-manager

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## 📖 Usage

### First Time Setup

```bash
npm run cli setup
```

You'll be prompted to create a master password. **Remember this password!** You'll need it every time you use the password manager.

### Add a Password

```bash
npm run cli add
```

Follow the prompts to enter:
- Service name (e.g., Gmail, GitHub)
- Username/Email
- Password
- Optional: URL, notes

### Retrieve a Password

```bash
npm run cli get <service>
# Example: npm run cli get Gmail
```

### List All Passwords

```bash
npm run cli list
```

### Search Passwords

```bash
npm run cli search <query>
# Example: npm run cli search email
```

### Generate Strong Password

```bash
npm run cli generate --length 20 --symbols --numbers
# Options:
# -l, --length <number>   Password length (default: 16)
# --no-uppercase          Exclude uppercase letters
# --no-lowercase          Exclude lowercase letters
# --no-numbers            Exclude numbers
# --no-symbols            Exclude symbols
```

### Check Password Strength

```bash
npm run cli strength "mypassword"
```

### Update a Password

```bash
npm run cli update <service>
```

### Delete a Password

```bash
npm run cli delete <service>
```

### Export All Passwords

```bash
# JSON (encrypted)
npm run cli export backup.json --format json

# CSV (unencrypted - use with caution!)
npm run cli export backup.csv --format csv
```

### Import Passwords

```bash
# From JSON
npm run cli import backup.json --format json

# From CSV
npm run cli import backup.csv --format csv
```

### Lock/Exit

```bash
npm run cli lock
```

## 🔐 Security Architecture

### Encryption Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: 32-byte random salt per password
- **IV (Initialization Vector)**: 16-byte random IV per password
- **Authentication Tag**: Prevents tampering

### Master Password

- **Hashing**: PBKDF2-SHA256 with 100,000 iterations
- **Salt**: 32-byte random salt stored with hash
- **Storage**: Never stored in plain text

### Data Flow

```
User Input
    ↓
Master Password Verification
    ↓
Encryption with AES-256-GCM
    ↓
SQLite Database Storage
    ↓
[Local Disk - Encrypted]
```

## 📁 Project Structure

```
password-manager/
├── src/
│   ├── core/
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── encryption.ts         # AES encryption service
│   │   ├── database.ts           # SQLite database layer
│   │   ├── passwordGenerator.ts  # Password generation
│   │   └── passwordValidator.ts  # Strength checking
│   ├── cli/
│   │   └── index.ts              # CLI interface
│   ├── gui/
│   │   └── index.ts              # Electron GUI (planned)
│   └── utils/
│       └── importExport.ts       # Import/Export utilities
├── data/
│   └── passwords.db              # SQLite database (gitignored)
├── dist/                         # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Development

### Build

```bash
npm run build
```

### Run CLI (Development)

```bash
npm run dev add
```

### Run Tests

```bash
npm test
```

### Clean

```bash
npm run clean
```

## 🔄 Commands Overview

| Command | Description |
|---------|-------------|
| `setup` | Initialize master password |
| `add` | Add new password entry |
| `get` | Retrieve a password |
| `list` | Show all entries |
| `search` | Search entries |
| `generate` | Create strong password |
| `strength` | Check password strength |
| `update` | Modify an entry |
| `delete` | Remove an entry |
| `export` | Backup passwords |
| `import` | Restore passwords |
| `lock` | Exit application |

## ⚠️ Important Security Notes

1. **Master Password**: Never forget your master password - it cannot be recovered!
2. **CSV Export**: Only use CSV for import/export with trusted applications. Avoid storing CSV files long-term.
3. **Database File**: Keep `data/passwords.db` secure. Back it up to safe locations.
4. **Master Password Strength**: Use a strong, unique master password (16+ characters recommended).
5. **Session**: Always use `lock` command to exit. Consider automatic timeout in production.

## 🗺️ Roadmap

- [ ] Electron GUI application
- [ ] Password expiry reminders
- [ ] Cloud sync support
- [ ] Two-factor authentication
- [ ] Browser extension
- [ ] Mobile app (React Native)
- [ ] Biometric unlock
- [ ] Duplicate password detection
- [ ] Breach detection integration
- [ ] Auto-fill functionality

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚖️ Disclaimer

This password manager is provided as-is. While security best practices are implemented, no software is 100% secure. Use at your own risk. For critical passwords, consider using established password managers like 1Password, Bitwarden, or LastPass.

## 🙋 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Remember**: Security is a shared responsibility. Keep your master password safe! 🔒
