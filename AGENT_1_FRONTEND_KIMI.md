# 🎨 FRONTEND PARA KIMI - PlexParty
## Aplicación Netflix-style para ver películas en grupo

---

## 📝 CONTEXTO PARA KIMI

Hola Kimi, necesito que hagas el **frontend de una aplicación de streaming personal**.

**¿Qué es PlexParty?**
Una app tipo Netflix donde puedo:
1. Ver mis películas y series (están en Jellyfin/Plex en mi Orange Pi)
2. Ver películas con mi pareja en tiempo real (sincronizadas)
3. Chatear mientras vemos
4. Elegir calidad de video (porque mi pareja tiene internet lento)
5. Ver subtítulos en diferentes idiomas
6. Invitar amigos a salas privadas

**¿Quién hace qué?**
- **Tú (Kimi):** Frontend (la interfaz bonita que ves)
- **Otro agente:** Backend (el trabajo pesado en servidor)
- **Otro agente:** Base de datos (guardar usuarios, historial, amigos)

**¿Cuándo se comunican?**
- Tú (Frontend) envías peticiones HTTP a Backend
- Backend obtiene videos de Jellyfin y transcodifica
- Supabase guarda datos (usuarios, amigos, historial)
- WebSocket sincroniza videos en tiempo real

---

## 🎯 ESPECIFICACIONES DEL FRONTEND

### TECH STACK
```
- React 18 + Vite (rápido)
- Tailwind CSS (estilos Netflix-style)
- React Router (navegación)
- Zustand (estado global)
- TanStack Query (datos del backend)
- Plyr.js + HLS.js (reproductor video)
- Supabase JS (auth + realtime chat)
- Lucide-react (iconos)
```

### DISEÑO VISUAL
```
Inspiración: Netflix + Jellyfin
- Dark mode (fondo gris oscuro #1a1a1a)
- Colores: Naranja (#ff6b35) para acciones
- Rounded corners (16px)
- Glassmorphism (efectos glass)
- Animations (smooth transitions)
```

---

## 📂 ESTRUCTURA DE CARPETAS

