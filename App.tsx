import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { initSentry } from './config/sentry';
import LandingView from './pages/landing/Landing';
import AppLayout from './AppLayout';
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';
import Plan from './pages/app/Plan';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { GameToaster } from './components/ui/GameToast';
import MaintenancePage from './pages/Maintenance';
import { subscribeToMaintenanceMode } from './services/maintenanceService';
import { MaintenanceConfig } from './types';

// Initialize Sentry error monitoring (must be done before React renders)
initSentry();

// Info Pages
import Features from './pages/info/Features';
import Pricing from './pages/info/Pricing';
import FAQ from './pages/info/FAQ';
import AboutUs from './pages/info/AboutUs';
import Blog from './pages/info/Blog';
import Feedback from './pages/info/Feedback';
import Support from './pages/info/Support';
import PrivacyPolicy from './pages/info/PrivacyPolicy';
import TermsOfService from './pages/info/TermsOfService';
import NotFound from './pages/info/NotFound';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  return <LandingView onGetStarted={handleGetStarted} />;
};

// Wrapper component for app routes that need the theme and auth protection
const ThemedAppLayout: React.FC = () => {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <ThemeProvider>
          <AppLayout />
        </ThemeProvider>
      </ErrorBoundary>
    </ProtectedRoute>
  );
};

const App: React.FC = () => {
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to maintenance mode changes
    const unsubscribe = subscribeToMaintenanceMode((config) => {
      setMaintenanceConfig(config);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show loading state while checking maintenance mode
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{
          color: 'white',
          fontSize: '18px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          Loading...
        </div>
      </div>
    );
  }

  // Show maintenance page if maintenance mode is active
  if (maintenanceConfig?.isMaintenanceMode) {
    return <MaintenancePage config={maintenanceConfig} />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GameToaster />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<ThemedAppLayout />} />
            <Route path="/app/*" element={<ThemedAppLayout />} />
            <Route path="/studio" element={<ThemedAppLayout />} />
            <Route path="/studio/*" element={<ThemedAppLayout />} />
            
            {/* Plan Page (Protected) */}
            <Route path="/plan" element={
              <ProtectedRoute>
                <ThemeProvider>
                  <Plan />
                </ThemeProvider>
              </ProtectedRoute>
            } />
            
            {/* Info Routes */}
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            
            {/* 404 Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
