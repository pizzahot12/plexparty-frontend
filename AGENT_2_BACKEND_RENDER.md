# ⚙️ BACKEND PARA RENDER - PlexParty
## Node.js + Hono + FFmpeg + WebSocket

---

## 📝 CONTEXTO

Este es el **backend** que corre en Render.com ($5/mes).

**¿Qué hace?**
1. Recibe peticiones HTTP del Frontend (React)
2. Obtiene películas de Jellyfin (Orange Pi)
3. Transcondifica videos con FFmpeg a diferentes calidades
4. Sincroniza reproducción en tiempo real (WebSocket)
5. Gestiona salas, amigos, chat
6. Se conecta a Supabase para guardar datos

---

## 🏗️ ESTRUCTURA

```
backend/
├── src/
│   ├── index.ts                    # Punto de entrada
│   │
│   ├── routes/
│   │   ├── auth.routes.ts         # POST /api/auth/login, register
│   │   ├── media.routes.ts        # GET /api/media/list, /api/media/:id
│   │   ├── stream.routes.ts       # GET /api/stream/:id?quality=720p
│   │   ├── rooms.routes.ts        # CRUD salas + WebSocket
│   │   └── friends.routes.ts      # GET/POST amigos
│   │
│   ├── controllers/
│   │   ├── authController.ts      # Login/register lógica
│   │   ├── mediaController.ts     # Obtener películas
│   │   ├── streamController.ts    # FFmpeg + proxy stream
│   │   ├── roomsController.ts     # Gestión salas
│   │   └── friendsController.ts   # Gestión amigos
│   │
│   ├── services/
│   │   ├── jellyfin.service.ts    # Llamadas API Jellyfin
│   │   ├── ffmpeg.service.ts      # Orquestación FFmpeg
│   │   ├── auth.service.ts        # JWT generation
│   │   └── room.service.ts        # Lógica salas
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT validation
│   │   ├── errorHandler.ts        # Error handling
│   │   └── cors.ts                # CORS config
│   │
│   ├── lib/
│   │   ├── database.ts            # Supabase client
│   │   ├── jwt.ts                 # JWT utils
│   │   └── ffmpeg.ts              # FFmpeg wrapper
│   │
│   ├── types/
│   │   └── index.ts               # Interfaces TypeScript
│   │
│   └── utils/
│       ├── validators.ts          # Zod validation
│       └── logger.ts              # Logging
│
├── .env.example
├── .dockerignore
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 📡 RUTAS API

### AUTH
```
POST /api/auth/login
Body: { email, password }
Response: { token, user: { id, email, name } }

POST /api/auth/register
Body: { email, password, name }
Response: { token, user: { id, email, name } }

POST /api/auth/logout
Response: { success: true }
```

### MEDIA
```
GET /api/media/list?type=movies&skip=0&limit=20
Response: [
  {
    id: "movie-123",
    title: "Jurassic Park",
    poster: "url",
    backdrop: "url",
    rating: 8.5,
    year: 1993,
    duration: 7200,
    synopsis: "...",
    genres: ["Acción", "Ciencia Ficción"]
  }
]

GET /api/media/:id
Response: {
  id: "movie-123",
  title: "Jurassic Park",
  poster: "url",
  backdrop: "url",
  rating: 8.5,
  year: 1993,
  duration: 7200,
  synopsis: "...",
  genres: ["Acción", "Ciencia Ficción"],
  cast: [
    { name: "Sam Neill", role: "Alan Grant" },
    { name: "Laura Dern", role: "Ellie Sattler" }
  ],
  subtitles: ["es", "en", "pt"], // Idiomas disponibles
  audio: ["es", "en"]
}
```

### STREAM (Video)
```
GET /api/stream/:mediaId?quality=720p&subtitle=es&audio=es
Response: HLS stream URL

Calidades disponibles:
- 1080p (5000 Kbps) - para ti
- 720p (2500 Kbps) - normal
- 480p (1000 Kbps) - móvil
- 360p (500 Kbps) - conexión lenta (pareja 1 Mb)

FFmpeg comando interno:
ffmpeg -i <jellyfin-url> \
  -vf scale=1280:720 \
  -b:v 2500k \
  -c:v libx264 \
  -preset veryfast \
  -c:a aac \
  -f hls \
  -hls_time 10 \
  pipe:1
```

### ROOMS (Salas de reproducción)
```
POST /api/rooms
Body: { mediaId, name, isPrivate }
Response: { roomId, code: "ABC123", ...}

