import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LandingView from './pages/landing/Landing';
import AppLayout from './AppLayout';
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  return <LandingView onGetStarted={handleGetStarted} />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<AppLayout />} />
        <Route path="/studio" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
