import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { NotificationContainer } from '@/components/Layout/Notification';

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const MoviesPage = React.lazy(() => import('./pages/MoviesPage'));
const SeriesPage = React.lazy(() => import('./pages/SeriesPage'));
const DetailsPage = React.lazy(() => import('./pages/DetailsPage'));
const WatchPage = React.lazy(() => import('./pages/WatchPage'));
const FriendsPage = React.lazy(() => import('./pages/FriendsPage'));
const RoomsPage = React.lazy(() => import('./pages/RoomsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Loading component for suspense fallback
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-white/20 border-t-[#ff6b35] rounded-full animate-spin" />
  </div>
);

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects to home if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <React.Suspense fallback={<PageLoader />}>
              <LoginPage />
            </React.Suspense>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <React.Suspense fallback={<PageLoader />}>
              <RegisterPage />
            </React.Suspense>
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<PageLoader />}>
              <HomePage />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/movies"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<PageLoader />}>
              <MoviesPage />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/series"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<PageLoader />}>
              <SeriesPage />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/details/:id"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<PageLoader />}>
              <DetailsPage />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/watch/:roomId"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<PageLoader />}>
              <WatchPage />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<PageLoader />}>
              <FriendsPage />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<PageLoader />}>
              <RoomsPage />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<PageLoader />}>
              <ProfilePage />
            </React.Suspense>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <React.Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </React.Suspense>
        }
      />
    </Routes>
  );
};

// Auth initializer - restores session from Supabase on app load
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initSession = useAuthStore((s) => s.initSession);
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore session on mount
    initSession().finally(() => setReady(true));

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setToken(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Re-init to get fresh profile data
          await initSession();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initSession, setUser, setToken]);

  if (!ready) {
    return <PageLoader />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthInitializer>
          <AppRoutes />
          <NotificationContainer />
          <Analytics />
        </AuthInitializer>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
