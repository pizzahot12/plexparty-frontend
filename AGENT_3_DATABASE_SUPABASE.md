# 🗄️ BASE DE DATOS - Supabase PostgreSQL
## Schema completo para PlexParty

---

## 📝 CONTEXTO

Supabase es PostgreSQL en la nube (gratis 50GB).

**¿Qué guarda?**
- Usuarios (login)
- Películas/series (caché)
- Salas (watch parties)
- Amigos
- Chat mensajes
- Historial reproducción

---

## 🏗️ SCHEMA TABLAS

### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### 2. media (caché de películas/series)
```sql
CREATE TABLE media (
  id VARCHAR(255) PRIMARY KEY,
  jellyfin_id VARCHAR(255) UNIQUE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'movie' o 'series'
  poster_url VARCHAR(255),
  backdrop_url VARCHAR(255),
  synopsis TEXT,
  rating FLOAT DEFAULT 0,
  year INTEGER,
  duration INTEGER, -- en segundos
  genres TEXT[], -- JSON array
  cast TEXT[], -- JSON array
  subtitles TEXT[], -- JSON array idiomas
  audio TEXT[], -- JSON array idiomas
  cached_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_title ON media(title);
```

### 3. rooms (salas de watch party)
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  media_id VARCHAR(255) NOT NULL REFERENCES media(id),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Auto-delete after 10 min sin usuarios
  
  UNIQUE(code)
);

-- Índices
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_host_id ON rooms(host_id);
CREATE INDEX idx_rooms_expires_at ON rooms(expires_at);

-- RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read rooms"
  ON rooms FOR SELECT
  USING (true);
CREATE POLICY "Only host can delete"
  ON rooms FOR DELETE
  USING (auth.uid() = host_id);
```

### 4. room_participants (quién está en cada sala)
```sql
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(room_id, user_id)
);

-- Índices
CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);

-- RLS
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read participants"
  ON room_participants FOR SELECT
  USING (true);
```

### 5. messages (chat en salas)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read messages in room"
  ON messages FOR SELECT
  USING (true);
CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 6. watch_history (historial reproducción)
```sql
CREATE TABLE watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id VARCHAR(255) NOT NULL REFERENCES media(id),
  current_time INTEGER DEFAULT 0, -- segundos
  duration INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, media_id)
);

-- Índices
CREATE INDEX idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX idx_watch_history_last_watched_at ON watch_history(last_watched_at);

-- RLS
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own history"
  ON watch_history FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own history"
  ON watch_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own history"
  ON watch_history FOR UPDATE
  USING (auth.uid() = user_id);
```

### 7. friends (sistema de amigos)
```sql
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'accepted', -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friend CHECK (user_id != friend_id)
);

-- Índices
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);

-- RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own friends"
  ON friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
```

### 8. notifications (notificaciones realtime)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'room_invite', 'friend_request', 'friend_joined'
  data JSONB, -- { roomId, friendId, friendName, movieTitle, etc }
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🔧 TRIGGERS Y FUNCIONES

### Auto-limpiar salas vacías (después 10 minutos)

```sql
CREATE OR REPLACE FUNCTION delete_empty_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms r
  WHERE r.expires_at < NOW()
    AND NOT EXISTS (
      SELECT 1 FROM room_participants rp WHERE rp.room_id = r.id
    );
END;
$$ LANGUAGE plpgsql;

-- Ejecutar cada 5 minutos
SELECT cron.schedule(
  'delete-empty-rooms',
  '*/5 * * * *',
  'SELECT delete_empty_rooms()'
);
```

### Actualizar expires_at cuando user se une/sale

```sql
CREATE OR REPLACE FUNCTION update_room_expires()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE rooms
    SET expires_at = NOW() + INTERVAL '10 minutes'
    WHERE id = OLD.room_id;
  ELSE
    UPDATE rooms
    SET expires_at = NOW() + INTERVAL '10 minutes'
    WHERE id = NEW.room_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER room_participant_expires
