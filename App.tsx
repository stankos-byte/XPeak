import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LandingView from './pages/landing/Landing';
import AppLayout from './AppLayout';
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<ThemedAppLayout />} />
          <Route path="/studio" element={<ThemedAppLayout />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
