import React, { useState } from 'react';
import { X, User, Image, Mail, Crown, Palette, Sparkles, CreditCard, Lock, Info } from 'lucide-react';
import { UserProfile } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface SettingsViewProps {
  user: UserProfile;
  onClose: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'informations' | 'customizations'>('informations');
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-surface border border-secondary/20 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-secondary/10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Settings</h2>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-white transition-colors p-2 hover:bg-secondary/10 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 px-8 pt-6 border-b border-secondary/10">
          <button
            onClick={() => setActiveTab('informations')}
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'informations' 
                ? 'text-primary border-primary' 
                : 'text-secondary border-transparent hover:text-white'
            }`}
          >
            Informations
          </button>
          <button
            onClick={() => setActiveTab('customizations')}
            className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'customizations' 
                ? 'text-primary border-primary' 
                : 'text-secondary border-transparent hover:text-white'
            }`}
          >
            Customizations
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'informations' && (
            <div className="space-y-8">
              {/* Email Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <Mail size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Email</span>
                </div>
                <div className="bg-background border border-secondary/20 rounded-xl p-4">
                  <p className="text-white">user@xpeak.com</p>
                  <p className="text-secondary text-xs mt-1">Your account email address</p>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <Lock size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Password</span>
                </div>
                <button className="w-full bg-background border border-secondary/20 rounded-xl p-4 text-left hover:bg-surface transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium group-hover:text-primary transition-colors">Change Password</p>
                      <p className="text-secondary text-xs mt-1">Last changed 30 days ago</p>
                    </div>
                    <div className="text-secondary group-hover:text-primary transition-colors">→</div>
                  </div>
                </button>
              </div>

              {/* Plan Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <Crown size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Plan Details</span>
                </div>
                <div className="bg-gradient-to-br from-surface to-surface/50 border border-secondary/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">Free Plan</p>
                    <p className="text-secondary text-xs mt-1">Basic features included</p>
                  </div>
                  <button className="bg-primary hover:bg-cyan-400 text-background font-black uppercase tracking-widest text-xs py-2 px-4 rounded-lg transition-all">
                    Upgrade
                  </button>
                </div>
              </div>

              {/* Manage Billing Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <CreditCard size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Manage Billing</span>
                </div>
                <button className="w-full bg-background border border-secondary/20 rounded-xl p-4 text-left hover:bg-surface transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium group-hover:text-primary transition-colors">Payment & Subscription</p>
                      <p className="text-secondary text-xs mt-1">Update payment methods</p>
                    </div>
                    <div className="text-secondary group-hover:text-primary transition-colors">→</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'customizations' && (
            <div className="space-y-8">
              {/* Profile Picture */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <User size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Profile Picture</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-surface border-2 border-primary/40 flex items-center justify-center relative group cursor-pointer">
                    <User size={40} className="text-primary" />
                    <button className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Image size={24} className="text-white" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{user.name}</h3>
                    <p className="text-secondary text-sm">Level {user.level} • {user.totalXP} XP</p>
                    <p className="text-secondary text-xs mt-2">Click to upload new profile picture</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-secondary/10 my-6"></div>

              {/* Theme Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <Palette size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">Theme</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`bg-background rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-surface transition-colors ${
                      theme === 'dark' ? 'border-2 border-primary/40' : 'border border-secondary/20'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900"></div>
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary'}`}>Dark</span>
                  </button>
                  <button 
                    onClick={() => setTheme('light')}
                    className={`bg-background rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-surface transition-colors ${
                      theme === 'light' ? 'border-2 border-primary/40' : 'border border-secondary/20'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-50 to-slate-200"></div>
                    <span className={`text-xs font-medium ${theme === 'light' ? 'text-white' : 'text-secondary'}`}>Light</span>
                  </button>
                </div>
              </div>

              {/* Presets AI Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-secondary">
                  <Sparkles size={20} />
                  <span className="text-sm font-medium uppercase tracking-wider">AI Settings</span>
                </div>
                <button className="w-full bg-background border border-secondary/20 rounded-xl p-4 text-left hover:bg-surface transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium group-hover:text-primary transition-colors">Configure AI Preferences</p>
                      <p className="text-secondary text-xs mt-1">Customize assistant behavior</p>
                    </div>
                    <div className="text-secondary group-hover:text-primary transition-colors">→</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

