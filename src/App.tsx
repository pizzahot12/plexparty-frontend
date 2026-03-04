import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { NotificationContainer } from '@/components/Layout/Notification';
import { FriendsChatWidget } from '@/components/Friends/FriendsChatWidget';
import { supabase } from '@/lib/supabase';

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

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initSession = useAuthStore((s) => s.initSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const logout = useAuthStore((s) => s.logout);
  const [ready, setReady] = useState(false);
  const [waitlistError, setWaitlistError] = useState(false);

  useEffect(() => {
    let mounted = true;

    initSession().finally(() => {
      if (mounted) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session) {
        setReady(false);
        const result = await googleLogin(session.access_token);
        if (result && !result.success && result.isPending) {
          setWaitlistError(true);
          await supabase.auth.signOut();
        } else if (result && !result.success) {
          await logout();
          await supabase.auth.signOut();
        }
        if (mounted) setReady(true);
      } else if (event === 'SIGNED_OUT') {
        await logout();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initSession, googleLogin, logout]);

  // Start/stop global presence tracking based on auth state
  useEffect(() => {
    if (isAuthenticated && ready) {
      import('@/lib/global-presence').then(({ globalPresenceService }) => {
        globalPresenceService.start();
      });
    }
    return () => {
      import('@/lib/global-presence').then(({ globalPresenceService }) => {
        globalPresenceService.stop();
      });
    };
  }, [isAuthenticated, ready]);

  if (waitlistError) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">¡Estás en la Lista de Espera!</h1>
        <p className="text-white/70 max-w-md mx-auto">
          Hemos recibido tu solicitud de registro. Actualmente, PlexParty requiere aprobación del administrador.
          Por favor, espera a que tu cuenta sea aprobada para poder iniciar sesión.
        </p>
        <button onClick={() => { setWaitlistError(false); setReady(true); window.location.href = '/login'; }} className="mt-8 px-6 py-2 bg-[#ff6b35] text-white rounded-lg hover:bg-[#ff8555] font-medium transition-colors">
          Volver al inicio
        </button>
      </div>
    );
  }

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
          <FriendsChatWidget />
          <NotificationContainer />
        </AuthInitializer>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
