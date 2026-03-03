import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMediaStore } from '@/stores/mediaStore';
import { apiService } from '@/lib/api-service';
import { useAuthStore } from '@/stores/authStore';

let globalHasFetched = false;

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
    setTrending,
    setContinueWatching,
    setSelectedMedia,
    setLoading,
    setError,
    addToFavorites,
    removeFromFavorites,
    getMediaById,
    getMediaByType,
    getFavoritesList,
    isFavorite,
  } = useMediaStore();

  const [hasMoreMovies, setHasMoreMovies] = useState(true);
  const [hasMoreSeries, setHasMoreSeries] = useState(true);

  const loadMovies = useCallback(async (skip = 0, limit = 200) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getMediaList('movies', skip, limit);
      if (skip === 0) {
        setMovies(data);
      } else {
        setMovies([...movies, ...data]);
      }
      setHasMoreMovies(data.length >= limit);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setMovies, movies]);

  const loadMoreMovies = useCallback(async () => {
    if (!hasMoreMovies || isLoading) return;
    await loadMovies(movies.length, 100);
  }, [hasMoreMovies, isLoading, movies.length, loadMovies]);

  const loadSeries = useCallback(async (skip = 0, limit = 200) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getMediaList('series', skip, limit);
      if (skip === 0) {
        setSeries(data);
      } else {
        setSeries([...series, ...data]);
      }
      setHasMoreSeries(data.length >= limit);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSeries, series]);

  const loadMoreSeries = useCallback(async () => {
    if (!hasMoreSeries || isLoading) return;
    await loadSeries(series.length, 100);
  }, [hasMoreSeries, isLoading, series.length, loadSeries]);

  const loadTrending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch top-rated movies + series in parallel with tiny limit (no type=all which can be slow)
      const [moviesData, seriesData] = await Promise.all([
        apiService.getMediaList('movies', 0, 5).catch(() => []),
        apiService.getMediaList('series', 0, 5).catch(() => []),
      ]);
      const combined = [...moviesData, ...seriesData];
      const sorted = combined.sort((a, b) => b.rating - a.rating);
      setTrending(sorted);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setTrending]);

  const loadContinueWatching = useCallback(async () => {
    try {
      const data = await apiService.getContinueWatching(10);
      const mediaPromises = data
        .filter((item) => !item.completed && item.currentTime > 0)
        .slice(0, 5)
        .map(async (item) => {
          try {
            return await apiService.getMediaDetails(item.mediaId);
          } catch {
            return null;
          }
        });

      const mediaData = (await Promise.all(mediaPromises)).filter((m): m is NonNullable<Awaited<ReturnType<typeof apiService.getMediaDetails>>> => m !== null);
      setContinueWatching(mediaData);
    } catch {
      // Silent fail
    }
  }, [setContinueWatching]);

  const loadMediaDetails = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getMediaDetails(id);
      setSelectedMedia(data);
      return data;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSelectedMedia]);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      globalHasFetched = false;
      return;
    }
    if (globalHasFetched) return;
    globalHasFetched = true;

    // Initial data load when authenticated
    loadMovies(0, 50); // Just fetch 50 initially, infinite scroll will load the rest
    loadSeries(0, 50);
    loadTrending();
    loadContinueWatching();
  }, [isAuthenticated, loadMovies, loadSeries, loadTrending, loadContinueWatching]);

  const allMedia = useMemo(() => [...movies, ...series], [movies, series]);

  const getByGenre = useCallback((genre: string) => {
    return allMedia.filter((m) => m.genres?.includes(genre));
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
        m.title?.toLowerCase().includes(lowerQuery) ||
        m.genres?.some((g) => g.toLowerCase().includes(lowerQuery)) ||
        m.synopsis?.toLowerCase().includes(lowerQuery)
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
    movies,
    series,
    trending,
    continueWatching,
    favorites,
    selectedMedia,
    isLoading,
    error,
    allMedia,
    hasMoreMovies,
    hasMoreSeries,

    setMovies,
    setSeries,
    loadMovies,
    loadSeries,
    loadMoreMovies,
    loadMoreSeries,
    loadTrending,
    loadContinueWatching,
    loadMediaDetails,
    setSelectedMedia,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,

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
