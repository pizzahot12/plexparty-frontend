# 🚀 CÓMO USAR TODOS LOS AGENTES - Guía de Ejecución
## Desarrollo paralelo sin conflictos

---

## 📋 RESUMEN RÁPIDO

Tienes **4 agentes** trabajando en paralelo:

| Agente | Tarea | Archivo | Duración |
|--------|-------|---------|----------|
| **1. Kimi** | Frontend React | AGENT_1_FRONTEND_KIMI.md | 3-4 días |
| **2. Backend** | Node + Hono | AGENT_2_BACKEND_RENDER.md | 2-3 días |
| **3. Database** | Supabase SQL | AGENT_3_DATABASE_SUPABASE.md | 1 día |
| **4. Jellyfin** | Integration | AGENT_4_JELLYFIN_INTEGRATION.md | 1 día |

**Total:** ~1 semana (si trabajas 8h/día en paralelo)

---

## 🎯 ORDEN RECOMENDADO

### SEMANA 1 - Preparación (Días 1-2)

#### Día 1: DATABASE (Agente 3) - 2-3 horas
```
1. Crear cuenta Supabase
   → supabase.com
   → Sign up con GitHub
   → Crear proyecto PostgreSQL

2. Ejecutar schema
   → Copiar SQL de AGENT_3_DATABASE_SUPABASE.md
   → SQL Editor en Supabase
   → Ejecutar todo

3. Copiar credenciales
   → Project Settings → API
   → Guardar URL en .env
   → Guardar Anon Key en .env

RESULTADO: BD lista ✅
```

#### Día 2: JELLYFIN (Agente 4) - 1-2 horas
```
1. Obtener API Key
   → Jellyfin en Orange Pi (http://ip:8096)
   → Configuración avanzada → API Keys
   → Crear y copiar

2. Crear archivo .env Backend
   JELLYFIN_URL=http://orange-pi-ip:8096
   JELLYFIN_API_KEY=tu-key
   SUPABASE_URL=xxx
   SUPABASE_KEY=xxx

3. Copiar wrapper service
   → Copiar jellyfin.service.ts de AGENT_4
   → Guardar en backend/src/services/

RESULTADO: Orange Pi listo para Backend ✅
```

### SEMANA 1 - Desarrollo Paralelo (Días 3-7)

#### Paralelo: Frontend (Agente 1) + Backend (Agente 2) + Integración

```
DÍA 3-4:

AGENTE 1 (Kimi - Frontend):
├─ Crear estructura React
├─ Setup Tailwind
├─ Router básico (React Router)
├─ Componentes Login/Register
├─ Componentes Home
└─ Mock API (fetch local para testing)

AGENTE 2 (Backend - Node):
├─ Setup Hono
├─ Rutas auth (login/register)
├─ Conectar Supabase
├─ JWT middleware
└─ Routes media (list/details)

AGENTE 3 (Ya hizo BD):
└─ Esperar a Backend para integración

AGENTE 4 (Ya integró Jellyfin):
└─ Esperar a Backend para usar en routes
```

---

## 🔗 INTEGRACIÓN (Sin conflictos)

### ARQUITECTURA DE COMUNICACIÓN

```
FRONTEND (Kimi)
    ↓ HTTP JSON
    ├─ POST /api/auth/login
    ├─ GET /api/media/list
    ├─ GET /api/stream/:id
    └─ WebSocket /rooms/:id
    
BACKEND (Render)
    ├─ Recibe requests
    ├─ Valida JWT
    ├─ Llama Jellyfin
    ├─ Transcodifica con FFmpeg
    ├─ Guarda en Supabase
    └─ Envía WebSocket
    
ORANGE PI (Jellyfin)
    └─ Responde con películas/streams
    
SUPABASE (BD)
    └─ Almacena datos + realtime
```

---

## 📋 CHECKLIST DIARIO

### DÍA 1 (Database)
- [ ] Cuenta Supabase creada
- [ ] Schema ejecutado (todas las tablas)
- [ ] Triggers y funciones creadas
- [ ] RLS habilitado en tablas críticas
- [ ] URL y Key copiadas a .env
- [ ] Test: Supabase Dashboard muestra tablas

