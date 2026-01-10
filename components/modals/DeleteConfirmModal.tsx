
import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, description }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-red-500/30 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden shadow-red-500/10">
        <div className="flex items-center justify-between p-4 border-b border-red-500/10 bg-red-500/5">
            <h3 className="font-black text-red-500 uppercase tracking-widest text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> Confirm Delete
            </h3>
            <button onClick={onClose} className="text-secondary hover:text-white transition-colors">
                <X size={18} />
            </button>
        </div>
        <div className="p-6 text-center">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter italic mb-3">{title}</h2>
          <p className="text-secondary text-sm font-medium mb-6 leading-relaxed">{description}</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirm} 
              className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
            <button 
              onClick={onClose} 
              className="w-full bg-surface border border-secondary/30 text-secondary hover:text-white font-black uppercase tracking-widest py-3 px-4 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
