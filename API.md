# API Reference - Multi-User Password Manager

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT authentication via the `Authorization` header.

### Header Format

```
Authorization: Bearer <accessToken>
```

### Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "data": {},
  "error": "string (optional)",
  "errors": [{ "field": "string", "message": "string" }],
  "timestamp": "ISO 8601 datetime"
}
```

---

## Endpoints

### Authentication

#### Register User

**Endpoint**
```http
POST /auth/register
```

**Description**: Create a new user account

**Headers**
```
Content-Type: application/json
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!@",
  "confirmPassword": "SecurePass123!@"
}
```

**Password Requirements**
- Minimum 12 characters
- Must contain uppercase letter (A-Z)
- Must contain lowercase letter (a-z)
- Must contain number (0-9)
- Must contain special character (@$!%*?&)

**Success Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-05-14T10:30:00Z",
    "passwordCount": 0
  },
  "timestamp": "2024-05-14T10:30:00Z"
}
```

**Error Responses**
```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 12 characters long"
    }
  ],
  "timestamp": "2024-05-14T10:30:00Z"
}
```

**Rate Limit**: 5 requests per 15 minutes per IP

---

#### Login

**Endpoint**
```http
POST /auth/login
```

**Description**: Authenticate user and get JWT token

**Headers**
```
Content-Type: application/json
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!@"
}
```

**Success Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-05-14T10:30:00Z",
      "lastLogin": "2024-05-14T12:30:00Z",
      "passwordCount": 5
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  },
  "timestamp": "2024-05-14T12:30:00Z"
}
```

**Error Response** (401 Unauthorized)
```json
{
  "success": false,
  "error": "Invalid email or password",
  "timestamp": "2024-05-14T12:30:00Z"
}
```

**Rate Limit**: 5 requests per 15 minutes per IP

---

#### Get Current User

**Endpoint**
```http
GET /auth/me
```

**Description**: Get authenticated user's profile

**Headers**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Success Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-05-14T10:30:00Z",
    "lastLogin": "2024-05-14T12:30:00Z",
    "passwordCount": 5
  },
  "timestamp": "2024-05-14T12:30:00Z"
}
```

**Error Response** (401 Unauthorized)
```json
{
  "success": false,
  "error": "Missing or invalid authorization header",
  "timestamp": "2024-05-14T12:30:00Z"
}
```

---

#### Change Password

**Endpoint**
```http
POST /auth/change-password
```

**Description**: Change authenticated user's password

**Headers**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body**
```json
{
  "currentPassword": "SecurePass123!@",
  "newPassword": "NewSecurePass456!@"
}
```

**Success Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  },
  "timestamp": "2024-05-14T12:30:00Z"
}
```

**Error Responses**
```json
{
  "success": false,
  "error": "Current password is incorrect",
  "timestamp": "2024-05-14T12:30:00Z"
}
```

---

#### Logout

**Endpoint**
```http
POST /auth/logout
```

**Description**: Logout user (token removal on client-side)

**Headers**
```
Authorization: Bearer <accessToken>
```

**Success Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "timestamp": "2024-05-14T12:30:00Z"
}
```

---

### Passwords

#### Create Password Entry

**Endpoint**
```http
POST /passwords
```

**Description**: Create a new password entry

**Headers**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body**
```json
{
  "service": "Gmail",
  "username": "john.doe@gmail.com",
  "email": "john.doe@gmail.com",
  "password": "ActualPassword123!",
  "url": "https://mail.google.com",
  "notes": "Primary work email",
  "tags": ["email", "work"]
}
```

**Field Details**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| service | string | Yes | Service/app name (max 255 chars) |
| username | string | Yes | Username (max 255 chars) |
| email | string | No | Email address |
| password | string | Yes | Password to store (encrypted) |
| url | string | No | Service URL |
| notes | string | No | Additional notes (max 2000 chars) |
| tags | array | No | Tags for organization |

**Success Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "service": "Gmail",
    "username": "john.doe@gmail.com",
    "email": "john.doe@gmail.com",
    "password": "ActualPassword123!",
    "url": "https://mail.google.com",
    "notes": "Primary work email",
    "tags": ["email", "work"],
    "createdAt": "2024-05-14T12:30:00Z",
    "updatedAt": "2024-05-14T12:30:00Z"
  },
  "timestamp": "2024-05-14T12:30:00Z"
}
```

**Error Response** (400 Bad Request)
```json
{
  "success": false,
  "errors": [
    {
      "field": "service",
      "message": "Service name is required"
    }
  ],
  "timestamp": "2024-05-14T12:30:00Z"
}
```

**Rate Limit**: 10 requests per minute per user

---

#### List Passwords

**Endpoint**
```http
GET /passwords?page=1&pageSize=10&search=gmail
```

**Description**: List user's passwords with pagination (NEVER returns all at once)

**Headers**
```
Authorization: Bearer <accessToken>
```

**Query Parameters**
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| page | integer | 1 | - | Page number (1-indexed) |
| pageSize | integer | 10 | 50 | Items per page |
| search | string | - | - | Search in service, username, email |
| tags | string | - | - | Filter by tags |

**Success Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "passwords": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "service": "Gmail",
        "username": "john.doe@gmail.com",
        "email": "john.doe@gmail.com",
        "password": "ActualPassword123!",
        "url": "https://mail.google.com",
        "notes": "Primary work email",
        "tags": ["email", "work"],
        "createdAt": "2024-05-14T12:30:00Z",
        "updatedAt": "2024-05-14T12:30:00Z"
      }
    ],
    "count": 1,
    "page": 1,
    "pageSize": 10
  },
  "timestamp": "2024-05-14T12:30:00Z"
}
```

