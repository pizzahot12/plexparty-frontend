# AGENTS.md - PlexParty Development Guide

This file provides guidelines for agentic coding agents working on the PlexParty project.

---

## Project Structure

```
plexparty/
├── backend/                     # Node.js + Hono API
│   ├── src/
│   │   ├── routes/             # Route definitions
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Express-style middleware
│   │   ├── lib/                # Utilities (JWT, DB, FFmpeg)
│   │   ├── utils/              # Validators, logger
│   │   ├── types/              # TypeScript interfaces
│   │   └── index.ts            # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
└── (frontend will be added by AGENT_1)
```

---

## Build Commands

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to JavaScript (outputs to `dist/`) |
| `npm start` | Run production build (requires `npm run build` first) |
| `npm run preview` | Build and start production server |

### Running Tests

This project does not have a test framework configured. When adding tests:

```bash
# Example with vitest (recommended for Hono)
npm install -D vitest

# Run all tests
npm test

# Run single test file
npm test -- authController.test.ts

# Run tests matching pattern
npm test -- --run auth
```

### Docker

```bash
# Build image
docker build -t plexparty-backend ./backend

# Run container
docker run -p 3000:3000 plexparty-backend
```

---

## Code Style Guidelines

### General Rules

- Use **ES Modules** (import/export with `.js` extension)
- Use **TypeScript** with strict mode enabled
- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Use **semicolons** at end of statements
- Maximum line length: **100 characters**

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `auth.routes.ts`, `jellyfin.service.ts` |
| Functions | camelCase | `handleUserJoined`, `getMovies` |
| Classes | PascalCase | `RoomController`, `AuthService` |
| Interfaces | PascalCase | `User`, `MediaItem`, `RoomDetails` |
| Constants | UPPER_SNAKE_CASE | `MAX_ROOM_USERS`, `DEFAULT_QUALITY` |
| Variables | camelCase | `userId`, `roomCode` |
| Database fields | snake_case | `media_id`, `created_at` |

### Imports

Order imports in this sequence:

1. Node.js built-ins (`node:` prefix)
2. External libraries (hono, zod, etc.)
3. Internal modules (relative paths)

```typescript
// 1. Node.js
import path from 'node:path'
import { readFile } from 'node:fs/promises'

// 2. External
import { Hono } from 'hono'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// 3. Internal (use .js extension for ESM)
import authMiddleware from '../middleware/auth.middleware.js'
import { loginSchema } from '../utils/validators.js'
import type { User } from '../types/index.js'
import logger from '../utils/logger.js'
```

### TypeScript Guidelines

- **Always use explicit types** for function parameters and return types
- Use `interface` for object shapes, `type` for unions/aliases
- Use `unknown` instead of `any`
- Use optional properties with `?` only when truly optional

```typescript
// Good
export async function login(c: Context): Promise<Response> {
  const body = await c.req.json<LoginRequest>()
  const parsed = loginSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400)
  }
  
  return c.json({ success: true })
}

// Avoid
async function login(c) {
  const body = await c.req.json()
  // ...
}
```

### Error Handling

- Use try-catch blocks for async operations
- Return appropriate HTTP status codes
- Log errors with appropriate level

```typescript
try {
  const result = await authService.login(email, password)
  return c.json(result)
} catch (err) {
  logger.error('Login failed:', (err as Error).message)
  return c.json({ error: 'Invalid credentials' }, 401)
}
```

### Zod Validation

Use Zod for request validation:

```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password mínimo 6 caracteres'),
})

// In controller
const parsed = loginSchema.safeParse(body)
if (!parsed.success) {
  return c.json({ error: parsed.error.errors[0].message }, 400)
}
```

### Route Structure

Follow this pattern for routes:

```typescript
import { Hono } from 'hono'
import * as authController from '../controllers/authController.js'

const routes = new Hono()

routes.post('/login', authController.login)
routes.post('/register', authController.register)

export default routes
```

### Service Layer

Business logic goes in services:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { User, AuthResponse } from '../types/index.js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error || !data) {
    throw new Error('Usuario no encontrado')
  }
  
  // Verify password (use bcrypt in production)
  if (!verifyPassword(password, data.password_hash)) {
    throw new Error('Password incorrecto')
  }
  
  const token = generateToken(data.id, data.email)
  
  return {
    token,
    user: {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.avatar_url,
      created_at: data.created_at,
    },
  }
}
```

### Environment Variables

All configuration via `.env` (never commit this file):

```bash
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx
JWT_SECRET=your-secret-key
JELLYFIN_URL=http://ip:8096
JELLYFIN_API_KEY=xxx

# Optional
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:5173
```

### Git Conventions

- Branch naming: `feature/description`, `fix/description`, `hotfix/description`
- Commit messages: imperative mood, e.g., "Add user login endpoint"
- Never commit `.env`, `node_modules/`, or `dist/` files

---

## API Endpoints

### Auth (Public)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Media (Protected)
- `GET /api/media/list` - List movies/series
- `GET /api/media/:id` - Get media details

### Stream (Protected)
- `GET /api/stream/:mediaId` - Get stream URL

### Rooms (Protected)
- `POST /api/rooms` - Create room
- `GET /api/rooms/:code` - Join room by code
- `DELETE /api/rooms/:id` - Close room

### Friends (Protected)
- `GET /api/friends` - List friends
- `POST /api/friends` - Add friend
- `DELETE /api/friends/:id` - Remove friend

### WebSocket
- `WS /ws/rooms/:roomId?token=xxx` - Room real-time communication

---

## External Integrations

### Supabase
- PostgreSQL database
- Authentication helpers
- Real-time subscriptions

### Jellyfin
- Media library access
- Streaming endpoints
- API key authentication required

---

## Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `cd backend && npm run dev` |
| Build for prod | `cd backend && npm run build` |
| Run prod server | `cd backend && npm start` |
| Add dependency | `cd backend && npm install package-name` |
| Add dev dependency | `cd backend && npm install -D package-name` |