GET /api/rooms/:code
Response: {
  roomId: "room-123",
  code: "ABC123",
  mediaId: "movie-123",
  host: { id, name, avatar },
  participants: [
    { id, name, avatar, isWatching: true },
    { id, name, avatar, isWatching: false }
  ],
  createdAt: "2024-01-01T10:00:00Z"
}

POST /api/rooms/:roomId/messages
Body: { text }
Response: { messageId, text, userId, userName, timestamp }

DELETE /api/rooms/:roomId
(Solo host)
Response: { success: true }

POST /api/rooms/:roomId/kick/:userId
(Solo host, expulsa usuario)
Response: { success: true }

GET /api/rooms/:roomId/sync
Response: { status: "play"|"pause", currentTime, playedBy }
```

### FRIENDS
```
GET /api/friends
Response: [
  { id, name, avatar, status: "online"|"offline", watching: "movie-123" }
]

POST /api/friends/:userId/add
Body: { code } (código de amistad)
Response: { success: true }

DELETE /api/friends/:userId
Response: { success: true }
```

---

## 🔌 WEBSOCKET

### Conexión
```javascript
ws.connect(`wss://backend.render.com/rooms/${roomId}`)
```

### Eventos FROM servidor → Frontend
```
"user_joined"
{ userId, userName, avatar }

"user_left"
{ userId }

"play"
{ currentTime, playedBy }

"pause"
{ currentTime, pausedBy }

"seek"
{ currentTime, seekBy }

"message"
{ messageId, text, userId, userName, timestamp }

"user_kicked"
{ userId, reason: "host_kicked" }

"room_closed"
{ reason: "host_closed" | "empty_timeout" }
```

### Eventos TO servidor ← Frontend
```
"play"
{ currentTime }

"pause"
{ currentTime }

"seek"
{ currentTime }

"chat_message"
{ text }

"quality_changed"
{ quality: "720p" }
```

---

## 🔧 IMPLEMENTACIÓN (código básico)

### index.ts
```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth.routes'
import mediaRoutes from './routes/media.routes'
import streamRoutes from './routes/stream.routes'
import roomsRoutes from './routes/rooms.routes'
import friendsRoutes from './routes/friends.routes'
import authMiddleware from './middleware/auth'
import errorHandler from './middleware/errorHandler'

const app = new Hono()

// Middleware
app.use(cors())
app.use(errorHandler)

// Rutas públicas
app.route('/api/auth', authRoutes)

// Rutas privadas
app.use('/api/*', authMiddleware)
app.route('/api/media', mediaRoutes)
app.route('/api/stream', streamRoutes)
app.route('/api/rooms', roomsRoutes)
app.route('/api/friends', friendsRoutes)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

export default app
```

### auth.routes.ts
```typescript
import { Hono } from 'hono'
import * as authController from '../controllers/authController'

const routes = new Hono()

routes.post('/login', authController.login)
routes.post('/register', authController.register)
routes.post('/logout', authController.logout)

export default routes
```

### media.routes.ts
```typescript
import { Hono } from 'hono'
import * as mediaController from '../controllers/mediaController'

const routes = new Hono()

routes.get('/list', mediaController.getMediaList)
routes.get('/:id', mediaController.getMediaDetails)

export default routes
```

### stream.routes.ts
```typescript
import { Hono } from 'hono'
import * as streamController from '../controllers/streamController'

const routes = new Hono()

// GET /api/stream/:mediaId?quality=720p&subtitle=es&audio=es
routes.get('/:mediaId', streamController.getStream)

export default routes
```

### rooms.routes.ts (con WebSocket)
```typescript
import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/ws'
import * as roomsController from '../controllers/roomsController'

const routes = new Hono()

// REST
routes.post('/', roomsController.createRoom)
routes.get('/:code', roomsController.getRoomByCode)
routes.post('/:roomId/messages', roomsController.addMessage)
routes.delete('/:roomId', roomsController.deleteRoom)
routes.post('/:roomId/kick/:userId', roomsController.kickUser)

// WebSocket
routes.get(
  '/:roomId/ws',
  upgradeWebSocket((c) => {
    const roomId = c.req.param('roomId')
    const userId = c.get('userId')

    return {
      onOpen: async (evt, ws) => {
        // Usuario se conectó
        await roomsController.handleUserJoined(roomId, userId)
        ws.send(JSON.stringify({
          type: 'connection_established',
          roomId
        }))
      },
      onMessage: async (evt, ws) => {
        // Recibir evento del cliente
        const data = JSON.parse(evt.data)
        await roomsController.handleWebSocketMessage(roomId, userId, data, ws)
      },
      onClose: async (evt, ws) => {
        // Usuario se desconectó
        await roomsController.handleUserLeft(roomId, userId)
      }
    }
  })
)

