import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, ArrowLeft } from 'lucide-react';
import { HalftoneDots } from '../../components/HalftoneDots';
import Footer from '../../components/Footer';

interface BaseInfoPageProps {
  title: string;
  children: React.ReactNode;
}

const BaseInfoPage: React.FC<BaseInfoPageProps> = ({ title, children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.color = '#f8fafc';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-[#f8fafc] selection:bg-primary/30">
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
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-secondary/60 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <HalftoneDots className="-translate-x-1/4 -translate-y-1/4" color="#3b82f6" opacity={0.1} size="30px" fadeDirection="radial" />
          <HalftoneDots className="translate-x-1/4 translate-y-1/4 bottom-0 right-0" color="#8b5cf6" opacity={0.08} size="30px" fadeDirection="radial" />
          
          <div className="absolute top-40 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">
            {title}
          </h1>
          
          <div className="prose prose-invert prose-primary max-w-none">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BaseInfoPage;
