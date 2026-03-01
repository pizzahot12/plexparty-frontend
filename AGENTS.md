# AGENTS.md - PlexParty Development Guide

Guidelines for agentic coding agents working on the PlexParty project.

## Project Overview

PlexParty is a watch party application with real-time synchronization. Users can watch movies and series together with friends.

**Architecture:**
- **Frontend**: React + TypeScript + Vite + Tailwind CSS (deployed to Vercel)
- **Backend**: Node.js + Hono + Supabase PostgreSQL + WebSocket (deployed to Render)
- **Media Server**: Jellyfin integration for streaming content

## Project Structure

```
plan-compleetao-agentes-separados/
├── src/                              # Frontend (React + Vite)
│   ├── components/                   # UI components
│   │   ├── Auth/                     # Login, Register forms
│   │   ├── Common/                   # Reusable UI (Button, Input, Card)
│   │   ├── Details/                  # Media details pages
│   │   ├── Friends/                  # Friends list, add friend
│   │   ├── Home/                     # Hero carousel, media cards
│   │   ├── Layout/                   # Header, Sidebar, Notifications
│   │   ├── Modals/                   # Create room, invite friends
│   │   ├── Watch/                    # Video player, chat, admin panel
│   │   └── ui/                       # Shadcn/UI components
│   ├── hooks/                        # Custom React hooks (useAuth, useMedia, etc.)
│   ├── lib/                          # Utilities (api-service, websocket, constants)
│   ├── pages/                        # Route pages (Home, Movies, Series, Rooms, etc.)
│   ├── stores/                       # Zustand state management
│   └── types/                        # TypeScript type definitions
├── backend/                          # Backend (Node.js + Hono)
│   ├── src/
│   │   ├── index.ts                  # Entry point (Hono app + WebSocket)
│   │   ├── routes/                   # Route definitions
│   │   ├── controllers/              # Request handling
│   │   ├── services/                 # Business logic + DB queries
│   │   ├── middleware/               # Auth, CORS, error handling
│   │   ├── lib/                      # Database, JWT, utilities
│   │   ├── types/                    # TypeScript types
│   │   └── utils/                    # Validators, logger
│   ├── supabase/migration.sql        # Database schema
│   └── package.json
├── package.json                      # Frontend dependencies
├── vite.config.ts                    # Vite configuration
├── tsconfig.json                     # TypeScript config
└── tailwind.config.js                # Tailwind CSS config
```

## Build / Dev / Test Commands

### Frontend (root directory)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite) on http://localhost:5173 |
| `npm run build` | TypeScript check + build production bundle |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

**Note**: Requires Node.js 20.19+ or 22.12+

### Backend (backend/ directory)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript (`tsc` → `dist/`) |
| `npm start` | Run production build (`node dist/index.js`) |
| `npm run preview` | Build then start |

**Docker (Backend):**
```bash
docker build -t plexparty-backend ./backend
docker run -p 3000:3000 plexparty-backend
```

**Tests**: No test framework configured yet. When adding tests, use Vitest:
```bash
npm install -D vitest
npx vitest run                                    # Run all tests
npx vitest run src/hooks/useAuth.test.ts         # Single file
npx vitest run --grep "login"                     # Pattern match
```

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=https://watch-together-2x.onrender.com/api
VITE_WS_BASE_URL=wss://watch-together-2x.onrender.com
VITE_SUPABASE_URL=https://qrtiwmyxdzthecxqdpzo.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (backend/.env)
```
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...                    (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ...       (admin key)
JELLYFIN_URL=http://...:8096
JELLYFIN_API_KEY=xxx
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
LOG_LEVEL=info
```

## Code Style

### Formatting
- **ES Modules** (`"type": "module"`)
- **TypeScript strict mode** enabled
- **2 spaces** indentation
- **Single quotes** for strings
- **Semicolons** required
- **Trailing commas** in multi-line objects/arrays
- **Max line length**: 100 characters
- **NO COMMENTS** unless explicitly requested

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `LoginForm.tsx`, `MediaCard.tsx` |
| Files (hooks) | camelCase with `use` prefix | `useAuth.ts`, `useMedia.ts` |
| Files (backend routes/services) | kebab-case | `auth.routes.ts`, `watch-history.service.ts` |
| Files (controllers) | camelCase | `authController.ts`, `roomsController.ts` |
| React components | PascalCase | `VideoPlayer`, `ChatPanel` |
| Functions / variables | camelCase | `handleUserJoined`, `roomCode` |
| Interfaces / classes | PascalCase | `User`, `MediaItem`, `RoomDetails` |
| Type aliases | PascalCase | `MediaType`, `VideoQuality` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `ROOM_CODE_LENGTH` |
| Database columns | snake_case | `media_id`, `created_at`, `host_id` |

### Import Order (Frontend)

1. React imports (`react`, `react-dom`)
2. External libraries (`lucide-react`, `zustand`, `react-router-dom`)
3. Internal components (`@/components/...`)
4. Internal hooks (`@/hooks/...`)
5. Internal utilities (`@/lib/...`)
6. Internal types (`@/types`)
7. Type-only imports last (`import type { ... }`)