**Important**: List endpoint returns maximum of 50 items per page to prevent data exposure.

---

#### Get Single Password

**Endpoint**
```http
GET /passwords/{id}
```

**Description**: Get a specific password entry

**Headers**
```
Authorization: Bearer <accessToken>
```

**URL Parameters**
- `id` (string, UUID): Password entry ID

**Success Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "service": "Gmail",
    "username": "john.doe@gmail.com",
    "password": "ActualPassword123!",
    "createdAt": "2024-05-14T12:30:00Z",
    "updatedAt": "2024-05-14T12:30:00Z"
  },
  "timestamp": "2024-05-14T12:30:00Z"
}
```

**Error Response** (404 Not Found)
```json
{
  "success": false,
  "error": "Password entry not found",
  "timestamp": "2024-05-14T12:30:00Z"
}
```

---

#### Update Password Entry

**Endpoint**
```http
PATCH /passwords/{id}
```

**Description**: Update a password entry

**Headers**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body** (all fields optional, at least one required)
```json
{
  "password": "NewPassword456!",
  "notes": "Updated notes",
  "tags": ["email", "personal"]
}
```

**Success Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "service": "Gmail",
    "username": "john.doe@gmail.com",
    "password": "NewPassword456!",
    "notes": "Updated notes",
    "tags": ["email", "personal"],
    "updatedAt": "2024-05-14T13:45:00Z"
  },
  "timestamp": "2024-05-14T13:45:00Z"
}
```

**Rate Limit**: 10 requests per minute per user

---

#### Delete Password Entry

**Endpoint**
```http
DELETE /passwords/{id}
```

**Description**: Delete a password entry

**Headers**
```
Authorization: Bearer <accessToken>
```

**URL Parameters**
- `id` (string, UUID): Password entry ID

**Success Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Password entry deleted successfully"
  },
  "timestamp": "2024-05-14T13:45:00Z"
}
```

**Error Response** (404 Not Found)
```json
{
  "success": false,
  "error": "Password entry not found",
  "timestamp": "2024-05-14T13:45:00Z"
}
```

**Rate Limit**: 10 requests per minute per user

---

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

---

## Error Handling

### Validation Errors

```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address",
      "code": "string.email"
    }
  ],
  "timestamp": "2024-05-14T12:30:00Z"
}
```

### Authentication Errors

```json
{
  "success": false,
  "error": "Invalid email or password",
  "timestamp": "2024-05-14T12:30:00Z"
}
```

### Rate Limit Errors

```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later",
  "timestamp": "2024-05-14T12:30:00Z"
}
```

**Headers**
```
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset-After: 897
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/register | 5 | 15 min |
| POST /auth/login | 5 | 15 min |
| Password CRUD | 10 | 1 min |
| General API | 100 | 15 min |

---

## Examples

### cURL Examples

**Register**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!@",
    "confirmPassword": "SecurePass123!@"
  }'
```

**Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!@"
  }'
```

**Create Password**
```bash
curl -X POST http://localhost:3000/api/v1/passwords \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "GitHub",
    "username": "john_doe",
    "password": "MyGitHubToken123"
  }'
```

**List Passwords**
```bash
curl -X GET "http://localhost:3000/api/v1/passwords?page=1&pageSize=10" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Pagination Best Practices

Always use pagination when retrieving lists:

```bash
# ✅ CORRECT - with pagination
GET /passwords?page=1&pageSize=10

# ❌ INCORRECT - no pagination
GET /passwords/all
```

Maximum page size is 50 items. For large datasets, iterate through pages:

```bash
for page in 1 2 3 4 5; do
  curl -H "Authorization: Bearer <TOKEN>" \
    "http://localhost:3000/api/v1/passwords?page=$page&pageSize=50"
done
```

---

## User Isolation Security

Every password entry is isolated to the user who created it:

- Users can only read their own passwords
- Users can only modify their own passwords
- Users can only delete their own passwords
- Database queries automatically filter by user ID
- No endpoint can be exploited to access other users' passwords

---

## Support

For API issues:
- Check rate limit headers
- Verify JWT token is valid
- Ensure Content-Type is application/json
- Review error messages and validation errors
