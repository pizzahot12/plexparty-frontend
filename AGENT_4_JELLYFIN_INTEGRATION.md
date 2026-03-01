# 🎬 JELLYFIN/PLEX - API Integration
## Cómo conectar tu Orange Pi con el Backend

---

## 📝 CONTEXTO

Orange Pi tiene Jellyfin/Plex instalado (lo que tienes ahora).

**¿Qué hay que hacer?**
- Backend (Render) hace peticiones HTTP a Jellyfin
- Obtiene lista de películas
- Obtiene metadata (título, carátula, sinopsis)
- Obtiene subtítulos
- Obtiene stream URL para transcodificar

**¿Cómo comunican?**
```
Backend (Render) 
    ↓ HTTP
Orange Pi (Jellyfin)
    ↓ Responde con datos/video
Backend (Render)
    ↓ Transcodifica con FFmpeg
    ↓ Envía al Frontend
```

---

## 🔑 JELLYFIN API KEY

### Obtener API Key

1. **Abrir Jellyfin en navegador:** `http://tu-orange-pi-ip:8096`
2. **Dashboard** → **Configuración avanzada** (si eres admin)
3. **API Keys** → **Crear nueva** → Copiar
4. **Guardar en .env:**
   ```
   JELLYFIN_URL=http://tu-orange-pi-ip:8096
   JELLYFIN_API_KEY=tu-key-super-secret
   ```

---

## 📡 ENDPOINTS JELLYFIN

### Obtener lista de películas
```
GET http://jellyfin-ip:8096/Items
?IncludeItemTypes=Movie
&ParentId=tu-library-id
&Limit=50
&StartIndex=0
&Fields=BasicSyncInfo,CanDelete
&ApiKey=tu-key

Response:
{
  "Items": [
    {
      "Name": "Jurassic Park",
      "Id": "jellyfin-id-123",
      "Type": "Movie",
      "Overview": "When dinosaurs ruled...",
      "CommunityRating": 8.5,
      "ProductionYear": 1993,
      "RunTimeTicks": 72000000000, // 100-nanosecond ticks
      "ImageTags": {
        "Primary": "image-tag-123",
        "Backdrop": "image-tag-456"
      },
      "GenreItems": [
        { "Name": "Action" },
        { "Name": "Sci-Fi" }
      ]
    }
  ]
}
```

### Obtener detalles película
```
GET http://jellyfin-ip:8096/Items/{itemId}
?ApiKey=tu-key

Response:
{
  "Name": "Jurassic Park",
  "Id": "jellyfin-123",
  "Type": "Movie",
  "Overview": "When dinosaurs ruled...",
  "ProductionYear": 1993,
  "CommunityRating": 8.5,
  "RunTimeTicks": 72000000000,
  "People": [
    {
      "Name": "Steven Spielberg",
      "Role": "Director"
    },
    {
      "Name": "Sam Neill",
      "Role": "Alan Grant"
    }
  ],
  "ImageTags": {
    "Primary": "tag-123",
    "Backdrop": "tag-456"
  },
  "MediaSources": [
    {
      "Id": "source-123",
      "Container": "mkv",
      "Name": "Jurassic Park.mkv",
      "Path": "/path/to/file.mkv"
    }
  ]
}
```

### Obtener subtítulos disponibles
```
GET http://jellyfin-ip:8096/Items/{itemId}/RemoteSearchResults
?ApiKey=tu-key

O:

GET http://jellyfin-ip:8096/MediaInfo/{itemId}
?ApiKey=tu-key

Response:
{
  "MediaSources": [
    {
      "MediaStreams": [
        {
          "Type": "Subtitle",
          "Codec": "subrip",
          "Language": "spa", // español
          "DisplayTitle": "Spanish"
        },
        {
          "Type": "Subtitle",
          "Codec": "subrip",
          "Language": "eng",
          "DisplayTitle": "English"
        }
      ]
    }
  ]
}
```

### Obtener stream URL (para transcodificar)
```
GET http://jellyfin-ip:8096/Videos/{itemId}/stream
?MediaSourceId=default
&VideoCodec=h264
&AudioCodec=aac
&AudioStreamIndex=0
&SubtitleStreamIndex=0
&VideoCodecLevel=42
&ApiKey=tu-key

Response:
HTTP 302 → Redirect a stream URL
Location: /stream?MediaSourceId=xxx&VideoCodec=xxx...
```

---

## 🔌 WRAPPER JELLYFIN SERVICE (Backend)

