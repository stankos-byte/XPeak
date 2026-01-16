import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LandingView from './pages/landing/Landing';
import AppLayout from './AppLayout';
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { GameToaster } from './components/ui/GameToast';

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

// Wrapper component for app routes that need the theme
const ThemedAppLayout: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <GameToaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<ThemedAppLayout />} />
          <Route path="/studio" element={<ThemedAppLayout />} />
          
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
    </ErrorBoundary>
  );
};

export default App;
