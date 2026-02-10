import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  deleteUser,
  onAuthStateChanged,
  ActionCodeSettings,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, useEmulators } from '../config/firebase';
import { ensureUserDocument, FirestoreUserDocument, deleteUserData } from '../services/firestoreUserService';

// Types
interface AuthContextType {
  user: User | null;
  userDocument: FirestoreUserDocument | null;
  loading: boolean;
  error: string | null;
  isUsingEmulator: boolean;
  signInWithGoogle: (nickname?: string) => Promise<void>;
  signInAsTestUser: () => Promise<void>;
  sendMagicLink: (email: string, nickname?: string) => Promise<void>;
  completeMagicLinkSignIn: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, nickname?: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Magic Link configuration
const getActionCodeSettings = (): ActionCodeSettings => {
  // Use current origin for the redirect URL, or fallback to env var or default
  const url = typeof window !== 'undefined' 
    ? `${window.location.origin}/login` 
    : (import.meta.env.VITE_APP_URL || 'http://localhost:5173') + '/login';
  
  return {
    url,
    handleCodeInApp: true,
  };
};

// Local storage keys
const EMAIL_FOR_SIGN_IN_KEY = 'emailForSignIn';
const NICKNAME_FOR_SIGN_UP_KEY = 'nicknameForSignUp';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDocument, setUserDocument] = useState<FirestoreUserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [pendingNickname, setPendingNickname] = useState<string | null>(null);

  // Handle redirect result FIRST (for emulator Google sign-in)
  // This must complete before we allow the auth state to settle
  useEffect(() => {
    if (!auth) {
      setRedirectChecked(true);
      return;
    }

    const handleRedirectResult = async () => {
      try {
        // This will resolve with the result of the redirect sign-in
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // User successfully signed in via redirect
          console.log('✅ Redirect sign-in successful:', result.user.email);
          
          // Set user immediately from redirect result
          setUser(result.user);
          
          // Ensure user document exists
          try {
            // Check for pending nickname in localStorage (for Google signup)
            const nickname = window.localStorage.getItem(NICKNAME_FOR_SIGN_UP_KEY) || undefined;
            const userDoc = await ensureUserDocument(result.user, nickname);
            setUserDocument(userDoc);
            
            // Clear pending nickname after use
            if (nickname) {
              window.localStorage.removeItem(NICKNAME_FOR_SIGN_UP_KEY);
            }
          } catch (err) {
            console.error('Failed to ensure user document after redirect:', err);
          }
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        setError(err.message || 'Failed to complete sign-in');
      } finally {
        setRedirectChecked(true);
      }
    };

    handleRedirectResult();
  }, []);

  // Listen for auth state changes and ensure Firestore user document exists
  // Only set loading to false after redirect has been checked
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Update user state
      setUser(firebaseUser);
      
      if (firebaseUser) {
        console.log('🔐 User authenticated:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified
        });
        
        try {
          // Get and log the ID token to verify auth is working
          const token = await firebaseUser.getIdToken();
          console.log('🎫 Auth token obtained (first 20 chars):', token?.substring(0, 20));
          
          // Check for pending nickname in state or localStorage
          const nickname = pendingNickname || window.localStorage.getItem(NICKNAME_FOR_SIGN_UP_KEY) || undefined;
          
          // Ensure user document exists in Firestore (creates if new, updates lastLoginAt if existing)
          const userDoc = await ensureUserDocument(firebaseUser, nickname);
          setUserDocument(userDoc);
          console.log('✅ User document ensured successfully');
          
          // Clear pending nickname after use
          if (nickname) {
            setPendingNickname(null);
            window.localStorage.removeItem(NICKNAME_FOR_SIGN_UP_KEY);
          }
        } catch (err) {
          console.error('Failed to ensure user document:', err);
          // Don't block auth if Firestore fails - user can still use the app
        }
      } else {
        // User signed out
        setUserDocument(null);
      }
      
      // Only set loading to false if redirect has been checked
      // This prevents a race condition where auth fires with null before redirect completes
      if (redirectChecked) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [redirectChecked]);

  // Set loading to false once redirect is checked (even if no user from redirect)
  useEffect(() => {
    if (redirectChecked && loading) {
      // Give a small delay for onAuthStateChanged to fire with the redirect user
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [redirectChecked, loading]);

  // Check for magic link sign-in on mount
  useEffect(() => {
    if (!auth) return;

    const checkMagicLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        // Get email from localStorage
        let email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
        
        if (!email) {
          // If email is not in localStorage, prompt the user
          email = window.prompt('Please provide your email for confirmation');
        }
        
        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            // Clean up localStorage
            window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
            // Clean up URL
            window.history.replaceState(null, '', window.location.pathname);
          } catch (err: any) {
            setError(err.message || 'Failed to complete sign-in');
          }
        }
      }
    };

    checkMagicLink();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async (nickname?: string) => {
    if (!auth) {
      setError('Firebase is not configured');
      return;
    }

    try {
      setError(null);
      
      // Store nickname for use after auth completes
      if (nickname) {
        setPendingNickname(nickname);
        window.localStorage.setItem(NICKNAME_FOR_SIGN_UP_KEY, nickname);
      }
      
      // In emulator mode, create a mock Google user directly
      // The emulator doesn't support real OAuth flows (popup/redirect both fail)
      if (useEmulators) {
        console.log('🔧 Creating mock Google user (emulator mode)');
        const mockEmail = 'google.user@example.com';
        const mockPassword = import.meta.env.VITE_MOCK_GOOGLE_PASSWORD || 'google-mock-password-123';
        
        try {
          // Try to sign in first (in case user already exists)
          await signInWithEmailAndPassword(auth, mockEmail, mockPassword);
          console.log('✅ Mock Google sign-in successful:', mockEmail);
        } catch (signInErr: any) {
          // If sign in fails, create the account
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            await createUserWithEmailAndPassword(auth, mockEmail, mockPassword);
            console.log('✅ Mock Google account created:', mockEmail);
          } else {
            throw signInErr;
          }
        }
        return;
      }
      
      // Production: use popup for better UX
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        console.log('✅ Google sign-in successful:', result.user.email);
        // The onAuthStateChanged listener will handle the user document
      }
    } catch (err: any) {
      // Handle popup blocked error (production fallback)
      if (err.code === 'auth/popup-blocked') {
        console.log('Popup blocked, trying redirect...');
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } else {
        setError(err.message || 'Failed to sign in with Google');
        throw err;
      }
    }
  };

  // Send magic link email
  const sendMagicLink = async (email: string, nickname?: string) => {
    if (!auth) {
      setError('Firebase is not configured');
      return;
    }

    try {
      setError(null);
      const actionCodeSettings = getActionCodeSettings();
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save email and nickname to localStorage for when user clicks the link
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
      if (nickname) {
        window.localStorage.setItem(NICKNAME_FOR_SIGN_UP_KEY, nickname);
      }
    } catch (err: any) {
      const code = err?.code || '';
      const message =
        code === 'auth/unauthorized-domain'
          ? `This domain is not authorized for sign-in. Add ${typeof window !== 'undefined' ? window.location.hostname : 'your site'} to Firebase Console → Authentication → Authorized domains.`
          : err.message || 'Failed to send magic link';
      setError(message);
      throw err;
    }
  };

  // Complete magic link sign-in (called manually if needed)
  const completeMagicLinkSignIn = async (email: string) => {
    if (!auth) {
      setError('Firebase is not configured');
      return;
    }

    try {
      setError(null);
      if (isSignInWithEmailLink(auth, window.location.href)) {
        await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete sign-in');
      throw err;
    }
  };

  // Sign in with email and password
  const signInWithPassword = async (email: string, password: string) => {
    if (!auth) {
      setError('Firebase is not configured');
      return;
    }

    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    }
  };

  // Sign up with email and password
  const signUpWithPassword = async (email: string, password: string, nickname?: string) => {
    if (!auth) {
      setError('Firebase is not configured');
      return;
    }

    try {
      setError(null);
      
      // Store nickname for use after auth completes
      if (nickname) {
        setPendingNickname(nickname);
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email (skip in emulator mode as emails won't work)
      if (!useEmulators && result.user) {
        try {
          await sendEmailVerification(result.user);
          console.log('✅ Verification email sent to:', email);
        } catch (verifyErr: any) {
          console.warn('Failed to send verification email:', verifyErr);
          // Don't throw - account is still created, just verification email failed
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      throw err;
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (!auth || !user) {
      setError('No user is currently signed in');
      throw new Error('No user is currently signed in');
    }

    if (user.emailVerified) {
      setError('Email is already verified');
      throw new Error('Email is already verified');
    }

    try {
      setError(null);
      await sendEmailVerification(user);
      console.log('✅ Verification email resent to:', user.email);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    if (!auth) {
      setError('Firebase is not configured');
      return;
    }

    try {
      setError(null);
      await firebaseSignOut(auth);
      // Reset anonymous session so next anonymous user gets fresh data
      // Import is at the top of this file
      const { storage } = await import('../services/localStorage');
      storage.resetAnonymousSession();
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  // Delete account permanently
  const deleteAccount = async () => {
    if (!auth || !user) {
      setError('No user is currently signed in');
      return;
    }

    try {
      setError(null);
      const uid = user.uid;
      
      // First, delete all user data from Firestore
      await deleteUserData(uid);
      console.log('✅ Deleted user data from Firestore');
      
      // Then, delete the Firebase Auth user account
      await deleteUser(user);
      console.log('✅ Deleted Firebase Auth account');
      
      // Reset anonymous session
      const { storage } = await import('../services/localStorage');
      storage.resetAnonymousSession();
    } catch (err: any) {
      // If deleting auth user fails due to recent sign-in requirement
      if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign back in before deleting your account');
      } else {
        setError(err.message || 'Failed to delete account');
      }
      throw err;
    }
  };

  // Sign in as test user (for emulator only)
  const signInAsTestUser = async () => {
    if (!auth) {
      setError('Firebase is not configured');
      return;
    }

    if (!useEmulators) {
      setError('Test login is only available in emulator mode');
      return;
    }

    try {
      setError(null);
      const testEmail = 'test@example.com';
      const testPassword = import.meta.env.VITE_TEST_PASSWORD || 'testpassword123';
      
      try {
        // Try to sign in first (in case user already exists)
        await signInWithEmailAndPassword(auth, testEmail, testPassword);
      } catch (signInErr) {
        // If sign in fails, create the account
        if (typeof signInErr === 'object' && signInErr !== null && 'code' in signInErr) {
          const errorCode = (signInErr as { code: string }).code;
          if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
            await createUserWithEmailAndPassword(auth, testEmail, testPassword);
          } else {
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as test user');
      throw err;
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth || !user || !user.email) {
      setError('No user is currently signed in');
      throw new Error('No user is currently signed in');
    }

    try {
      setError(null);
      
      // Reauthenticate first (Firebase requires recent sign-in for sensitive operations)
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Then update password
      await updatePassword(user, newPassword);
      console.log('✅ Password updated successfully');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        setError('New password is too weak. Please use at least 6 characters');
      } else {
        setError(err.message || 'Failed to change password');
      }
      throw err;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    userDocument,
    loading,
    error,
    isUsingEmulator: useEmulators,
    signInWithGoogle,
    signInAsTestUser,
    sendMagicLink,
    completeMagicLinkSignIn,
    signInWithPassword,
    signUpWithPassword,
    resendVerificationEmail,
    signOut,
    deleteAccount,
    changePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