### jellyfin.service.ts
```typescript
import axios from 'axios'

const JELLYFIN_URL = process.env.JELLYFIN_URL
const JELLYFIN_KEY = process.env.JELLYFIN_API_KEY

interface JellyfinMovie {
  Name: string
  Id: string
  Overview: string
  CommunityRating: number
  ProductionYear: number
  RunTimeTicks: number
  ImageTags: {
    Primary?: string
    Backdrop?: string
  }
  GenreItems?: Array<{ Name: string }>
}

interface JellyfinPerson {
  Name: string
  Role?: string
}

// Convertir ticks a segundos
const ticksToSeconds = (ticks: number): number => {
  return Math.floor(ticks / 10000000)
}

// Obtener lista de películas
export const getMovies = async (skip = 0, limit = 50) => {
  try {
    const response = await axios.get(`${JELLYFIN_URL}/Items`, {
      params: {
        IncludeItemTypes: 'Movie',
        Limit: limit,
        StartIndex: skip,
        Fields: 'BasicSyncInfo,CanDelete',
        ApiKey: JELLYFIN_KEY
      }
    })

    return response.data.Items.map((item: JellyfinMovie) => ({
      id: item.Id,
      title: item.Name,
      synopsis: item.Overview,
      rating: item.CommunityRating || 0,
      year: item.ProductionYear,
      duration: ticksToSeconds(item.RunTimeTicks),
      poster: `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary`,
      backdrop: `${JELLYFIN_URL}/Items/${item.Id}/Images/Backdrop`,
      genres: item.GenreItems?.map(g => g.Name) || []
    }))
  } catch (error) {
    console.error('Error fetching movies:', error)
    throw error
  }
}

// Obtener detalles película
export const getMovie = async (itemId: string) => {
  try {
    const response = await axios.get(
      `${JELLYFIN_URL}/Items/${itemId}`,
      {
        params: {
          ApiKey: JELLYFIN_KEY
        }
      }
    )

    const item = response.data

    return {
      id: item.Id,
      title: item.Name,
      synopsis: item.Overview,
      rating: item.CommunityRating || 0,
      year: item.ProductionYear,
      duration: ticksToSeconds(item.RunTimeTicks),
      poster: `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary`,
      backdrop: `${JELLYFIN_URL}/Items/${item.Id}/Images/Backdrop`,
      genres: item.GenreItems?.map(g => g.Name) || [],
      cast: item.People?.filter((p: JellyfinPerson) => p.Role) || [],
      subtitles: await getSubtitles(itemId),
      audio: ['es', 'en'] // Asumir por defecto
    }
  } catch (error) {
    console.error('Error fetching movie:', error)
    throw error
  }
}

// Obtener subtítulos disponibles
export const getSubtitles = async (itemId: string): Promise<string[]> => {
  try {
    const response = await axios.get(
      `${JELLYFIN_URL}/MediaInfo/${itemId}`,
      {
        params: {
          ApiKey: JELLYFIN_KEY
        }
      }
    )

    const subtitles = new Set<string>()
    
    response.data.MediaSources?.[0]?.MediaStreams?.forEach((stream: any) => {
      if (stream.Type === 'Subtitle' && stream.Language) {
        subtitles.add(stream.Language.toLowerCase())
      }
    })

    return Array.from(subtitles)
  } catch (error) {
    console.error('Error fetching subtitles:', error)
    return [] // Retornar array vacío si hay error
  }
}

// Obtener URL de stream (para FFmpeg)
export const getStreamUrl = (
  itemId: string,
  options: {
    quality?: '360p' | '480p' | '720p' | '1080p'
    subtitle?: string
    audio?: string
  } = {}
): string => {
  const params = new URLSearchParams({
    MediaSourceId: 'default',
    VideoCodec: 'h264',
    AudioCodec: 'aac',
    AudioStreamIndex: '0',
    VideoCodecLevel: '42',
    ApiKey: JELLYFIN_KEY,
    ...(options.subtitle && { SubtitleStreamIndex: options.subtitle })
  })

  return `${JELLYFIN_URL}/Videos/${itemId}/stream?${params}`
}

// Obtener lista de series
export const getSeries = async (skip = 0, limit = 50) => {
  try {
    const response = await axios.get(`${JELLYFIN_URL}/Items`, {
      params: {
        IncludeItemTypes: 'Series',
        Limit: limit,
        StartIndex: skip,
        ApiKey: JELLYFIN_KEY
      }
    })

    return response.data.Items.map((item: any) => ({
      id: item.Id,
      title: item.Name,
      synopsis: item.Overview,
      rating: item.CommunityRating || 0,
      year: item.ProductionYear,
      poster: `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary`,
      backdrop: `${JELLYFIN_URL}/Items/${item.Id}/Images/Backdrop`
    }))
  } catch (error) {
    console.error('Error fetching series:', error)
    throw error
  }
}

// Obtener episodios de serie
export const getEpisodes = async (seriesId: string) => {
  try {
    const response = await axios.get(`${JELLYFIN_URL}/Shows/${seriesId}/Episodes`, {
      params: {
        ApiKey: JELLYFIN_KEY
      }
    })

    return response.data.Items.map((item: any) => ({
      id: item.Id,
      title: item.Name,
      season: item.ParentIndexNumber,
      episode: item.IndexNumber,
      synopsis: item.Overview,
      duration: ticksToSeconds(item.RunTimeTicks)
    }))
  } catch (error) {
    console.error('Error fetching episodes:', error)
    throw error
  }
}
```

