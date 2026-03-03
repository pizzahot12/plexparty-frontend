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
  MessageSquare,
  Users,
} from 'lucide-react';

// ─── Jellyfin direct config ────────────────────────────────────────────────────
// The API key is intentionally in the frontend here because:
// 1. Jellyfin is an internal self-hosted server (your Orange Pi)
// 2. The stream goes directly browser → Jellyfin, not through Render
// 3. We avoid Render's 60-second timeout and 512 MB memory limit for video
const JELLYFIN_URL = import.meta.env.VITE_JELLYFIN_URL || 'https://jellyfin.watchtogether.nl';
const JELLYFIN_KEY = import.meta.env.VITE_JELLYFIN_KEY || 'fab44659f9b74192924b80d2a3b0e8a2';
const DEVICE_ID = 'watchparty';

/**
 * Build a Jellyfin HLS master.m3u8 URL for a given mediaId.
 * Uses SegmentContainer=ts (proven to work) with h264 + aac transcoding.
 */
function buildHlsUrl(mediaId: string): string {
  const sessionId = `pp_${mediaId.substring(0, 8)}_${Date.now()}`;
  const params = new URLSearchParams({
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
  });
  return `${JELLYFIN_URL}/Videos/${mediaId}/master.m3u8?${params.toString()}`;
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface VideoPlayerProps {
  /** Jellyfin item ID (movie or episode). When it changes, the player re-initialises. */
  mediaId?: string;
  poster?: string;
  className?: string;
  onToggleChat?: () => void;
  onToggleParticipants?: () => void;
  showChat?: boolean;
  showParticipants?: boolean;
}

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

  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isPlaying, currentTime, duration, volume } = videoState;

  // ── Initialise / re-initialise HLS when mediaId changes ─────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mediaId) return;

    setError(null);
    setBuffering(true);

    // Destroy any previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const hlsUrl = buildHlsUrl(mediaId);

    if (Hls.isSupported()) {
      const hls = new Hls({
        // Allow plenty of time for Orange Pi to start the transcode
        manifestLoadingTimeOut: 30_000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 20_000,
        fragLoadingTimeOut: 20_000,
        fragLoadingMaxRetry: 4,
        // Keep a good buffer so seek doesn't stall
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startPosition: -1,      // let HLS pick start
        autoStartLoad: true,
      });

      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setBuffering(false);
        // Restore room state if we re-joined mid-way
        if (currentTime > 2) video.currentTime = currentTime;
        if (isPlaying) video.play().catch(() => { });
      });

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        console.error('[HLS] fatal error', data.type, data.details);
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // Network hiccup — retry load after 3 s
          setTimeout(() => hls.startLoad(), 3_000);
        } else {
          setError('Error cargando el vídeo. Inténtalo de nuevo.');
          setBuffering(false);
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = hlsUrl;
      video.onloadedmetadata = () => setBuffering(false);
    } else {
      setError('Tu navegador no soporta reproducción HLS.');
      setBuffering(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
    // We intentionally only re-run when mediaId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  // ── Sync play/pause from room state ─────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.play().catch(() => { });
    else video.pause();
  }, [isPlaying]);

  // ── Sync seek from room state ────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.currentTime - currentTime) > 2) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  // ── Sync volume from room state ──────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
  }, [volume]);

  // ── Video event callbacks ────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setVideoTime(videoRef.current.currentTime);
  }, [setVideoTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setVideoDuration(videoRef.current.duration);
  }, [setVideoDuration]);

  const handleWaiting = useCallback(() => setBuffering(true), []);
  const handlePlaying = useCallback(() => setBuffering(false), []);

  // ── Controls ─────────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => setVideoPlaying(!isPlaying), [isPlaying, setVideoPlaying]);

  const toggleMute = useCallback(
    () => setVideoVolume(volume === 0 ? 1 : 0),
    [volume, setVideoVolume]
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setVideoVolume(parseFloat(e.target.value)),
    [setVideoVolume]
  );

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      setVideoTime(time);
      if (videoRef.current) videoRef.current.currentTime = time;
    },
    [setVideoTime]
  );

  const skip = useCallback(
    (seconds: number) => {
      if (!videoRef.current) return;
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      setVideoTime(newTime);
      videoRef.current.currentTime = newTime;
    },
    [duration, setVideoTime]
  );

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!isFullscreen) await containerRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch { }
  }, [isFullscreen]);

  // Fullscreen change listener
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
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

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

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={cn('relative bg-black flex items-center justify-center rounded-xl', className)}>
        <p className="text-red-400 text-sm text-center px-4">⚠️ {error}</p>
      </div>
    );
  }

  // ── No mediaId yet ────────────────────────────────────────────────────────────
  if (!mediaId) {
    return (
      <div className={cn('relative bg-black flex items-center justify-center rounded-xl', className)}>
        <p className="text-white/40 text-sm">Sin contenido seleccionado</p>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
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
        onClick={togglePlay}
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
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-end transition-opacity duration-300',
          (showControls || !isPlaying) ? 'opacity-100' : 'opacity-0',
          'bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none'
        )}
      >
        {/* Pause indicator */}
        {!isPlaying && room && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full pointer-events-none">
            <span className="text-white text-sm">{user?.name || 'Alguien'} pausó la reproducción</span>
          </div>
        )}

        {/* Progress bar + time */}
        <div className="px-4 pb-2 pointer-events-auto">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:bg-[#ff6b35] [&::-webkit-slider-thumb]:rounded-full
              hover:[&::-webkit-slider-thumb]:scale-125 transition-transform"
          />
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Button row */}
        <div className="flex items-center justify-between px-4 pb-4 pointer-events-auto">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center text-white hover:text-[#ff6b35] transition-colors">
              {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
            </button>

            {/* Skip -10 / +10 */}
            <button onClick={() => skip(-10)} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={() => skip(10)} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0} max={1} step={0.05}
                value={volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                  transition-all duration-200 overflow-hidden
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5
                  [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
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
            {/* Fullscreen */}
            <button onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
