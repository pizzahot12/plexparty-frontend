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
  // Actions
  setMovies: (movies: Media[]) => void;
  setSeries: (series: Media[]) => void;
  setTrending: (media: Media[]) => void;
  setContinueWatching: (media: Media[]) => void;
  setSelectedMedia: (media: Media | null) => void;
  addToFavorites: (mediaId: string) => void;
  removeFromFavorites: (mediaId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Getters
  getMediaById: (id: string) => Media | undefined;
  getMediaByType: (type: MediaType) => Media[];
  getFavoritesList: () => Media[];
  isFavorite: (mediaId: string) => boolean;
}

// Mock data generator
const generateMockMedia = (): { movies: Media[]; series: Media[] } => {
  const genres = ['Acción', 'Aventura', 'Drama', 'Comedia', 'Ciencia Ficción', 'Terror', 'Romance', 'Suspense'];
  
  const movies: Media[] = Array.from({ length: 20 }, (_, i) => ({
    id: `movie-${i + 1}`,
    title: [
      'El Padrino', 'Pulp Fiction', 'El Caballero Oscuro', 'Inception', 'Interstellar',
      'Matrix', 'Forrest Gump', 'Titanic', 'Avatar', 'Avengers: Endgame',
      'Parasite', 'Joker', 'Dune', 'Spider-Man: No Way Home', 'The Batman',
      'Oppenheimer', 'Barbie', 'John Wick 4', 'Mission: Impossible', 'Top Gun: Maverick'
    ][i],
    type: 'movie',
    poster: `https://picsum.photos/seed/movie${i + 1}/300/450`,
    backdrop: `https://picsum.photos/seed/movie${i + 1}bg/1920/1080`,
    rating: Number((Math.random() * 3 + 7).toFixed(1)),
    year: 2015 + Math.floor(Math.random() * 9),
    duration: 90 + Math.floor(Math.random() * 90),
    synopsis: 'Una emocionante historia que te mantendrá al borde de tu asiento. Descubre un mundo lleno de aventuras y emociones.',
    genres: [genres[Math.floor(Math.random() * genres.length)], genres[Math.floor(Math.random() * genres.length)]],
    cast: [
      { id: '1', name: 'Actor Principal', character: 'Protagonista' },
      { id: '2', name: 'Actriz Secundaria', character: 'Co-protagonista' },
    ],
    director: 'Director Famoso',
  }));

  const series: Media[] = Array.from({ length: 15 }, (_, i) => ({
    id: `series-${i + 1}`,
    title: [
      'Breaking Bad', 'Game of Thrones', 'Stranger Things', 'The Crown', 'The Mandalorian',
      'The Witcher', 'Squid Game', 'Money Heist', 'Dark', 'Chernobyl',
      'The Last of Us', 'House of the Dragon', 'The Boys', 'Mandalorian', 'Loki'
    ][i],
    type: 'series',
    poster: `https://picsum.photos/seed/series${i + 1}/300/450`,
    backdrop: `https://picsum.photos/seed/series${i + 1}bg/1920/1080`,
    rating: Number((Math.random() * 3 + 7).toFixed(1)),
    year: 2015 + Math.floor(Math.random() * 9),
    synopsis: 'Una serie épica que redefine el género. Cada episodio te dejará queriendo más.',
    genres: [genres[Math.floor(Math.random() * genres.length)], genres[Math.floor(Math.random() * genres.length)]],
    cast: [
      { id: '1', name: 'Actor Principal', character: 'Protagonista' },
      { id: '2', name: 'Actriz Secundaria', character: 'Co-protagonista' },
    ],
    seasons: Array.from({ length: 3 + Math.floor(Math.random() * 3) }, (_, s) => ({
      id: `season-${i + 1}-${s + 1}`,
      number: s + 1,
      title: `Temporada ${s + 1}`,
      episodes: Array.from({ length: 8 + Math.floor(Math.random() * 4) }, (_, e) => ({
        id: `episode-${i + 1}-${s + 1}-${e + 1}`,
        number: e + 1,
        title: `Episodio ${e + 1}`,
        duration: 45 + Math.floor(Math.random() * 15),
        synopsis: 'Un episodio lleno de giros inesperados.',
        thumbnail: `https://picsum.photos/seed/ep${i + 1}${s + 1}${e + 1}/400/225`,
      })),
    })),
  }));

  return { movies, series };
};

const { movies, series } = generateMockMedia();

export const useMediaStore = create<MediaStore>((set, get) => ({
  movies,
  series,
  trending: [...movies.slice(0, 5), ...series.slice(0, 5)].sort(() => Math.random() - 0.5),
  continueWatching: movies.slice(0, 3),
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