---

## 🖼️ IMÁGENES

### URLs de imágenes en Jellyfin
```
Poster (carátula):
http://jellyfin-ip:8096/Items/{itemId}/Images/Primary

Backdrop (fondo):
http://jellyfin-ip:8096/Items/{itemId}/Images/Backdrop

Logo:
http://jellyfin-ip:8096/Items/{itemId}/Images/Logo

Thumbs:
http://jellyfin-ip:8096/Items/{itemId}/Images/Thumb
```

---

## 🎥 PLEX (Alternativa)

Si usas Plex en lugar de Jellyfin:

### Plex API Key
1. **Ir a Plex.tv** → Configuración
2. **Privacidad** → Copy el token
3. **Usar en .env:** `PLEX_TOKEN=xxx`

### Endpoints Plex
```
Obtener bibliotecas:
GET https://plex.tv/library/sections
?X-Plex-Token=tu-token

Obtener películas:
GET http://server-ip:32400/library/sections/{sectionId}/all
?X-Plex-Token=tu-token

Stream:
GET http://server-ip:32400/video/:/transcode/universal/start
?path=/library/metadata/{itemId}
&mediaIndex=0
&partIndex=0
&protocol=hls
&X-Plex-Token=tu-token
```

---

## ⚠️ NOTAS IMPORTANTES

### Jellyfin
- IP debe ser accesible desde Render
- Si está en local: usar Cloudflare Tunnel o VPN
- API Key es secreto (no guardar en GitHub)
- RunTimeTicks en unidades de 100 nanosegundos

### Plex
- Requiere autenticación con token
- Más restringido en API
- Mejor para uso personal

### Subtítulos
- Jellyfin soporta: SRT, ASS, SUB, etc.
- Pasar como parámetro a FFmpeg
- Quemar en video o stream externo

### Transcoding
- FFmpeg obtiene URL del stream
- Convierte en tiempo real
- No necesita descargar archivo completo

---

## ✅ CHECKLIST JELLYFIN

- [ ] Jellyfin/Plex instalado en Orange Pi
- [ ] API Key obtenida
- [ ] Variables .env configuradas
- [ ] Test: Acceder a http://jellyfin-ip:8096/Items desde Render
- [ ] Wrapper service creado
- [ ] Controllers integrando el service
- [ ] Caché de películas en Supabase
- [ ] Streaming URL funcionando
- [ ] FFmpeg recibe URL correctamente

---

## 🚀 TESTING

### Desde CLI (curl)
```bash
# Obtener películas
curl "http://tu-orange-pi:8096/Items?IncludeItemTypes=Movie&ApiKey=tu-key"

# Obtener stream URL
curl -I "http://tu-orange-pi:8096/Videos/item-id/stream?ApiKey=tu-key"
```

### Desde Node.js
```javascript
import * as jellyfinService from './services/jellyfin.service'

const movies = await jellyfinService.getMovies(0, 10)
console.log(movies)

const movie = await jellyfinService.getMovie('jellyfin-123')
console.log(movie)

const streamUrl = jellyfinService.getStreamUrl('jellyfin-123', {
  quality: '720p'
})
console.log(streamUrl)
```

---

## 📚 REFERENCIAS

- [Jellyfin API Docs](https://api.jellyfin.org/)
- [Plex API Docs](https://www.plexopedia.com/plex-media-server/api/)