### DÍA 2 (Jellyfin)
- [ ] API Key obtenida de Jellyfin
- [ ] .env Backend creado con variables
- [ ] Archivo jellyfin.service.ts copiado
- [ ] Test: `curl http://jellyfin:8096/Items?ApiKey=xxx` funciona

### DÍA 3-4 (Frontend)
- [ ] Estructura React creada
- [ ] Tailwind configurado
- [ ] Router básico funcionando
- [ ] Auth forms (Login/Register) visibles
- [ ] Home page con carrusel simulado
- [ ] API wrapper client.ts creado (con mock)
- [ ] Responsive design en mobile

### DÍA 5 (Backend)
- [ ] Hono inicializado
- [ ] Routes auth funcionando (sin Supabase aún)
- [ ] JWT generándose
- [ ] CORS configurado
- [ ] Middleware auth creado
- [ ] .env variables leídas
- [ ] Docker configurado

### DÍA 6 (Integración 1)
- [ ] Backend → Supabase conectado
- [ ] Backend → Jellyfin conectado
- [ ] Routes media (list/details) funcionando
- [ ] Frontend hace fetch a Backend mock (localhost:3000)
- [ ] Test E2E: Login → Home → Listar películas

### DÍA 7 (Integración 2)
- [ ] FFmpeg en Backend funciona
- [ ] Route stream devuelve HLS URL
- [ ] Frontend puede reproducir video
- [ ] WebSocket salas funcionando
- [ ] Chat realtime (Supabase)
- [ ] Sincronización play/pause

---

## 🔀 CÓMO PASAR ARCHIVOS A LOS AGENTES

### Para Kimi (Frontend)

```
Copiar ESTE texto:

---START---

Hola Kimi, necesito que hagas el frontend de una app de streaming.

CONTEXTO:
- App tipo Netflix para ver películas en grupo
- Backend en Render (Node + Hono)
- Base de datos: Supabase PostgreSQL
- Videos: Orange Pi (Jellyfin/Plex)

ESPECIFICACIONES COMPLETAS:
[Copiar TODO de AGENT_1_FRONTEND_KIMI.md]

IMPORTANTE:
1. No hagas el backend (otro agente lo hace)
2. Usa API mock en fetch (localhost:3000) para testing
3. Cuando esté listo, conectamos con Backend real
4. Responsive design (mobile-first)

---END---
```

### Para Backend (OpenCode/Antigravity)

```
Copiar ESTE texto:

---START---

Hola, necesito backend de app streaming.

ESPECIFICACIONES COMPLETAS:
[Copiar TODO de AGENT_2_BACKEND_RENDER.md]

IMPORTANTE:
1. Node.js + Hono framework
2. Conectar a Supabase (credenciales en .env)
3. Llamar a Jellyfin en Orange Pi (URL en .env)
4. FFmpeg para transcodificar videos
5. WebSocket para salas sincronizadas

REFERENCIAS:
- Jellyfin integration: [AGENT_4_JELLYFIN_INTEGRATION.md]
- Base de datos: [AGENT_3_DATABASE_SUPABASE.md]

---END---
```

### Para Database (Tú mismo)

```
1. Abre AGENT_3_DATABASE_SUPABASE.md
2. Ve a supabase.com
3. SQL Editor
4. Copia todo el schema
5. Ejecuta
```

### Para Jellyfin (Tú mismo)

```
1. Lee AGENT_4_JELLYFIN_INTEGRATION.md
2. Obtén API Key de tu Jellyfin
3. Crea .env con credenciales
4. Pasa jellyfin.service.ts al backend
```

---

## 🧪 TESTING EN CADA FASE

### FASE 1: Frontend sin Backend
```bash
# Frontend corre en localhost:3000
npm run dev

# Mock API en utils/mockApi.ts
# Retorna datos simulados
```

### FASE 2: Backend sin Frontend
```bash
# Backend en localhost:3001
npm run dev

# Test con curl:
curl http://localhost:3001/api/media/list \
  -H "Authorization: Bearer fake-token"
```

### FASE 3: Integración Frontend + Backend
```bash
# Frontend (terminal 1):
cd frontend && npm run dev
# → http://localhost:3000

# Backend (terminal 2):
cd backend && npm run dev
# → http://localhost:3001

# Frontend hace fetch a:
# http://localhost:3001/api/...
```

