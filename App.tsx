import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LandingView from './pages/landing/Landing';
import AppLayout from './AppLayout';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/app');
  };

  return <LandingView onGetStarted={handleGetStarted} />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