```
frontend/
├── public/
│   └── logo.svg
├── src/
│   ├── App.tsx                          # Router principal
│   ├── main.tsx                         # Entry point
│   ├── index.css                        # Tailwind global
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.tsx              # Navbar con logo, search, notificaciones
│   │   │   ├── Sidebar.tsx             # Menú lateral (películas, series, amigos)
│   │   │   └── Notification.tsx        # Toast notificaciones top-right
│   │   │
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx           # Email + password
│   │   │   └── RegisterForm.tsx        # Email + password + nombre
│   │   │
│   │   ├── Home/
│   │   │   ├── HeroCarousel.tsx        # Banner principal
│   │   │   ├── MediaCarousel.tsx       # Carrusel películas/series
│   │   │   └── MediaCard.tsx           # Card individual película
│   │   │
│   │   ├── Details/
│   │   │   ├── MovieDetails.tsx        # Página detalles película
│   │   │   ├── SeriesDetails.tsx       # Página detalles serie
│   │   │   └── EpisodeSelector.tsx     # Selector temporada/episodio
│   │   │
│   │   ├── Watch/
│   │   │   ├── VideoPlayer.tsx         # Reproductor (Plyr)
│   │   │   ├── ChatPanel.tsx           # Chat sidebar
│   │   │   ├── QualitySelector.tsx     # Selector 480p/720p/1080p
│   │   │   ├── RoomInfo.tsx            # Código sala, participantes
│   │   │   ├── AdminPanel.tsx          # Controles host (expulsar usuarios)
│   │   │   └── WatchPartyContainer.tsx # Layout completo watch party
│   │   │
│   │   ├── Friends/
│   │   │   ├── FriendsList.tsx         # Lista amigos online/offline
│   │   │   ├── FriendsCard.tsx         # Card amigo con qué está viendo
│   │   │   └── AddFriendForm.tsx       # Input código amigo
│   │   │
│   │   ├── Modals/
│   │   │   ├── CreateRoomModal.tsx     # Crear sala privada
│   │   │   ├── JoinRoomModal.tsx       # Unirse a sala con código
│   │   │   └── InviteFriendsModal.tsx  # Invitar amigos a sala
│   │   │
│   │   └── Common/
│   │       ├── Button.tsx              # Botón reutilizable
│   │       ├── Input.tsx               # Input reutilizable
│   │       ├── Card.tsx                # Card reutilizable
│   │       └── Loading.tsx             # Spinner loading
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx               # /login
│   │   ├── RegisterPage.tsx            # /register
│   │   ├── HomePage.tsx                # /
│   │   ├── MoviesPage.tsx              # /movies
│   │   ├── SeriesPage.tsx              # /series
│   │   ├── DetailsPage.tsx             # /details/:id
│   │   ├── WatchPage.tsx               # /watch/:roomId
│   │   ├── FriendsPage.tsx             # /friends
│   │   ├── ProfilePage.tsx             # /profile
│   │   └── NotFoundPage.tsx            # /404
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                  # Login/logout/auth state
│   │   ├── useMedia.ts                 # Obtener películas de backend
│   │   ├── useStream.ts                # URL video + parámetros
│   │   ├── useRooms.ts                 # CRUD salas
│   │   ├── useFriends.ts               # Gestión amigos
│   │   ├── useChat.ts                  # Chat realtime Supabase
│   │   └── useNotifications.ts         # Supabase realtime notificaciones
│   │
│   ├── stores/
│   │   ├── authStore.ts                # Zustand: user, token
│   │   ├── mediaStore.ts               # Zustand: películas caché
│   │   ├── roomStore.ts                # Zustand: sala actual
│   │   └── notificationStore.ts        # Zustand: notificaciones
│   │
│   ├── lib/
│   │   ├── api.ts                      # Fetch wrapper (BaseURL, headers)
│   │   ├── supabase.ts                 # Cliente Supabase (auth + realtime)
│   │   └── constants.ts                # URLs, timeouts, etc
│   │
│   ├── types/
│   │   └── index.ts                    # Interfaces TypeScript (User, Movie, Room, etc)
│   │
│   └── utils/
│       ├── formatTime.ts               # 7200 → "2h 0m"
│       ├── formatDate.ts               # Fecha legible
│       └── parseParams.ts              # URL query params
│
├── .env.example                         # Variables entorno
├── tailwind.config.ts                   # Tailwind customization
├── tsconfig.json                        # TypeScript config
├── vite.config.ts                       # Vite config
└── package.json                         # Dependencias
```

---

## 🎨 PANTALLAS A CREAR

### 1. LOGIN / REGISTER
```
Layout:
├─ Logo PlexParty (centro)
├─ "Bienvenido a PlexParty"
├─ Input Email
├─ Input Contraseña
├─ Botón "Iniciar sesión" (naranja)
├─ O link "Crear cuenta"
└─ (Register): Agregar Input Nombre
```

### 2. HOME
```
Layout:
├─ Header (logo, search, notificaciones, avatar)
├─ Sidebar izquierda (Inicio, Películas, Series, Amigos)
├─ Contenido principal:
│  ├─ Banner grande "Continuar viendo" (película reciente)
│  ├─ Carrusel "Películas sugeridas"
│  ├─ Carrusel "Series sugeridas"
│  ├─ Carrusel "Top rated"
│  └─ Cada película: Card(poster, título, rating, play icon)
└─ Responsive: Sidebar → hamburguesa en móvil
```

### 3. PELÍCULAS / SERIES
```
Layout:
├─ Grid 3-5 columnas (responsivo)
├─ Cada card:
│  ├─ Poster
│  ├─ Hover: Título, Rating, Botones (Play, Agregar favorito)
│  └─ Click → Details
└─ Filtros: Por género, año, rating
```

### 4. DETAILS (Película/Serie)
```
Layout:
├─ Backdrop (imagen fondo)
├─ Información blanca encima:
│  ├─ Título grande
│  ├─ Año, Rating (estrellas), Duración
│  ├─ Sinopsis (2-3 líneas)
│  ├─ Géneros (badges)
│  ├─ Elenco (avatares + nombres)
│  └─ Botones (2 grandes):
│     ├─ "Crear Sala Privada" (play icon, naranja)
│     └─ "Unirme a Sala" (input código 6 dígitos)
│
├─ Series: Selector temporada/episodio
│  ├─ Dropdown "Temporada 1"
│  └─ Grid episodios (cuando seleccione)
└─ Responsive: Backdrop pequeño en móvil
```

### 5. WATCH PARTY (Reproducción)
```
Layout (2 columnas):
├─ LEFT (70%): Video player
│  ├─ <video> tag con Plyr
│  ├─ Controles:
│  │  ├─ Play/Pause
│  │  ├─ Barra progreso (arrastrable)
│  │  ├─ Volumen
│  │  ├─ Selector calidad (480p/720p/1080p)
│  │  ├─ Selector idioma audio (si hay múltiples)
│  │  ├─ Selector subtítulos (Español, English, Portugués, etc)
│  │  ├─ Pantalla completa
│  │  └─ Mostrar quien pausó: "[Usuario] pausó"
│  │
│  └─ Plyr plugins (subtítulos, calidad automática)
│
└─ RIGHT (30%): Sidebar
   ├─ Código sala: "ABC123" + botón "Copiar"
   ├─ Participantes conectados:
   │  ├─ Avatar + Nombre
   │  ├─ "está viendo" (si es host: botón rojo "Expulsar")
   │  └─ Mostrar si está en pausa o viendo
   ├─ Chat:
   │  ├─ Mensajes anteriores (scrolleable)
   │  ├─ Input nuevo mensaje
   │  └─ Enviar (Enter o botón)
   └─ (Si eres Host) Panel admin:
      ├─ Compartir código (copiar/QR)
      ├─ Invitar amigos (dropdown lista amigos)
      └─ Expulsar usuarios (botón rojo por usuario)

Responsive (móvil):
├─ Full screen video
├─ Swipe → mostrar chat
├─ Swipe → mostrar participantes
└─ Controles flotantes (transparentes)
```

### 6. AMIGOS
```
Layout:
├─ Tabs: "Conectados" | "Todos"
├─ Tab Conectados:
│  ├─ Lista amigos online
│  ├─ Cada card: Avatar + Nombre + "Viendo [Película]"
│  ├─ Click → ir a su sala
│  └─ Si no está viendo: solo "Online"
├─ Tab Todos:
│  ├─ Lista todos amigos
│  ├─ Status badge (Online/Offline)
│  └─ Click → Enviar invitación
└─ "Agregar amigo":
   ├─ Input "Código amigo" (6 dígitos)
   └─ Botón "Enviar solicitud"
```

### 7. NOTIFICACIONES (Top-right)
```
Estilos:
├─ Invitación sala:
│  ├─ Avatar usuario
│  ├─ "[Usuario] te invita a ver [Película]"
│  ├─ Botón "Aceptar" (verde)
│  └─ Botón "Ignorar" (gris)
├─ Amigo conectado:
│  ├─ "[Usuario] está viendo [Película]"
│  └─ Botón "Ir a su sala"

Posición y comportamiento:
├─ Desktop: top-right corner
├─ Tablet: center-top
├─ Móvil: full-width top
├─ Auto-dismiss: 5 segundos
└─ Click anywhere → cierra
```

---

## 🔗 INTEGRACIÓN CON BACKEND

### API Calls (usando hook `useApi`)
```javascript
// Login
POST /api/auth/login
{ email, password }
→ { token, user }

// Obtener películas
GET /api/media/list
→ [{ id, title, poster, rating, ... }]

// Obtener detalles película
GET /api/media/:id
→ { id, title, synopsis, cast, ... }

// Obtener stream (para video player)
GET /api/stream/:mediaId?quality=720p
→ HLS stream URL

// Crear sala
POST /api/rooms
{ mediaId, name }
→ { roomId, code }

// Unirse a sala
GET /api/rooms/:code
→ { roomId, participants, ... }

// Enviar mensaje chat
POST /api/rooms/:roomId/messages
{ text }
→ { messageId, ... }
```

### WebSocket (Sincronización)
```javascript
// Conectar a sala
ws.connect(`wss://backend/rooms/${roomId}`)

// Eventos que Supabase envía:
- "user_joined" → {userId, userName}
- "user_left" → {userId}
- "message_sent" → {text, userId, userName}
- "playback_sync" → {status: "play"|"pause", currentTime}
- "user_kicked" → {userId}
```

---

## 🎭 ESTADOS Y LÓGICA

### Auth State (Zustand)
```typescript
{
  user: { id, email, name, avatar } | null,
  token: string | null,
  isLoading: boolean,
  login: (email, password) => Promise,
  logout: () => void,
  isAuthenticated: boolean
}
```

### Room State (Zustand)
```typescript
{
  roomId: string | null,
  code: string,
  participants: [{ id, name, avatar, isWatching }],
  isHost: boolean,
  currentMediaId: string,
  videoState: { playing, currentTime, duration }
}
```

### Media State (React Query cache)
```typescript
// Auto-cacheado por TanStack Query
useQuery(['media', 'list'], fetchMediaList)
useQuery(['media', mediaId], fetchMediaDetails)
useQuery(['stream', mediaId], fetchStreamUrl)
```

---

## 🎬 FLUJO DE USUARIO (Paso a paso)

1. **Usuario abre app** → LoginPage (si no autenticado)
2. **Ingresa email/password** → Backend verifica → token guardado en localStorage
3. **Redirige a HomePage** → Obtiene películas del Backend
4. **Usuario click película** → DetailsPage (obtiene más info)
5. **Usuario click "Crear sala"** → Modal crea sala → Redirige a WatchPage
6. **WatchPage carga video** → GET /api/stream/:id → Plyr reproduce
7. **Usuario pausa** → WebSocket notifica a otros en sala
8. **Usuario escribe chat** → Supabase Realtime (instantáneo)
9. **Host expulsa usuario** → WebSocket "user_kicked" → Usuario redirige a Home

---

## 📦 DEPENDENCIAS npm

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x",
    "zustand": "^4.x",
    "@tanstack/react-query": "^5.x",
    "plyr": "^3.x",
    "hls.js": "^1.x",
    "@supabase/supabase-js": "^2.x",
    "lucide-react": "^0.x",
    "clsx": "^2.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x"
  }
}
```

---

## 🚀 PRIMEROS PASOS PARA KIMI

1. **Crear estructura** (carpetas + archivos básicos)
2. **Setup Tailwind** (configure)
3. **Setup Router** (React Router básico)
4. **Crear componentes**:
   - Header
   - Sidebar
   - LoginForm
   - RegisterForm
   - MediaCard
   - VideoPlayer
5. **Integrar API mock** (fetch local para testing)
6. **Responsive design** (mobile-first)
7. **Animaciones** (transitions, hover effects)

---

## ✅ CHECKLIST PARA KIMI

- [ ] Carpetas creadas
- [ ] Tailwind configurado
- [ ] Router configurado
- [ ] Componentes Auth (Login/Register)
- [ ] Componentes Home (Hero, Carousel, Card)
- [ ] Componentes Details
- [ ] Componentes Watch Party (Video player, Chat, Room info)
- [ ] Componentes Friends
- [ ] Notificaciones (toast system)
- [ ] Integración API (fetch wrapper)
- [ ] Integración Supabase (auth + realtime)
- [ ] Responsive design testeado
- [ ] TypeScript types definidos

---

## 💬 INSTRUCCIONES

1. **Copia este documento**
2. **Pásalo a Kimi completo**
3. **Dile que empiece con el router y componentes básicos**
4. **Cuando el Frontend esté listo, lo conectas con Backend**
