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
  onAuthStateChanged,
  ActionCodeSettings,
} from 'firebase/auth';
import { auth, useEmulators } from '../config/firebase';
import { ensureUserDocument, FirestoreUserDocument } from '../services/firestoreUserService';

// Types
interface AuthContextType {
  user: User | null;
  userDocument: FirestoreUserDocument | null;
  loading: boolean;
  error: string | null;
  isUsingEmulator: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsTestUser: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Magic Link configuration
const getActionCodeSettings = (): ActionCodeSettings => {
  // Use current origin for the redirect URL
  const url = typeof window !== 'undefined' 
    ? `${window.location.origin}/login` 
    : 'http://localhost:5173/login';
  
  return {
    url,
    handleCodeInApp: true,
  };
};

// Local storage key for email (needed for magic link completion)
const EMAIL_FOR_SIGN_IN_KEY = 'emailForSignIn';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDocument, setUserDocument] = useState<FirestoreUserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes and ensure Firestore user document exists
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Ensure user document exists in Firestore (creates if new, updates lastLoginAt if existing)
          const userDoc = await ensureUserDocument(firebaseUser);
          setUserDocument(userDoc);
        } catch (err) {
          console.error('Failed to ensure user document:', err);
          // Don't block auth if Firestore fails - user can still use the app
        }
      } else {
        // User signed out
        setUserDocument(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  // Handle redirect result (for emulator Google sign-in)
  useEffect(() => {
    if (!auth) return;

    const handleRedirectResult = async () => {
      try {
        // This will resolve with the result of the redirect sign-in
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // User successfully signed in via redirect
          console.log('✅ Redirect sign-in successful:', result.user.email);
          
          // Ensure user document exists
          try {
            const userDoc = await ensureUserDocument(result.user);
            setUserDocument(userDoc);
          } catch (err) {
            console.error('Failed to ensure user document after redirect:', err);
          }
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        setError(err.message || 'Failed to complete sign-in');
      }
    };

    handleRedirectResult();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!auth) {
      setError('Firebase is not configured');
      return;
    }

    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      
      // Use popup for both emulator and production (better UX and works more reliably)
      // The emulator will open its own auth page in the popup
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        console.log('✅ Google sign-in successful:', result.user.email);
        // The onAuthStateChanged listener will handle the user document
      }
    } catch (err: any) {
      // Handle popup blocked error
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
  const sendMagicLink = async (email: string) => {
    if (!auth) {
      setError('Firebase is not configured');
      return;
    }

    try {
      setError(null);
      const actionCodeSettings = getActionCodeSettings();
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save email to localStorage for when user clicks the link
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
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
  const signUpWithPassword = async (email: string, password: string) => {
    if (!auth) {
      setError('Firebase is not configured');
      return;
    }

    try {
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
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
      const testPassword = 'testpassword123';
      
      try {
        // Try to sign in first (in case user already exists)
        await signInWithEmailAndPassword(auth, testEmail, testPassword);
      } catch {
        // If sign in fails, create the account
        await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as test user');
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
    signOut,
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