AFTER INSERT OR DELETE ON room_participants
FOR EACH ROW
EXECUTE FUNCTION update_room_expires();
```

### Generar código sala (6 dígitos random)

```sql
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  code VARCHAR(6);
BEGIN
  LOOP
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    IF NOT EXISTS (SELECT 1 FROM rooms WHERE rooms.code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usar en trigger de INSERT
CREATE TRIGGER rooms_generate_code
BEFORE INSERT ON rooms
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION (
  NEW.code := generate_room_code()
);
```

### Crear notificación cuando user se une a sala

```sql
CREATE OR REPLACE FUNCTION notify_user_joined()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, data)
  SELECT
    host_id,
    'user_joined',
    jsonb_build_object(
      'roomId', NEW.room_id,
      'userId', NEW.user_id,
      'userName', u.name,
      'mediaId', r.media_id
    )
  FROM users u
  JOIN rooms r ON r.id = NEW.room_id
  WHERE u.id = r.host_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_user_joined_trigger
AFTER INSERT ON room_participants
FOR EACH ROW
EXECUTE FUNCTION notify_user_joined();
```

---

## 🔔 REALTIME SUBSCRIPTIONS (Para Frontend)

### Chat en tiempo real
```typescript
// Frontend (Supabase JS)
supabase
  .channel(`room:${roomId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`
    },
    (payload) => {
      console.log('New message:', payload.new)
    }
  )
  .subscribe()
```

### Participantes unidos/salido
```typescript
supabase
  .channel(`room:${roomId}:participants`)
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'room_participants',
      filter: `room_id=eq.${roomId}`
    },
    (payload) => {
      console.log('Participants changed:', payload)
    }
  )
  .subscribe()
```

### Notificaciones
```typescript
supabase
  .channel(`user:${userId}:notifications`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new)
    }
  )
  .subscribe()
```

---

## 👤 RLS (Row Level Security) - Resumen

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | Propio | ✗ | Propio | ✗ |
| media | Public | Backend | ✗ | ✗ |
| rooms | Public | ✗ | Host | Host |
| room_participants | Public | Backend | ✗ | Backend |
| messages | Public | Usuario | ✗ | ✗ |
| watch_history | Propio | Propio | Propio | ✗ |
| friends | Propio | Backend | ✗ | Backend |
| notifications | Propio | Backend | Usuario | ✗ |

---

## 🌍 SETUP EN SUPABASE

1. **Ir a supabase.com**
2. **Sign up / Login**
3. **Crear nuevo proyecto** PostgreSQL
4. **SQL Editor** → Copiar y ejecutar todo el schema arriba
5. **Authentication** → Habilitar Email/Password
6. **Realtime** → Habilitar para tablas que necesiten (messages, notifications, room_participants)
7. **Copiar URL y API KEY** → Guardar en `.env`

---

## 📊 DATOS INICIALES (SQL insert)

```sql
-- Cargar películas de ejemplo (si quieres)
INSERT INTO media (id, jellyfin_id, title, type, poster_url, synopsis, rating, year, duration)
VALUES
  ('movie-1', 'jellyfin-123', 'Jurassic Park', 'movie', 'url', 'Dinosaurios...', 8.5, 1993, 7200),
  ('movie-2', 'jellyfin-124', 'The Matrix', 'movie', 'url', 'Realidad...', 8.7, 1999, 8280),
  ('series-1', 'jellyfin-200', 'Breaking Bad', 'series', 'url', 'Química...', 9.5, 2008, 3000);
```

---

## ✅ CHECKLIST DATABASE

- [ ] Crear proyecto Supabase
- [ ] Ejecutar schema tablas
- [ ] Ejecutar triggers
- [ ] Ejecutar funciones
- [ ] Habilitar RLS
- [ ] Habilitar Realtime
- [ ] Crear credenciales API
- [ ] Guardar URL y KEY en .env

---

## 🚀 NOTAS

- Supabase corre en tu cuenta, datos privados
- Gratis 50GB almacenamiento
- Realtime es automático (Postgres notificaciones)
- RLS protege datos automáticamente
- Backups automáticos
