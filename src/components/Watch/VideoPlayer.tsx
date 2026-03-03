import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { cn } from '@/lib/utils';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/hooks/useAuth';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  MessageSquare,
  Users,
  ChevronLeft,
} from 'lucide-react';

// ─── Jellyfin direct config ────────────────────────────────────────────────────
// Stream goes directly browser → Jellyfin (not through Render).
// This avoids Render's 60s timeout and 512MB RAM limit for video proxying.
const JELLYFIN_URL = import.meta.env.VITE_JELLYFIN_URL || 'https://jellyfin.watchtogether.nl';
const JELLYFIN_KEY = import.meta.env.VITE_JELLYFIN_KEY || 'fab44659f9b74192924b80d2a3b0e8a2';
const DEVICE_ID = 'watchparty';

// ─── Quality levels (Mbps, Jellyfin-style) ────────────────────────────────────
// Each level adds VideoBitrate + MaxWidth/MaxHeight to the master.m3u8 request.
// Jellyfin will transcode to exactly that bitrate cap.
interface QualityLevel {
  label: string;   // Display label e.g. "20 Mbps (1080p)"
  bitrate: number;   // bits per second for VideoBitrate param
  maxW: number;
  maxH: number;
}

const QUALITY_LEVELS: QualityLevel[] = [
  { label: 'Auto (original)', bitrate: 0, maxW: 3840, maxH: 2160 },
  { label: '20 Mbps (1080p)', bitrate: 20_000_000, maxW: 1920, maxH: 1080 },
  { label: '10 Mbps (1080p)', bitrate: 10_000_000, maxW: 1920, maxH: 1080 },
  { label: '8 Mbps (720p)', bitrate: 8_000_000, maxW: 1280, maxH: 720 },
  { label: '4 Mbps (720p)', bitrate: 4_000_000, maxW: 1280, maxH: 720 },
  { label: '2 Mbps (480p)', bitrate: 2_000_000, maxW: 854, maxH: 480 },
  { label: '1 Mbps (360p)', bitrate: 1_000_000, maxW: 640, maxH: 360 },
  { label: '500 kbps (240p)', bitrate: 500_000, maxW: 426, maxH: 240 },
];

// ─── Media stream types ───────────────────────────────────────────────────────
interface JellyfinStream {
  Type: 'Video' | 'Audio' | 'Subtitle';
  Index: number;
  Language?: string;
  DisplayTitle?: string;
  Codec?: string;
  IsDefault?: boolean;
  IsExternal?: boolean;
}

// ─── Build HLS URL ─────────────────────────────────────────────────────────────
function buildHlsUrl(
  mediaId: string,
  quality: QualityLevel,
  audioIndex?: number,
  subtitleIndex?: number
): string {
  const sessionId = `pp_${mediaId.substring(0, 8)}_${Date.now()}`;
  const params: Record<string, string> = {
    api_key: JELLYFIN_KEY,
    MediaSourceId: mediaId,
    DeviceId: DEVICE_ID,
    PlaySessionId: sessionId,
    VideoCodec: 'h264',
    AudioCodec: 'aac',
    TranscodingMaxAudioChannels: '2',
    SegmentContainer: 'ts',
    MinSegments: '1',
    ManifestTranscriptionEnabled: 'true',
    TranscodeReasons: 'ContainerNotSupported,VideoCodecNotSupported',
  };

  // Quality cap (0 = Auto, let Jellyfin handle it)
  if (quality.bitrate > 0) {
    params.VideoBitrate = String(quality.bitrate);
    params.MaxWidth = String(quality.maxW);
    params.MaxHeight = String(quality.maxH);
  }

  // Audio track
  if (audioIndex !== undefined) {
    params.AudioStreamIndex = String(audioIndex);
  }

  // Subtitles burned-in (SubtitleMethod=Encode = burned into video stream)
  if (subtitleIndex !== undefined && subtitleIndex >= 0) {
    params.SubtitleStreamIndex = String(subtitleIndex);
    params.SubtitleMethod = 'Encode';
  }

  const qs = new URLSearchParams(params).toString();
  return `${JELLYFIN_URL}/Videos/${mediaId}/master.m3u8?${qs}`;
}

