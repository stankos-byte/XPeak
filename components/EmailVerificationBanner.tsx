import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const EmailVerificationBanner: React.FC = () => {
  const { user, resendVerificationEmail, isUsingEmulator } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show banner if:
  // - User is not authenticated
  // - Email is already verified
  // - Using emulator (verification emails don't work in emulator)
  // - Banner was dismissed
  if (!user || user.emailVerified || isUsingEmulator || dismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to resend verification email:', err);
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleReloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-200 font-medium">
              Please verify your email address
            </p>
            <p className="text-xs text-amber-300/70 mt-0.5">
              We sent a verification link to <span className="font-medium text-amber-200">{user.email}</span>. 
              Check your inbox and click the link to verify your account.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showSuccess && (
            <span className="text-xs text-green-400 font-medium whitespace-nowrap">
              ✓ Email sent!
            </span>
          )}
          <button
            onClick={handleReloadPage}
            className="px-3 py-1.5 text-xs font-medium text-amber-200 hover:text-amber-100 border border-amber-500/30 hover:border-amber-500/50 rounded-md transition-colors whitespace-nowrap"
          >
            I verified
          </button>
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isResending ? 'Sending...' : 'Resend email'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-amber-400 hover:text-amber-300 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
