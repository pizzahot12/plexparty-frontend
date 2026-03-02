import { create } from 'zustand';
import type { Media, MediaType } from '@/types';

interface MediaState {
  movies: Media[];
  series: Media[];
  trending: Media[];
  continueWatching: Media[];
  favorites: string[];
  selectedMedia: Media | null;
  isLoading: boolean;
  error: string | null;
}

interface MediaStore extends MediaState {
  setMovies: (movies: Media[]) => void;
  setSeries: (series: Media[]) => void;
  setTrending: (media: Media[]) => void;
  setContinueWatching: (media: Media[]) => void;
  setSelectedMedia: (media: Media | null) => void;
  addToFavorites: (mediaId: string) => void;
  removeFromFavorites: (mediaId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getMediaById: (id: string) => Media | undefined;
  getMediaByType: (type: MediaType) => Media[];
  getFavoritesList: () => Media[];
  isFavorite: (mediaId: string) => boolean;
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  movies: [],
  series: [],
  trending: [],
  continueWatching: [],
  favorites: [],
  selectedMedia: null,
  isLoading: false,
  error: null,

  setMovies: (movies) => set({ movies }),
  setSeries: (series) => set({ series }),
  setTrending: (trending) => set({ trending }),
  setContinueWatching: (continueWatching) => set({ continueWatching }),
  setSelectedMedia: (selectedMedia) => set({ selectedMedia }),

  addToFavorites: (mediaId) => {
    set((state) => ({
      favorites: [...state.favorites, mediaId],
    }));
  },

  removeFromFavorites: (mediaId) => {
    set((state) => ({
      favorites: state.favorites.filter((id) => id !== mediaId),
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  getMediaById: (id) => {
    const state = get();
    return state.movies.find((m) => m.id === id) || state.series.find((s) => s.id === id);
  },

  getMediaByType: (type) => {
    const state = get();
    return type === 'movie' ? state.movies : state.series;
  },

  getFavoritesList: () => {
    const state = get();
    return [...state.movies, ...state.series].filter((m) => state.favorites.includes(m.id));
  },

  isFavorite: (mediaId) => {
    return get().favorites.includes(mediaId);
  },
}));
