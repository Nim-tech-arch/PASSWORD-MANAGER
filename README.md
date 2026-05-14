# 🔐 Multi-User Secure Password Manager API

A modern, TypeScript-based multi-user password manager API with end-to-end encryption, JWT authentication, role-based access control, and PostgreSQL backend. Built with Express.js and designed for scalable cloud deployment.

## 🏗️ System Architecture

```
User → Frontend → API Gateway (v1) → Auth Layer → Database
                   ↓
            Rate Limiting
            Validation (Joi)
            Authorization (RBAC)
```

### Core Architecture Features

- **Multi-User System**: Each user's passwords are completely isolated (multi-tenant)
- **JWT Authentication**: Stateless, scalable token-based authentication
- **Role-Based Access Control (RBAC)**: Admin, User, Viewer roles
- **User Isolation**: No user can access another user's passwords
- **API Versioning**: v1 endpoints for backward compatibility
- **Rate Limiting**: Endpoint-specific rate limits to prevent abuse
- **Data Encryption**: AES-256-GCM encryption for all stored passwords
- **PostgreSQL**: Robust relational database for multi-user support

## ✨ Core Features

### Authentication & User Management
- ✅ **User Registration** - Create new accounts with email validation
- ✅ **User Login** - JWT token generation (24-hour expiration)
- ✅ **Password Management** - Change password securely
- ✅ **User Profiles** - View own profile with metadata
- ✅ **Role-Based Access** - Admin, User, and Viewer roles

### Password Management
- ✅ **Create Password Entries** - Add new password entries with metadata
- ✅ **Read Passwords** - Retrieve encrypted passwords (decrypted on demand)
- ✅ **Update Entries** - Modify password information
- ✅ **Delete Entries** - Securely remove password entries
- ✅ **Search & Filter** - Find passwords by service, username, or email
- ✅ **Pagination** - Never returns all passwords at once (security feature)
- ✅ **User Isolation** - Users only access their own passwords

### Security Features
- 🔒 **AES-256-GCM Encryption** - Military-grade password encryption
- 🔐 **JWT Authentication** - Secure token-based sessions
- 🛡️ **Helmet.js** - HTTP security headers
- 🚫 **CORS Protection** - Configurable CORS policy
- 🔄 **Rate Limiting** - Prevents brute force and abuse
  - Auth endpoints: 5 requests per 15 minutes
  - Password operations: 10 requests per minute
  - General API: 100 requests per 15 minutes
- ✔️ **Input Validation** - Joi schema validation on all inputs
- 🔒 **Password Hashing** - bcryptjs with salt (10 rounds)

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 12+ (or use Docker)
- Docker & Docker Compose (optional)

### Option 1: Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd password-manager

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# IMPORTANT: Change JWT_SECRET and ENCRYPTION_KEY in production

# Build TypeScript
npm run build

# Start PostgreSQL (if not using Docker)
# Make sure PostgreSQL is running on localhost:5432
```

### Option 2: Docker Setup (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd password-manager

# Create .env file
cp .env.example .env

# Start with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f api
```

## 📖 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!@",
  "confirmPassword": "SecurePass123!@"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-05-14T00:00:00Z"
  }
}
```

**Password Requirements:**
- Minimum 12 characters
- Must include uppercase, lowercase, number, and special character
- Example: `SecurePass123!@`

#### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!@"
}

Response 200:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-05-14T00:00:00Z",
      "lastLogin": "2024-05-14T12:30:00Z",
      "passwordCount": 5
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "expiresIn": 86400
    }
  }
}
```

#### 3. Get Current User
```http
GET /auth/me
Authorization: Bearer <accessToken>

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-05-14T00:00:00Z",
    "lastLogin": "2024-05-14T12:30:00Z",
    "passwordCount": 5
  }
}
```

#### 4. Change Password
```http
POST /auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "SecurePass123!@",
  "newPassword": "NewSecurePass456!@"
}

Response 200:
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

### Password Endpoints

#### 1. Create Password Entry
```http
POST /passwords
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "service": "Gmail",
  "username": "myemail@gmail.com",
  "email": "myemail@gmail.com",
  "password": "ActualPassword123",
  "url": "https://mail.google.com",
  "notes": "Primary work email",
  "tags": ["email", "work"]
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "service": "Gmail",
    "username": "myemail@gmail.com",
    "email": "myemail@gmail.com",
    "password": "ActualPassword123",
    "url": "https://mail.google.com",
    "notes": "Primary work email",
    "tags": ["email", "work"],
    "createdAt": "2024-05-14T00:00:00Z",
    "updatedAt": "2024-05-14T00:00:00Z"
  }
}
```

#### 2. List Passwords (Paginated)
```http
GET /passwords?page=1&pageSize=10&search=gmail
Authorization: Bearer <accessToken>