export default routes
```

### streamController.ts (FFmpeg)
```typescript
import { Context } from 'hono'
import { getStreamUrl } from '../services/ffmpeg.service'
import { getMedia } from '../services/jellyfin.service'

export const getStream = async (c: Context) => {
  const mediaId = c.req.param('mediaId')
  const quality = c.req.query('quality') || '720p'
  const subtitle = c.req.query('subtitle') || 'es'
  const audio = c.req.query('audio') || 'es'

  try {
    // 1. Obtener info de Jellyfin
    const media = await getMedia(mediaId)
    
    // 2. Generar URL FFmpeg con parámetros
    const streamUrl = await getStreamUrl(mediaId, {
      quality,
      subtitle,
      audio
    })

    // 3. Retornar URL o proxy stream
    return c.json({
      url: streamUrl,
      type: 'hls',
      quality,
      subtitle,
      audio
    })
  } catch (error) {
    return c.json({ error: 'Stream failed' }, 500)
  }
}
```

### ffmpeg.service.ts
```typescript
import { spawn } from 'child_process'
import type { Readable } from 'stream'

interface StreamOptions {
  quality: '360p' | '480p' | '720p' | '1080p'
  subtitle?: string
  audio?: string
}

const qualityMap = {
  '360p': { scale: '640:360', bitrate: '500k' },
  '480p': { scale: '854:480', bitrate: '1000k' },
  '720p': { scale: '1280:720', bitrate: '2500k' },
  '1080p': { scale: '1920:1080', bitrate: '5000k' }
}

export const getStreamUrl = async (
  jellyfinUrl: string,
  options: StreamOptions
): Promise<Readable> => {
  const settings = qualityMap[options.quality]

  const args = [
    '-i', jellyfinUrl,
    '-vf', `scale=${settings.scale}`,
    '-b:v', settings.bitrate,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-f', 'hls',
    '-hls_time', '10',
    'pipe:1'
  ]

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args)
    
    ffmpeg.on('error', reject)
    ffmpeg.on('exit', (code) => {
      if (code !== 0) reject(new Error(`FFmpeg exited with code ${code}`))
    })

    resolve(ffmpeg.stdout)
  })
}
```

---

## 📦 package.json

```json
{
  "name": "plexparty-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "preview": "npm run build && npm start"
  },
  "dependencies": {
    "hono": "^3.x",
    "zod": "^3.x",
    "@supabase/supabase-js": "^2.x",
    "dotenv": "^16.x",
    "jsonwebtoken": "^9.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tsx": "^4.x",
    "@types/node": "^20.x",
    "@types/jsonwebtoken": "^9.x"
  }
}
```

---

## 🌍 .env.example

```
# Render deployment
PORT=3000
NODE_ENV=production

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx

# JWT
JWT_SECRET=tu-super-secret-key-cambiar-en-produccion

# Orange Pi Jellyfin
JELLYFIN_URL=http://tu-orange-pi-ip:8096
JELLYFIN_API_KEY=tu-api-key-jellyfin

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://tu-dominio.com

# Logs
LOG_LEVEL=info
```

---

## 🐳 Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY tsconfig.json .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## ✅ CHECKLIST BACKEND

- [ ] Estructura carpetas creada
- [ ] Routes auth (login/register)
- [ ] Routes media (list/details)
- [ ] Route stream (FFmpeg)
- [ ] Routes rooms (CRUD)
- [ ] WebSocket rooms (sync)
- [ ] Supabase client configurado
- [ ] JWT auth middleware
- [ ] CORS configurado
- [ ] FFmpeg wrapper
- [ ] Jellyfin API wrapper
- [ ] Error handling
- [ ] Validación Zod
- [ ] .env variables
- [ ] Docker configurado
- [ ] Deploy a Render

---

## 🚀 DEPLOY EN RENDER

1. Push código a GitHub
2. Ir a render.com
3. Click "New +"
4. Select "Web Service"
5. Conectar repo GitHub
6. Configuración:
   - Name: `plexparty-api`
   - Environment: `Node`
   - Build: `npm install`
   - Start: `npm start`
7. Agregar variables entorno (.env)
8. Deploy

Backend disponible en: `https://plexparty-api.onrender.com`

---

## 💬 NOTAS

- FFmpeg debe estar instalado en Render (viene por defecto)
- Jellyfin debe ser accesible desde Render (IP público o VPN)
- WebSocket usa Hono nativo
- Supabase maneja auth, BD y realtime chat
