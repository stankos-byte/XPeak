import React from 'react';
import { Link } from 'react-router-dom';
import { Swords } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface/50 border-t border-secondary/10 relative">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1 relative">
            <div className="relative z-10 flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-xl border border-primary/30">
                <Swords size={28} className="text-primary" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">
                XPeak
              </h3>
            </div>
            <p className="text-secondary/80 text-sm leading-relaxed mb-6">
              Transform your life into an epic journey. Complete quests, level up your skills, and achieve your goals with gamified productivity.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-white font-black uppercase tracking-wider text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/features" className="text-secondary/80 hover:text-primary transition-colors text-sm">Features</Link>
              </li>
              <li>
                <Link to="/pricing" className="text-secondary/80 hover:text-primary transition-colors text-sm">Pricing</Link>
              </li>
              <li>
                <Link to="/faq" className="text-secondary/80 hover:text-primary transition-colors text-sm">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-white font-black uppercase tracking-wider text-sm mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-secondary/80 hover:text-primary transition-colors text-sm">About Us</Link>
              </li>
              <li>
                <Link to="/blog" className="text-secondary/80 hover:text-primary transition-colors text-sm">Blog</Link>
              </li>
              <li>
                <Link to="/feedback" className="text-secondary/80 hover:text-primary transition-colors text-sm">
                  Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-white font-black uppercase tracking-wider text-sm mb-4">Get The App</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="inline-flex items-center gap-2 text-secondary/80 hover:text-primary transition-colors text-sm bg-background border border-secondary/20 rounded-lg px-4 py-2 hover:border-primary/40">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  iOS App
                </a>
              </li>
              <li>
                <a href="#" className="inline-flex items-center gap-2 text-secondary/80 hover:text-primary transition-colors text-sm bg-background border border-secondary/20 rounded-lg px-4 py-2 hover:border-primary/40">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  Android App
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-secondary/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-secondary/60 text-sm">
            © 2026 XPeak. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/support" className="text-secondary/60 hover:text-primary transition-colors">Support</Link>
            <Link to="/privacy" className="text-secondary/60 hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-secondary/60 hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