Response 200:
{
  "success": true,
  "data": {
    "passwords": [
      { /* password objects */ }
    ],
    "count": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

**IMPORTANT**: Never returns all passwords at once. Must paginate with `pageSize` (max 50).

#### 3. Get Single Password
```http
GET /passwords/{id}
Authorization: Bearer <accessToken>

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "service": "Gmail",
    "username": "myemail@gmail.com",
    "password": "ActualPassword123",
    /* ... other fields ... */
  }
}
```

#### 4. Update Password Entry
```http
PATCH /passwords/{id}
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "password": "NewPassword456",
  "notes": "Updated notes"
}

Response 200:
{
  "success": true,
  "data": { /* updated password object */ }
}
```

#### 5. Delete Password Entry
```http
DELETE /passwords/{id}
Authorization: Bearer <accessToken>

Response 200:
{
  "success": true,
  "data": {
    "message": "Password entry deleted successfully"
  }
}
```

## 🔐 Security Considerations

### User Isolation (Multi-Tenant)
- **Every password must belong to a specific user** (`userId` field)
- Users can only access their own passwords
- Database queries filter by `userId` automatically
- No endpoint returns passwords without user context

### API Response Security
- **Passwords are never returned** in list endpoints (encrypted only)
- Individual password retrieval returns **decrypted** password (with auth required)
- User endpoints never expose password hashes

### Rate Limiting Strategy

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 5 | 15 min |
| `/auth/login` | 5 | 15 min |
| Password CRUD | 10 | 1 min |
| General API | 100 | 15 min |

### Environment Variables
```env
JWT_SECRET=change-this-in-production-32-chars-min
ENCRYPTION_KEY=change-this-in-production-32-chars
DB_PASSWORD=strong-password-here
NODE_ENV=production
```

## 🎯 Deployment

### Cloud Deployment (AWS, Heroku, DigitalOcean)

#### Using Docker

```bash
# Build image
docker build -t password-manager-api .

# Push to registry (example: Docker Hub)
docker tag password-manager-api:latest myrepo/password-manager-api:latest
docker push myrepo/password-manager-api:latest

# Deploy to cloud (example: AWS ECS, Heroku, K8s)
```

#### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host.rds.amazonaws.com
DB_PORT=5432
DB_USER=prod_user
DB_PASSWORD=very-strong-password
DB_NAME=password_manager_prod
JWT_SECRET=generate-a-random-secret-key-32-chars
ENCRYPTION_KEY=generate-a-random-key-32-chars
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

#### PostgreSQL Setup

Option 1: AWS RDS
```bash
# Create RDS instance
# Configure security groups to allow access from app
# Update DB_HOST to RDS endpoint
```

Option 2: Self-hosted
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
createdb password_manager

# Create user
createuser -P password_manager_user
```

### API Versioning

- **Current Version**: v1 (`/api/v1/*`)
- **Future**: v2, v3 can coexist without breaking existing clients
- Version endpoints: `/api/v1/`, `/api/v2/`, `/api/v3/`

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm test:watch

# Coverage
npm test:coverage
```

### API Testing with cURL

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"SecurePass123!@",
    "confirmPassword":"SecurePass123!@"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"SecurePass123!@"
  }'

# Create Password (replace TOKEN with actual JWT)
curl -X POST http://localhost:3000/api/v1/passwords \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service":"GitHub",
    "username":"myusername",
    "password":"MyGithubToken123"
  }'

# List Passwords
curl -X GET "http://localhost:3000/api/v1/passwords?page=1&pageSize=10" \
  -H "Authorization: Bearer TOKEN"
```

## 📁 Project Structure

```
src/
├── api.ts                 # Main Express server
├── core/
│   ├── database.ts       # TypeORM PostgreSQL setup
│   ├── entities/         # Database entities
│   │   ├── User.ts
│   │   └── PasswordEntry.ts
│   ├── encryption.ts     # AES-256-GCM encryption
│   ├── types.ts          # TypeScript interfaces
│   └── validation.ts     # Joi validation schemas
├── middleware/
│   ├── auth.ts           # JWT middleware & RBAC
│   ├── errorHandler.ts   # Error handling
│   └── rateLimiter.ts    # Rate limiting
├── routes/
│   └── v1/
│       ├── auth.ts       # Authentication routes
│       └── passwords.ts  # Password CRUD routes
├── services/
│   ├── AuthService.ts    # User registration/login logic
│   └── PasswordService.ts # Password CRUD logic
└── utils/
    └── logger.ts         # Pino logger
```

## 🚢 Docker Deployment

### Quick Start
```bash
docker-compose up
```

### For Production
```bash
# Update .env with production values
nano .env

# Build and run
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## 📊 Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `passwordHash` (VARCHAR)
- `passwordSalt` (VARCHAR)
- `role` (ENUM: admin, user, viewer)
- `isActive` (BOOLEAN)
- `twoFactorEnabled` (BOOLEAN)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)
- `lastLogin` (TIMESTAMP, nullable)

### PasswordEntries Table
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → Users)
- `service` (VARCHAR)
- `username` (VARCHAR)
- `email` (VARCHAR, nullable)
- `encryptedPassword` (TEXT)
- `url` (VARCHAR, nullable)
- `notes` (TEXT, nullable)
- `tags` (ARRAY, nullable)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)
- `lastUsed` (TIMESTAMP, nullable)

## 🔄 Development Workflow

### Start Development Server
```bash
npm run api:dev
```

### Build for Production
```bash
npm run build
npm run api
```

### Database Migrations
```bash
npm run db:migrate
npm run db:seed
```

## 🆘 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U postgres -d postgres -c "SELECT 1"

# Check connection string in .env
# DB_HOST should be 'localhost' for local, 'postgres' for Docker
```

### Rate Limit Hit
- Auth endpoints: Wait 15 minutes
- Password operations: Wait 1 minute
- Check `X-RateLimit-Reset-After` header

### JWT Token Expired
- Re-login to get a new token
- Token expires in 24 hours

## 📝 Environment Configuration

```env
# See .env.example for complete list
NODE_ENV=development              # or 'production'
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=password_manager
JWT_SECRET=your-secret-key        # Change in production!
ENCRYPTION_KEY=your-encryption-key # Change in production!
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/name`
5. Submit pull request

## 📄 License

MIT - See LICENSE file

## 🔗 Resources

- [Express.js Documentation](https://expressjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Security Guidelines](https://owasp.org)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Email: support@passwordmanager.example
- Documentation: [Docs site]

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


## 🙋 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Remember**: Security is a shared responsibility. Keep your master password safe! 🔒
