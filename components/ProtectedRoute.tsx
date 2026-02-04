import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const isDev = import.meta.env.DEV;

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1625]">
        <div className="flex flex-col items-center gap-4">
          {/* Animated loading spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3b82f6] animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // In development: allow access without sign-in (use local/anonymous data)
  if (isDev && !user) {
    return (
      <>
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-center text-amber-200 text-sm font-medium">
          Dev mode — using local data (not signed in)
        </div>
        {children}
      </>
    );
  }

  // Redirect to login if not authenticated (production)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
