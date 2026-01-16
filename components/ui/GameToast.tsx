import React from 'react';
import toast, { Toaster, Toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Flame, AlertTriangle, CheckCircle2, XCircle, Zap } from 'lucide-react';

// Custom toast container with game-styled appearance
export const GameToaster: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    >
      {(t) => (
        <AnimatePresence>
          {t.visible && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ToastContent toast={t} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Toaster>
  );
};

interface ToastContentProps {
  toast: Toast;
}

const ToastContent: React.FC<ToastContentProps> = ({ toast: t }) => {
  // Default styling for custom messages
  return (
    <div 
      className="bg-surface border border-secondary/30 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm flex items-center gap-3 min-w-[280px] max-w-[400px]"
      onClick={() => toast.dismiss(t.id)}
    >
      {t.icon}
      <div className="flex-1">
        {typeof t.message === 'string' ? (
          <p className="text-sm font-medium text-white">{t.message}</p>
        ) : (
          t.message
        )}
      </div>
    </div>
  );
};

// XP Gain Toast - The star of the show!
export const toastXP = (amount: number, reason?: string) => {
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="bg-gradient-to-r from-primary/90 to-cyan-400/90 border border-primary/50 rounded-xl px-5 py-4 shadow-2xl shadow-primary/30 backdrop-blur-sm flex items-center gap-4 min-w-[300px]"
      onClick={() => toast.dismiss(t.id)}
    >
      <motion.div
        initial={{ rotate: -180, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
      >
        <Sparkles className="w-8 h-8 text-background" />
      </motion.div>
      <div className="flex-1">
        <motion.p 
          className="text-2xl font-black text-background"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          +{amount} XP
        </motion.p>
        {reason && (
          <motion.p 
            className="text-xs text-background/80 font-medium uppercase tracking-wider"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {reason}
          </motion.p>
        )}
      </div>
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ 
          duration: 0.5,
          repeat: 2,
          repeatDelay: 0.2
        }}
      >
        <Zap className="w-6 h-6 text-background/80" />
      </motion.div>
    </motion.div>
  ), { duration: 4000 });
};

// Level Up Toast - Epic celebration!
export const toastLevelUp = (newLevel: number) => {
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: 50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-2 border-yellow-300 rounded-2xl px-6 py-5 shadow-2xl shadow-amber-500/40 flex items-center gap-4 min-w-[320px]"
      onClick={() => toast.dismiss(t.id)}
    >
      <motion.div
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.3, 1]
        }}
        transition={{ 
          duration: 1,
          repeat: Infinity,
          repeatDelay: 2
        }}
      >
        <Trophy className="w-10 h-10 text-background" />
      </motion.div>
      <div className="flex-1">
        <motion.p 
          className="text-xs text-background/80 font-bold uppercase tracking-widest"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Level Up!
        </motion.p>
        <motion.p 
          className="text-3xl font-black text-background"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          Level {newLevel}
        </motion.p>
      </div>
    </motion.div>
  ), { duration: 5000 });
};

// Streak Toast
export const toastStreak = (streak: number, taskTitle: string) => {
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-gradient-to-r from-orange-500/90 to-red-500/90 border border-orange-400/50 rounded-xl px-5 py-4 shadow-2xl shadow-orange-500/30 backdrop-blur-sm flex items-center gap-4 min-w-[300px]"
      onClick={() => toast.dismiss(t.id)}
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
        }}
        transition={{ 
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 0.5
        }}
      >
        <Flame className="w-7 h-7 text-white" />
      </motion.div>
      <div className="flex-1">
        <p className="text-lg font-black text-white">{streak} Day Streak!</p>
        <p className="text-xs text-white/80 font-medium truncate">{taskTitle}</p>
      </div>
    </motion.div>
  ), { duration: 3500 });
};

// Success Toast
export const toastSuccess = (message: string, description?: string) => {
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-surface border border-emerald-500/30 rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm flex items-center gap-3 min-w-[280px]"
      onClick={() => toast.dismiss(t.id)}
    >
      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{message}</p>
        {description && (
          <p className="text-xs text-secondary">{description}</p>
        )}
      </div>
    </motion.div>
  ));
};

// Error Toast
export const toastError = (message: string, description?: string) => {
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-surface border border-red-500/30 rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm flex items-center gap-3 min-w-[280px]"
      onClick={() => toast.dismiss(t.id)}
    >
      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{message}</p>
        {description && (
          <p className="text-xs text-secondary">{description}</p>
        )}
      </div>
    </motion.div>
  ));
};

// Warning Toast
export const toastWarning = (message: string, description?: string) => {
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-surface border border-amber-500/30 rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm flex items-center gap-3 min-w-[280px]"
      onClick={() => toast.dismiss(t.id)}
    >
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{message}</p>
        {description && (
          <p className="text-xs text-secondary">{description}</p>
        )}
      </div>
    </motion.div>
  ));
};

// Export a simple API
export const gameToast = {
  xp: toastXP,
  levelUp: toastLevelUp,
  streak: toastStreak,
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
};

export default gameToast;