// ─── Fetch audio + subtitle streams directly from Jellyfin ────────────────────
// Uses POST /Items/{id}/PlaybackInfo with proper Authorization header.
// The simple GET /Items/{id}?api_key=... returns 400 in most Jellyfin configs
// because it expects the full MediaBrowser auth header or a userId.
async function fetchJellyfinStreams(mediaId: string): Promise<JellyfinStream[]> {
  try {
    const authHeader = `MediaBrowser Client="WatchParty", Device="Browser", DeviceId="${DEVICE_ID}", Version="1.0.0", Token="${JELLYFIN_KEY}"`;
    const res = await fetch(
      `${JELLYFIN_URL}/Items/${mediaId}/PlaybackInfo?MediaSourceId=${mediaId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'X-Emby-Authorization': authHeader,
        },
        body: JSON.stringify({ DeviceProfile: {} }),
      }
    );
    if (!res.ok) {
      console.warn('[Jellyfin] PlaybackInfo', res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    // MediaSources[0].MediaStreams contains all audio/subtitle tracks
    const streams: JellyfinStream[] = data?.MediaSources?.[0]?.MediaStreams ?? [];
    return streams;
  } catch (e) {
    console.warn('[Jellyfin] fetchJellyfinStreams failed:', e);
    return [];
  }
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface VideoPlayerProps {
  mediaId?: string;
  poster?: string;
  className?: string;
  onToggleChat?: () => void;
  onToggleParticipants?: () => void;
  showChat?: boolean;
  showParticipants?: boolean;
}

// ─── Settings menu state ───────────────────────────────────────────────────────
type SettingsMenu = 'main' | 'quality' | 'audio' | 'subtitle';

// ─── Component ─────────────────────────────────────────────────────────────────
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  mediaId,
  poster,
  className,
  onToggleChat,
  onToggleParticipants,
  showChat,
  showParticipants,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const savedTimeRef = useRef(0);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user } = useAuth();
  const {
    videoState,
    setVideoPlaying,
    setVideoTime,
    setVideoDuration,
    setVideoVolume,
    room,
  } = useRooms();

  // Track isPlaying in a ref so loadHls() callback doesn't capture stale state
  const isPlayingRef = useRef(false);
  // ── UI state ─────────────────────────────────────────────────────────────────
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMenu, setSettingsMenu] = useState<SettingsMenu>('main');
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Stream selection state ───────────────────────────────────────────────────
  const [audioStreams, setAudioStreams] = useState<JellyfinStream[]>([]);
  const [subtitleStreams, setSubtitleStreams] = useState<JellyfinStream[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<QualityLevel>(QUALITY_LEVELS[0]);
  const [selectedAudio, setSelectedAudio] = useState<number | undefined>(undefined);
  const [selectedSubtitle, setSelectedSubtitle] = useState<number>(-1); // -1 = off

  const { isPlaying, currentTime, duration, volume } = videoState;

  // Keep ref in sync
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);


  // ── Fetch stream metadata when mediaId changes ────────────────────────────────
  useEffect(() => {
    if (!mediaId) return;
    setAudioStreams([]);
    setSubtitleStreams([]);
    setSelectedAudio(undefined);
    setSelectedSubtitle(-1);
    setSelectedQuality(QUALITY_LEVELS[0]);

    fetchJellyfinStreams(mediaId).then((streams) => {
      const audio = streams.filter(s => s.Type === 'Audio');
      const subtitle = streams.filter(s => s.Type === 'Subtitle');
      setAudioStreams(audio);
      setSubtitleStreams(subtitle);
      // Auto-select first default audio
      const defAudio = audio.find(a => a.IsDefault) ?? audio[0];
      if (defAudio) setSelectedAudio(defAudio.Index);
    });
  }, [mediaId]);

  // ── Load / reload HLS when mediaId or settings change ────────────────────────
  const loadHls = useCallback((mid: string, quality: QualityLevel, audio?: number, subtitle?: number) => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const subIdx = subtitle ?? -1;
    const url = buildHlsUrl(mid, quality, audio, subIdx >= 0 ? subIdx : undefined);

    if (Hls.isSupported()) {
      const hls = new Hls({
        manifestLoadingTimeOut: 30_000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 20_000,
        fragLoadingTimeOut: 20_000,
        fragLoadingMaxRetry: 4,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startPosition: -1,
        autoStartLoad: true,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setBuffering(false);
        // Restore position after quality/audio/subtitle switch
        if (savedTimeRef.current > 2) video.currentTime = savedTimeRef.current;
        // Use ref (not stale closure) to auto-resume playback after quality change
        if (isPlayingRef.current) video.play().catch(() => { });
      });

      hls.on(Hls.Events.ERROR, (_evt: unknown, data: { fatal: boolean; type: string; details: string }) => {
        if (!data.fatal) return;
        console.error('[HLS] fatal error', data.type, data.details);
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setTimeout(() => hls.startLoad(), 3_000);
        } else {
          setError('Error cargando el vídeo. Inténtalo de nuevo.');
          setBuffering(false);
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.onloadedmetadata = () => setBuffering(false);
    } else {
      setError('Tu navegador no soporta reproducción HLS.');
      setBuffering(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-initialise when mediaId changes
  useEffect(() => {
    if (!mediaId) return;
    savedTimeRef.current = 0;
    loadHls(mediaId, selectedQuality, selectedAudio, selectedSubtitle);
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  // ── Quality change ────────────────────────────────────────────────────────────
  const applyQuality = (q: QualityLevel) => {
    if (!mediaId) return;
    savedTimeRef.current = videoRef.current?.currentTime ?? 0;
    setSelectedQuality(q);
    setShowSettings(false);
    loadHls(mediaId, q, selectedAudio, selectedSubtitle);
  };

  // ── Audio change ──────────────────────────────────────────────────────────────
  const applyAudio = (index: number) => {
    if (!mediaId) return;
    savedTimeRef.current = videoRef.current?.currentTime ?? 0;
    setSelectedAudio(index);
    setShowSettings(false);
    loadHls(mediaId, selectedQuality, index, selectedSubtitle);
  };

  // ── Subtitle change ───────────────────────────────────────────────────────────
  const applySubtitle = (index: number) => {
    if (!mediaId) return;
    savedTimeRef.current = videoRef.current?.currentTime ?? 0;
    setSelectedSubtitle(index);
    setShowSettings(false);
    loadHls(mediaId, selectedQuality, selectedAudio, index);
  };

  // ── Sync play/pause from room state ──────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.play().catch(() => { });
    else video.pause();
  }, [isPlaying]);

  // ── Sync seek from room state ─────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.currentTime - currentTime) > 2) video.currentTime = currentTime;
  }, [currentTime]);

  // ── Sync volume ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  // ── Video event callbacks ─────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setVideoTime(videoRef.current.currentTime);
  }, [setVideoTime]);
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setVideoDuration(videoRef.current.duration);
  }, [setVideoDuration]);
  const handleWaiting = useCallback(() => setBuffering(true), []);
  const handlePlaying = useCallback(() => setBuffering(false), []);

  // ── Player controls ───────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => setVideoPlaying(!isPlaying), [isPlaying, setVideoPlaying]);
  const toggleMute = useCallback(() => setVideoVolume(volume === 0 ? 1 : 0), [volume, setVideoVolume]);
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setVideoVolume(parseFloat(e.target.value)),
    [setVideoVolume]
  );
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setVideoTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  }, [setVideoTime]);
  const skip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    const t = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    setVideoTime(t);
    videoRef.current.currentTime = t;
  }, [duration, setVideoTime]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!isFullscreen) await containerRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch { }
  }, [isFullscreen]);

  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fn);
    return () => document.removeEventListener('fullscreenchange', fn);
  }, []);

  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !showSettings) setShowControls(false);
    }, 3000);
  }, [isPlaying, showSettings]);

  useEffect(() => () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
  }, []);

  const formatTime = (t: number) => {
    if (!isFinite(t) || isNaN(t)) return '0:00';
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const streamLabel = (s: JellyfinStream) => {
    const lang = (s.Language ?? '').toUpperCase().slice(0, 3) || '???';
    const title = s.DisplayTitle ?? s.Codec ?? '';
    return title ? `${lang} · ${title}` : lang;
  };

  // ── Error / no-media states ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className={cn('relative bg-black flex items-center justify-center', className)}>
        <p className="text-red-400 text-sm text-center px-4">⚠️ {error}</p>
      </div>
    );
  }
  if (!mediaId) {
    return (
      <div className={cn('relative bg-black flex items-center justify-center', className)}>
        <p className="text-white/40 text-sm">Sin contenido seleccionado</p>
      </div>
    );
  }

  // ── Settings panel ────────────────────────────────────────────────────────────
  const SettingsPanel = () => (
    <div className="absolute bottom-16 right-4 w-56 bg-[#1e1e1e]/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl z-30">

      {/* ── main menu ── */}
      {settingsMenu === 'main' && (
        <div className="py-1">
          <p className="text-white/30 text-[10px] uppercase tracking-widest px-4 pt-2 pb-1">Reproductor</p>

          <button onClick={() => setSettingsMenu('quality')}
            className="w-full px-4 py-2.5 flex justify-between items-center text-sm text-white hover:bg-white/10 transition-colors">
            <span>Calidad</span>
            <span className="text-white/50 text-xs">{selectedQuality.label.split(' ')[0]} {selectedQuality.label.split(' ')[1] ?? ''} ›</span>
          </button>

          {audioStreams.length > 0 && (
            <button onClick={() => setSettingsMenu('audio')}
              className="w-full px-4 py-2.5 flex justify-between items-center text-sm text-white hover:bg-white/10 transition-colors">
              <span>Audio</span>
              <span className="text-white/50 text-xs truncate max-w-[7rem]">
                {audioStreams.find(a => a.Index === selectedAudio)
                  ? streamLabel(audioStreams.find(a => a.Index === selectedAudio)!)
                  : 'Auto'} ›
              </span>
            </button>
          )}

          {subtitleStreams.length > 0 && (
            <button onClick={() => setSettingsMenu('subtitle')}
              className="w-full px-4 py-2.5 flex justify-between items-center text-sm text-white hover:bg-white/10 transition-colors">
              <span>Subtítulos</span>
              <span className="text-white/50 text-xs truncate max-w-[7rem]">
                {selectedSubtitle === -1 ? 'Off'
                  : subtitleStreams.find(s => s.Index === selectedSubtitle)
                    ? streamLabel(subtitleStreams.find(s => s.Index === selectedSubtitle)!)
                    : 'Off'} ›
              </span>
            </button>
          )}
        </div>
      )}

      {/* ── quality submenu ── */}
      {settingsMenu === 'quality' && (
        <div className="py-1">
          <button onClick={() => setSettingsMenu('main')}
            className="flex items-center gap-1 px-4 py-2.5 text-white/60 hover:text-white text-sm w-full transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Calidad
          </button>
          <div className="border-t border-white/10 mb-1" />
          {QUALITY_LEVELS.map(q => (
            <button key={q.label} onClick={() => applyQuality(q)}
              className={cn('w-full px-4 py-2.5 text-left text-sm transition-colors',
                q.label === selectedQuality.label
                  ? 'text-[#ff6b35] bg-[#ff6b35]/10'
                  : 'text-white hover:bg-white/10')}>
              {q.label}
              {q.label === selectedQuality.label && <span className="ml-2 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── audio submenu ── */}
      {settingsMenu === 'audio' && (
        <div className="py-1">
          <button onClick={() => setSettingsMenu('main')}
            className="flex items-center gap-1 px-4 py-2.5 text-white/60 hover:text-white text-sm w-full transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Audio
          </button>
          <div className="border-t border-white/10 mb-1" />
          {audioStreams.map(a => (
            <button key={a.Index} onClick={() => applyAudio(a.Index)}
              className={cn('w-full px-4 py-2.5 text-left text-sm transition-colors',
                a.Index === selectedAudio
                  ? 'text-[#ff6b35] bg-[#ff6b35]/10'
                  : 'text-white hover:bg-white/10')}>
              {streamLabel(a)}
              {a.Index === selectedAudio && <span className="ml-2 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── subtitle submenu ── */}
      {settingsMenu === 'subtitle' && (
        <div className="py-1">
          <button onClick={() => setSettingsMenu('main')}
            className="flex items-center gap-1 px-4 py-2.5 text-white/60 hover:text-white text-sm w-full transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Subtítulos
          </button>
          <div className="border-t border-white/10 mb-1" />
          <button onClick={() => applySubtitle(-1)}
            className={cn('w-full px-4 py-2.5 text-left text-sm transition-colors',
              selectedSubtitle === -1
                ? 'text-[#ff6b35] bg-[#ff6b35]/10'
                : 'text-white hover:bg-white/10')}>
            Desactivado {selectedSubtitle === -1 && <span className="ml-2 text-xs">✓</span>}
          </button>
          {subtitleStreams.map(s => (
            <button key={s.Index} onClick={() => applySubtitle(s.Index)}
              className={cn('w-full px-4 py-2.5 text-left text-sm transition-colors',
                s.Index === selectedSubtitle
                  ? 'text-[#ff6b35] bg-[#ff6b35]/10'
                  : 'text-white hover:bg-white/10')}>
              {streamLabel(s)}
              {s.Index === selectedSubtitle && <span className="ml-2 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => (isPlaying && !showSettings) && setShowControls(false)}
      className={cn('relative bg-black overflow-hidden group', className)}
    >
      {/* ── Video element ── */}
      <video
        ref={videoRef}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onClick={() => { if (showSettings) { setShowSettings(false); return; } togglePlay(); }}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* ── Buffering spinner ── */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 border-4 border-white/20 border-t-[#ff6b35] rounded-full animate-spin" />
        </div>
      )}

      {/* ── Controls overlay ── */}
      <div className={cn(
        'absolute inset-0 flex flex-col justify-end transition-opacity duration-300',
        (showControls || !isPlaying) ? 'opacity-100' : 'opacity-0',
        'bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none'
      )}>
        {/* Pause indicator */}
        {!isPlaying && room && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full pointer-events-none">
            <span className="text-white text-sm">{user?.name || 'Alguien'} pausó la reproducción</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="px-4 pb-2 pointer-events-auto">
          <input type="range" min={0} max={duration || 100} value={currentTime} onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:bg-[#ff6b35] [&::-webkit-slider-thumb]:rounded-full
              hover:[&::-webkit-slider-thumb]:scale-125 transition-transform" />
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Button row */}
        <div className="flex items-center justify-between px-4 pb-4 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center text-white hover:text-[#ff6b35] transition-colors">
              {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
            </button>
            <button onClick={() => skip(-10)}
              className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={() => skip(10)}
              className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                  transition-all duration-200 overflow-hidden
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5
                  [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleChat && (
              <button onClick={onToggleChat}
                className={cn('w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                  showChat ? 'bg-[#ff6b35] text-white' : 'text-white/70 hover:text-white hover:bg-white/10')}>
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
            {onToggleParticipants && (
              <button onClick={onToggleParticipants}
                className={cn('w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                  showParticipants ? 'bg-[#ff6b35] text-white' : 'text-white/70 hover:text-white hover:bg-white/10')}>
                <Users className="w-5 h-5" />
              </button>
            )}
            {/* Settings gear */}
            <button onClick={() => { setShowSettings(!showSettings); setSettingsMenu('main'); }}
              className={cn('w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                showSettings ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10')}>
              <Settings className="w-5 h-5" />
            </button>
            {/* Fullscreen */}
            <button onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Settings panel (outside the faded overlay so always clickable) ── */}
      {showSettings && (
        <div className="pointer-events-auto">
          <SettingsPanel />
        </div>
      )}
    </div>
  );
};
