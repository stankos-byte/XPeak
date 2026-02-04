import React, { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { changePassword } = useAuth();

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    if (!currentPassword) {
      setError('Please enter your current password');
      return false;
    }
    if (!newPassword) {
      setError('Please enter a new password');
      return false;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return false;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      
      // Close modal after showing success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      if (err.message.includes('wrong-password') || err.message.includes('invalid-credential')) {
        setError('Current password is incorrect');
      } else if (err.message.includes('weak-password')) {
        setError('New password is too weak. Please use at least 8 characters');
      } else {
        setError(err.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-surface border border-secondary/30 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Lock size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Change Password</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-secondary hover:text-white transition-colors p-2 hover:bg-secondary/10 rounded-lg"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-sm font-medium text-center">
                Password changed successfully!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium text-center">
                {error}
              </p>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-secondary">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-background border border-secondary/30 rounded-xl p-4 pr-12 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-secondary/40"
                placeholder="Enter current password"
                disabled={isSubmitting || success}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-secondary">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-background border border-secondary/30 rounded-xl p-4 pr-12 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-secondary/40"
                placeholder="Enter new password (min 8 characters)"
                disabled={isSubmitting || success}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-secondary">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-background border border-secondary/30 rounded-xl p-4 pr-12 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-secondary/40"
                placeholder="Confirm new password"
                disabled={isSubmitting || success}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full bg-primary hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-background font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            {isSubmitting ? 'Changing Password...' : success ? 'Password Changed!' : 'Change Password'}
          </button>

          {/* Info Text */}
          <p className="text-secondary text-xs text-center">
            You will remain signed in after changing your password
          </p>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
