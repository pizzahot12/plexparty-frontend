import { useCallback, useMemo } from 'react';
import { useMediaStore } from '@/stores/mediaStore';


export const useMedia = () => {
  const {
    movies,
    series,
    trending,
    continueWatching,
    favorites,
    selectedMedia,
    isLoading,
    error,
    setMovies,
    setSeries,
    setSelectedMedia,
    addToFavorites,
    removeFromFavorites,
    getMediaById,
    getMediaByType,
    getFavoritesList,
    isFavorite,
  } = useMediaStore();

  const allMedia = useMemo(() => [...movies, ...series], [movies, series]);

  const getByGenre = useCallback((genre: string) => {
    return allMedia.filter((m) => m.genres.includes(genre));
  }, [allMedia]);

  const getByYear = useCallback((year: number) => {
    return allMedia.filter((m) => m.year === year);
  }, [allMedia]);

  const getByRating = useCallback((minRating: number) => {
    return allMedia.filter((m) => m.rating >= minRating);
  }, [allMedia]);

  const searchMedia = useCallback((query: string) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return allMedia.filter(
      (m) =>
        m.title.toLowerCase().includes(lowerQuery) ||
        m.genres.some((g) => g.toLowerCase().includes(lowerQuery)) ||
        m.synopsis.toLowerCase().includes(lowerQuery)
    );
  }, [allMedia]);

  const toggleFavorite = useCallback((mediaId: string) => {
    if (isFavorite(mediaId)) {
      removeFromFavorites(mediaId);
    } else {
      addToFavorites(mediaId);
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  return {
    // Data
    movies,
    series,
    trending,
    continueWatching,
    favorites,
    selectedMedia,
    isLoading,
    error,
    allMedia,
    
    // Actions
    setMovies,
    setSeries,
    setSelectedMedia,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    
    // Getters
    getMediaById,
    getMediaByType,
    getFavoritesList,
    isFavorite,
    getByGenre,
    getByYear,
    getByRating,
    searchMedia,
  };
};