### FASE 4: Integración Backend + Jellyfin
```bash
# Backend test:
curl http://localhost:3001/api/media/list \
  -H "Authorization: Bearer jwt-token"

# Respuesta debe tener películas de tu Jellyfin
```

### FASE 5: Integración Frontend + Backend + Jellyfin
```bash
# Frontend → Backend → Jellyfin
# Test completo end-to-end

# 1. Frontend hace POST /api/auth/login
# 2. Backend genera JWT
# 3. Frontend hace GET /api/media/list con JWT
# 4. Backend obtiene de Jellyfin
# 5. Frontend muestra películas
```

---

## 📦 GIT ESTRUCTURA

```
plexparty/
├── frontend/                    # Agente 1 (Kimi)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                     # Agente 2 (OpenCode)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   └── jellyfin.service.ts  # Agente 4
│   │   └── index.ts
│   ├── package.json
│   └── Dockerfile
│
├── database/                    # Agente 3 (Tú)
│   ├── schema.sql              # AGENT_3_DATABASE_SUPABASE.md
│   └── migrations/
│
├── .env.example                 # Ejemplo variables
├── .gitignore
└── README.md
```

---

## 🚨 CONFLICTOS POSIBLES (Cómo evitar)

### FRONTEND - BACKEND

**Problema:** Ambos definen tipos de User

**Solución:**
```
Backend define tipos en: backend/src/types/index.ts
Frontend importa desde: shared/types/index.ts

O:
Frontend espera response:
{ id, email, name, avatar }

Backend devuelve exactamente eso
```

### BACKEND - JELLYFIN

**Problema:** Jellyfin cache vs realtime

**Solución:**
```
Backend corre 2 servicios:
1. Cache en Supabase (update cada 1 hora)
2. Jellyfin live (para streams)

No puede haber conflicto (solo lectura)
```

### DATABASE - BACKEND

**Problema:** Tablas no sincronizadas

**Solución:**
```
Agente 3 (Database) termina primero (Día 1)
Agente 2 (Backend) espera antes de conectar
Backend copia URL/Key de Agente 3
No puede sobrescribir schema
```

---

## 📊 COMUNICACIÓN ENTRE AGENTES

### Frontend → Backend
```json
POST /api/auth/login
{
  "email": "user@test.com",
  "password": "pass123"
}
```

### Backend ← → Supabase
```typescript
// Backend obtiene usuario de Supabase
const user = await supabase
  .from('users')
  .select()
  .eq('email', email)
```

### Backend ← → Jellyfin
```typescript
// Backend obtiene películas de Jellyfin
const movies = await jellyfinService.getMovies()
```

### Backend → Frontend
```json
{
  "token": "jwt-token-xyz",
  "user": {
    "id": "uuid",
    "email": "user@test.com",
    "name": "Usuario"
  }
}
```

---

## 🎯 HITOS SEMANALES

| Día | Hito | Status |
|-----|------|--------|
| 1 | BD Supabase ✅ | Done |
| 2 | Jellyfin API | Done |
| 3-4 | Frontend skeleton | In Progress |
| 5 | Backend routes | In Progress |
| 6 | Frontend ↔ Backend | In Progress |
| 7 | Todo integrado | Pending |

---

## ✅ CHECKLIST FINAL

Antes de pasar agentes:

- [ ] Leí completo este documento
- [ ] Copié AGENT_1 para Kimi
- [ ] Copié AGENT_2 para Backend
- [ ] Ejecuté AGENT_3 (Database)
- [ ] Leí AGENT_4 (Jellyfin)
- [ ] Creé cuenta Supabase
- [ ] Obtuve Jellyfin API Key
- [ ] Cree .env con variables
- [ ] Entiendo flujo Frontend → Backend → Jellyfin
- [ ] Sé cómo testear cada componente

---

## 🚀 EMPEZAR AHORA

1. **Abre AGENT_3_DATABASE_SUPABASE.md**
2. **Crear Supabase proyecto**
3. **Ejecutar schema SQL**
4. **Abre AGENT_4_JELLYFIN_INTEGRATION.md**
5. **Obtén API Key**
6. **Crea archivo .env**
7. **Pasa AGENT_1 a Kimi**
8. **Pasa AGENT_2 a tu agente Backend**

**¡Listo! El desarrollo puede comenzar en paralelo.**

---

**¿Preguntas? Revisa cada AGENT_X archivo para detalles.**
