import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Home, ArrowLeft, Ghost, MapPinOff } from 'lucide-react';
import { HalftoneDots } from '../../components/HalftoneDots';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.color = '#f8fafc';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-[#f8fafc] selection:bg-primary/30 flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
              <Swords size={22} className="text-primary" />
            </div>
            <span className="text-lg font-black text-white uppercase tracking-tighter italic">
              XPeak
            </span>
          </div>
          
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-secondary/60 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Background Accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <HalftoneDots className="-translate-x-1/4 -translate-y-1/4" color="#3b82f6" opacity={0.1} size="30px" fadeDirection="radial" />
          <HalftoneDots className="translate-x-1/4 translate-y-1/4 bottom-0 right-0" color="#8b5cf6" opacity={0.08} size="30px" fadeDirection="radial" />
          
          <div className="absolute top-40 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          {/* 404 Icon */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full border border-primary/30">
              <MapPinOff size={64} className="text-primary" />
            </div>
            <Ghost 
              size={32} 
              className="absolute -top-2 -right-2 text-purple-400 animate-bounce" 
              style={{ animationDuration: '2s' }}
            />
          </div>

          {/* Error Code */}
          <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-primary mb-4 tracking-tighter">
            404
          </h1>

          {/* Message */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Quest Not Found
          </h2>
          <p className="text-secondary/70 text-lg mb-10 max-w-md mx-auto">
            Looks like you've wandered off the map! This page doesn't exist or has been moved to another realm.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              <Home size={20} />
              Return Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <ArrowLeft size={20} />
              Go Back
            </button>
          </div>

          {/* Fun XP hint */}
          <p className="mt-12 text-secondary/40 text-sm">
            <span className="text-primary/60">+0 XP</span> — No experience gained from getting lost!
          </p>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
