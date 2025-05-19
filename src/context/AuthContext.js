import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      // Add scopes for email and profile
      provider.addScope('email');
      provider.addScope('profile');
      
      // Set custom parameters for prompt and select_account
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setAuthError({
        code: error.code,
        message: getReadableErrorMessage(error.code)
      });
      throw error;
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email, password) => {
    try {
      setAuthError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error("Error signing in with email:", error);
      setAuthError({
        code: error.code,
        message: getReadableErrorMessage(error.code)
      });
      throw error;
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email, password) => {
    try {
      setAuthError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Send verification email
      await sendEmailVerification(result.user);
      return result.user;
    } catch (error) {
      console.error("Error signing up with email:", error);
      setAuthError({
        code: error.code,
        message: getReadableErrorMessage(error.code)
      });
      throw error;
    }
  };

  // Sign in anonymously
  const signInAnonymous = async () => {
    try {
      setAuthError(null);
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (error) {
      console.error("Error signing in anonymously:", error);
      setAuthError({
        code: error.code,
        message: getReadableErrorMessage(error.code)
      });
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setAuthError(null);
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      setAuthError({
        code: error.code,
        message: getReadableErrorMessage(error.code)
      });
      throw error;
    }
  };

  // Send email verification
  const verifyEmail = async () => {
    if (currentUser && !currentUser.emailVerified) {
      try {
        setAuthError(null);
        await sendEmailVerification(currentUser);
        return true;
      } catch (error) {
        console.error("Error sending verification email:", error);
        setAuthError({
          code: error.code,
          message: getReadableErrorMessage(error.code)
        });
        throw error;
      }
    }
    return false;
  };

  // Get readable error message
  const getReadableErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in or use a different email.';
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing the sign in.';
      case 'auth/cancelled-popup-request':
        return 'The sign-in popup was cancelled.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled. Please contact support.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email but different sign-in credentials.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/timeout':
        return 'The operation has timed out. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAnonymous,
    logout,
    verifyEmail,
    loading,
    authError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