Example:
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Common/Button';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api-service';
import type { User } from '@/types';
```

### Import Order (Backend)

1. Node.js built-ins (use `node:` prefix)
2. External libraries (`hono`, `zod`, `@supabase/supabase-js`)
3. Internal modules (relative paths)
4. Type-only imports last

Example:
```typescript
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { supabase } from './lib/database.js';
import type { User } from './types/index.js';
```

### TypeScript Guidelines

- **Explicit types** on function parameters and return types
- `interface` for object shapes, `type` for unions/aliases
- `unknown` instead of `any`; cast errors as `(err as Error).message`
- Avoid `as const` when `erasableSyntaxOnly` is enabled in tsconfig
- Use type imports: `import type { ... }`
- No unused imports or variables (strict mode)

### React Best Practices

- Use functional components with hooks
- Extract reusable logic into custom hooks
- Use Zustand for global state, React Query for server state
- Destructure props in function signature
- Use optional chaining for nested properties

### Error Handling

**Frontend:**
```typescript
try {
  const data = await apiService.getData();
  return data;
} catch (err) {
  console.error('Error:', (err as Error).message);
  setError((err as Error).message);
  return null;
}
```

**Backend Controllers:**
```typescript
try {
  const result = await someService.doThing(parsed.data);
  return c.json(result);
} catch (err) {
  logger.error('Context:', (err as Error).message);
  return c.json({ error: (err as Error).message }, 400);
}
```

**Backend Services:**
```typescript
if (!user) {
  throw new Error('User not found');
}
```

### Validation

Use Zod for all validation. Schemas in `utils/validators.ts` (backend) or inline (frontend):

```typescript
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password mínimo 6 caracteres'),
});

const parsed = loginSchema.safeParse(body);
if (!parsed.success) {
  return c.json({ error: parsed.error.errors[0].message }, 400);
}
```

## Architecture

### Frontend Architecture
- **Pages**: Route-level components
- **Components**: Reusable UI elements
- **Hooks**: Custom hooks for data fetching and logic
- **Stores**: Zustand stores for global state (auth, room, media)
- **API Service**: Centralized API client with auth tokens

### Backend Architecture
**Layered pattern — Routes → Controllers → Services → Lib/DB**

- **Routes**: Wire HTTP methods to controller functions. No logic.
- **Controllers**: Parse requests, validate with Zod, call services, format HTTP responses.
- **Services**: All business logic and Supabase queries. Throw errors on failure.
- **Lib**: Low-level utilities (Supabase clients, JWT, FFmpeg).

### Database Access (Backend)
Two Supabase clients in `lib/database.ts`:
- `supabase` (anon key) — respects RLS, for user-scoped operations
- `supabaseAdmin` (service role) — bypasses RLS, for backend-only operations

### WebSocket
Setup in `backend/src/index.ts` using `@hono/node-ws`. Room sync state is in-memory (`Map<string, RoomState>`), persisted to Supabase for rooms/participants/messages.

## API Endpoints

### Public
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`

### Protected (require `Authorization: Bearer <jwt>`)
- `GET /api/media/list?type=movies&skip=0&limit=20`
- `GET /api/media/:id`
- `GET /api/stream/:mediaId?quality=720p`
- `POST /api/rooms`
- `GET /api/rooms/:code`
- `DELETE /api/rooms/:roomId`
- `GET /api/friends`
- `POST /api/friends/:userId/request`
- `POST /api/friends/:friendshipId/accept`
- `DELETE /api/friends/:friendshipId`
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `DELETE /api/notifications/:id`
- `GET /api/watch-history`
- `POST /api/watch-history/progress`
- `WS /ws/rooms/:roomId?token=xxx`

### Health Check
- `GET /health`

## Git Conventions

- **Branches**: `feature/description`, `fix/description`, `hotfix/description`
- **Commits**: Imperative mood — "Add user login endpoint", "Fix room sync bug"
- **Never commit**: `.env`, `node_modules/`, `dist/`, build artifacts

## Deployment

- **Frontend**: Vercel (connected to `main` branch of plexparty-frontend repo)
- **Backend**: Render (connected to plan-compleetao-agentes-separados repo)
- **Database**: Supabase (PostgreSQL with RLS)
- **Media**: Jellyfin server

## Common Tasks

### Add a new API endpoint
1. Add route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add service logic in `backend/src/services/`
4. Add validation schema in `backend/src/utils/validators.ts`
5. Update frontend `src/lib/api-service.ts`

### Add a new page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/lib/constants.ts` (SIDEBAR_ITEMS)

### Add a new hook
1. Create file in `src/hooks/` with `use` prefix
2. Export from hook file
3. Import and use in components

### Debug WebSocket issues
1. Check `src/lib/websocket-service.ts` connection logic
2. Verify token is being sent correctly
3. Check backend WebSocket handlers in `backend/src/index.ts`
4. Use browser DevTools Network tab → WS tab
