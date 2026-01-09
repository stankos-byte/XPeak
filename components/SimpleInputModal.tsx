import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SimpleInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  placeholder: string;
  initialValue?: string;
}

const SimpleInputModal: React.FC<SimpleInputModalProps> = ({ isOpen, onClose, onSubmit, title, placeholder, initialValue }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) setValue(initialValue || '');
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-secondary/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden shadow-primary/5">
        <div className="flex items-center justify-between p-5 border-b border-secondary/20 bg-background/40">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">{title}</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <input 
              type="text" 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-background border border-secondary/30 rounded-xl p-4 text-white focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-secondary/40 font-bold"
              placeholder={placeholder}
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            disabled={!value.trim()}
            className="w-full bg-primary hover:bg-cyan-400 disabled:opacity-30 disabled:grayscale text-background font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            {initialValue ? 'Update' : 'Deploy'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimpleInputModal;