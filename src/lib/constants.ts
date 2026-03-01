// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://watch-together-2x.onrender.com/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'wss://watch-together-2x.onrender.com';

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// App Configuration
export const APP_NAME = 'PlexParty';
export const APP_TAGLINE = 'Mira películas y series con tus amigos';

// Timeouts
export const API_TIMEOUT = 30000; // 30 seconds
export const WS_RECONNECT_INTERVAL = 3000; // 3 seconds
export const NOTIFICATION_AUTO_DISMISS = 5000; // 5 seconds

// Video Player Configuration
export const VIDEO_QUALITIES: { value: string; label: string; height: number }[] = [
  { value: 'auto', label: 'Auto', height: 0 },
  { value: '480p', label: '480p', height: 480 },
  { value: '720p', label: 'HD 720p', height: 720 },
  { value: '1080p', label: 'Full HD 1080p', height: 1080 },
  { value: '4K', label: '4K Ultra HD', height: 2160 },
];

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

// Common Languages
export const COMMON_LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
];

// Genre Colors (for badges)
export const GENRE_COLORS: Record<string, string> = {
  'Acción': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Aventura': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Animación': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Comedia': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Crimen': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'Documental': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Drama': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Familia': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Fantasía': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Historia': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Terror': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'Música': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Misterio': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Romance': 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
  'Ciencia Ficción': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'Suspense': 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  'Bélica': 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  'Western': 'bg-amber-600/20 text-amber-500 border-amber-600/30',
};

// Default fallback colors
export const DEFAULT_GENRE_COLOR = 'bg-gray-500/20 text-gray-400 border-gray-500/30';

// Sidebar Navigation Items
export const SIDEBAR_ITEMS = [
  { label: 'Inicio', icon: 'Home', path: '/' },
  { label: 'Películas', icon: 'Film', path: '/movies' },
  { label: 'Series', icon: 'Tv', path: '/series' },
  { label: 'Salas', icon: 'DoorOpen', path: '/rooms' },
  { label: 'Amigos', icon: 'Users', path: '/friends' },
];

// Room code length
export const ROOM_CODE_LENGTH = 6;
export const FRIEND_CODE_LENGTH = 6;

// Pagination
export const ITEMS_PER_PAGE = 20;

// Carousel Configuration
export const CAROUSEL_CONFIG = {
  slidesToShow: {
    mobile: 2,
    tablet: 3,
    desktop: 4,
    large: 5,
  },
  slidesToScroll: 2,
  autoplaySpeed: 5000,
};
