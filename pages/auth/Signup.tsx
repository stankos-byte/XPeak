import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { 
    user, 
    signInWithGoogle,
    signInAsTestUser,
    isUsingEmulator,
    sendMagicLink, 
    signUpWithPassword, 
    error, 
    clearError,
    loading: authLoading 
  } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [authMode, setAuthMode] = useState<'magic-link' | 'password'>('magic-link');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070',
      title: 'Level Up Your Life,',
      subtitle: 'One Quest at a Time'
    },
    {
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070',
      title: 'Track Your Progress,',
      subtitle: 'Earn Experience Points'
    },
    {
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070',
      title: 'Complete Quests,',
      subtitle: 'Achieve Your Goals'
    }
  ];

  // Reset theme attribute for auth pages
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.style.backgroundColor = '#1a1625';
    document.body.style.color = '#ffffff';
  }, []);

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [slides.length]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/studio', { replace: true });
    }
  }, [user, navigate]);

  // Clear errors when switching modes
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [authMode, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      setLocalError('Please agree to the Terms & Conditions');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      if (authMode === 'magic-link') {
        await sendMagicLink(formData.email);
        setMagicLinkSent(true);
      } else {
        await signUpWithPassword(formData.email, formData.password);
        // Navigation will happen automatically via useEffect
      }
    } catch (err: any) {
      setLocalError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!formData.agreeToTerms) {
      setLocalError('Please agree to the Terms & Conditions');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
      // Navigation will happen automatically via useEffect
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign up with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignup = () => {
    // Apple Sign-In would require additional setup
    setLocalError('Apple Sign-In is not yet available');
  };

  const handleTestLogin = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await signInAsTestUser();
      // Navigation will happen automatically via useEffect
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in as test user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  // Show success message if magic link was sent
  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1625] p-8">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-white text-3xl font-semibold mb-3">Check your email</h2>
            <p className="text-gray-400">
              We've sent a magic link to <span className="text-white font-medium">{formData.email}</span>
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Click the link in the email to complete your registration. The link will expire in 1 hour.
            </p>
          </div>
          <button
            onClick={() => {
              setMagicLinkSent(false);
              setFormData({ ...formData, email: '' });
            }}
            className="text-[#3b82f6] hover:text-blue-400 transition-colors font-medium"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#1a1625]">
      {/* Left Panel - Carousel Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#3b82f6] via-purple-500 to-purple-700 overflow-hidden">
        {/* Brand Dot Pattern - Top Corner */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse at top right, black 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top right, black 0%, transparent 70%)'
          }}
        />
        
        {/* Brand Dot Pattern - Bottom Corner */}
        <div 
          className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 2px, transparent 2px)',
            backgroundSize: '20px 20px',
            maskImage: 'radial-gradient(ellipse at bottom left, black 0%, transparent 65%)',
            WebkitMaskImage: 'radial-gradient(ellipse at bottom left, black 0%, transparent 65%)'
          }}
        />
        
        {/* Carousel Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 opacity-30">
              <img 
                src={slide.image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
        
        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <Link to="/" className="text-white text-4xl font-bold tracking-wider hover:opacity-80 transition-opacity">
            XPeak
          </Link>
        </div>

        {/* Back to website button */}
        <Link 
          to="/" 
          className="absolute top-8 right-8 z-10 px-6 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-white text-sm hover:bg-white/20 transition-all flex items-center gap-2"
        >
          Back to website
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Centered Text */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <h2 className="text-white text-5xl font-light mb-4 leading-tight">
                {slide.title}<br />
                {slide.subtitle}
              </h2>
            </div>
          ))}
          
          {/* Carousel indicators */}
          <div className="flex gap-2 mt-32">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 rounded transition-all ${
                  index === currentSlide ? 'w-8 bg-white' : 'w-8 bg-white/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#1a1625] relative overflow-hidden">
        {/* Brand Dot Pattern - Top Right */}
        <div 
          className="absolute -top-20 -right-20 w-72 h-72 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 2px, transparent 2px)',
            backgroundSize: '20px 20px',
            maskImage: 'radial-gradient(circle at center, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 20%, transparent 70%)'
          }}
        />
        
        {/* Brand Dot Pattern - Behind Form */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(147,51,234,0.08) 1.5px, transparent 1.5px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)'
          }}
        />
        
        {/* Brand Dot Pattern - Bottom Left */}
        <div 
          className="absolute -bottom-16 -left-16 w-64 h-64 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(107,114,128,0.12) 2px, transparent 2px)',
            backgroundSize: '18px 18px',
            maskImage: 'radial-gradient(circle at center, black 25%, transparent 65%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 25%, transparent 65%)'
          }}
        />
        
        <div className="w-full max-w-md relative z-10">
          <div className="mb-8">
            <h2 className="text-white text-4xl font-semibold mb-3">Create an account</h2>
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#3b82f6] hover:text-blue-400 transition-colors font-medium">
                Log in
              </Link>
            </p>
          </div>

          {/* Error Display */}
          {displayError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {displayError}
            </div>
          )}

          {/* Auth Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('magic-link')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                authMode === 'magic-link'
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#3a3447] text-gray-400 hover:text-white'
              }`}
            >
              Magic Link
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                authMode === 'password'
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#3a3447] text-gray-400 hover:text-white'
              }`}
            >
              Password
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field (only for password mode) */}
            {authMode === 'password' && (
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#3a3447] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-colors"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#3a3447] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-colors"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Password (only for password mode) */}
            {authMode === 'password' && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#3a3447] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-colors"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Magic Link Info */}
            {authMode === 'magic-link' && (
              <p className="text-gray-500 text-sm">
                We'll send you a secure link to create your account without a password.
              </p>
            )}

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                className="mt-1 w-4 h-4 rounded border-gray-600 bg-[#3a3447] text-[#3b82f6] focus:ring-[#3b82f6] focus:ring-2"
              />
              <label htmlFor="terms" className="text-sm text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="text-[#3b82f6] hover:text-blue-400 underline font-medium">
                  Terms & Conditions
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#3b82f6] to-purple-600 hover:from-[#2563eb] hover:to-purple-700 text-white font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{authMode === 'magic-link' ? 'Sending...' : 'Creating account...'}</span>
                </>
              ) : (
                <span>{authMode === 'magic-link' ? 'Send magic link' : 'Create account'}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1a1625] text-gray-400">or register with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleSignup}
              type="button"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-gray-600 bg-[#3a3447] hover:bg-[#454152] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </button>

            <button
              onClick={handleAppleSignup}
              type="button"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-gray-600 bg-[#3a3447] hover:bg-[#454152] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Test Login Button - Only visible when using Firebase Emulator */}
          {isUsingEmulator && (
            <div className="mt-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-orange-500/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#1a1625] text-orange-400">Emulator Mode</span>
                </div>
              </div>
              <button
                onClick={handleTestLogin}
                type="button"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Quick Test Login</span>
              </button>
              <p className="text-orange-400/60 text-xs text-center mt-2">
                Creates a test account (test@example.com) for local development
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
