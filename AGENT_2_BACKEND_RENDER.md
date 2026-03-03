# 🚨 INSTRUCCIONES CRÍTICAS PARA AGENTES — LEER ANTES DE TOCAR CUALQUIER COSA

> Última actualización: 2026-03-03  
> Tag de seguridad: `video-y-peliculas-funcionan`

---

## ✅ Estado actual — FUNCIONANDO

### Lo que funciona correctamente:
- **Reproducción de películas y series** vía HLS con transcodificación Jellyfin
- **Selección de calidad en Mbps** (de 240p/500kbps a Original/20Mbps)
- **Selección de pista de audio** desde Jellyfin directamente
- **Selección de subtítulos** quemados en el vídeo (SubtitleMethod=Encode)
- **Series**: al hacer clic en un episodio, crea sala con el ID del episodio y va al reproductor
- **Carga de librería**: 200 películas/series iniciales + paginación de 100

---

## 🏗️ Arquitectura — NO CAMBIAR SIN LEER

### Frontend (Vercel → `plexparty-frontend`)
- El reproductor (`VideoPlayer.tsx`) se conecta **DIRECTAMENTE** a Jellyfin para:
  - Stream HLS: `${JELLYFIN_URL}/Videos/${mediaId}/master.m3u8`
  - Info de streams: `${JELLYFIN_URL}/Items/${mediaId}?Fields=MediaStreams&api_key=...`
- **NO usa el backend de Render para el vídeo** (evita timeout de 60s y 512MB RAM)
- Las URLs HLS se construyen en `buildHlsUrl()` en `VideoPlayer.tsx`

### Backend (Render → `plan-compleetao-agentes-separados`)
- Solo gestiona: autenticación JWT, lista de medios (`/api/media/list`), detalles de medios, salas, amigos, historial
- **NO debe proxiar vídeo** — esto causó ERR_QUIC_PROTOCOL_ERROR y colapso de Render

---

## 🔴 REGLAS ABSOLUTAS — NO VIOLAR

1. **NUNCA** cambiar `VideoPlayer.tsx` para que use el backend de Render para el stream de vídeo
2. **NUNCA** eliminar o cambiar los parámetros HLS: `SegmentContainer=ts`, `VideoCodec=h264`, `AudioCodec=aac`
3. **NUNCA** quitar el endpoint `/api/media/:id/playback-info` del backend (aunque no se use activamente en el frontend actual, puede usarse en el futuro)
4. **NUNCA** cambiar `Static=true` en el stream — eso causaba el spinner infinito
5. **NUNCA** reducir el límite de carga de medios por debajo de 100
6. **SIEMPRE** que hagas cambios en el VideoPlayer, mantener el flujo: `mediaId` → `fetchJellyfinStreams()` → `buildHlsUrl()` → `Hls.loadSource()`

---

## 📋 Variables de entorno importantes

### Frontend (Vercel)
```
VITE_API_URL=https://watch-together-2x.onrender.com
VITE_JELLYFIN_URL=https://jellyfin.watchtogether.nl   ← fallback en código
VITE_JELLYFIN_KEY=fab44659f9b74192924b80d2a3b0e8a2    ← fallback en código
```

### Backend (Render)
```
JELLYFIN_URL=https://jellyfin.watchtogether.nl
JELLYFIN_API_KEY=fab44659f9b74192924b80d2a3b0e8a2
NODE_ENV=production
```

---

## 🔁 Recuperación de emergencia

Si algo deja de funcionar, hacer checkout del tag de seguridad:

```bash
# Frontend
cd /Users/humbertopolonia/Downloads/PLEX/frontend
git checkout video-y-peliculas-funcionan

# Backend  
cd /Users/humbertopolonia/Downloads/PLEX/backend
git checkout video-y-peliculas-funcionan
```

---

## 📁 Archivos críticos — tocar con cuidado

| Archivo | Descripción |
|---------|-------------|
| `frontend/src/components/Watch/VideoPlayer.tsx` | Reproductor completo con HLS.js, calidades, audio, subs |
| `frontend/src/hooks/useMedia.ts` | Carga de librería (límite 200) |
| `frontend/src/components/Details/SeriesDetails.tsx` | Episodios → `handleEpisodeSelect` crea sala con episode.id |
| `frontend/src/pages/WatchPage.tsx` | Pasa `mediaId` (no `src`) al VideoPlayer |
| `backend/backend/src/services/jellyfin.service.ts` | Builds URLs HLS en backend (para otros endpoints) |
| `backend/backend/src/middleware/cors.ts` | CORS configurado para watchtogether.nl + localhost |
