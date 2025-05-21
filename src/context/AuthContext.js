import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  const [isRedirectResult, setIsRedirectResult] = useState(false);

  // Check for redirect result on initial load
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setIsRedirectResult(true);
          console.log("Redirect authentication successful:", result.user);
        }
      } catch (error) {
        console.error("Redirect authentication error:", error);
        setAuthError({
          code: error.code,
          message: getReadableErrorMessage(error.code)
        });
      }
    };
    
    checkRedirectResult();
  }, []);

  // Sign in with Google using popup (more reliable across domains)
  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      
      // Add scopes for email and profile
      provider.addScope('email');
      provider.addScope('profile');
      
      // Set custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Try popup first (works better across domains)
      try {
        console.log("Attempting Google sign in with popup");
        const result = await signInWithPopup(auth, provider);
        console.log("Google popup sign in successful:", result.user);
        return result.user;
      } catch (popupError) {
        console.error("Google popup sign in failed, trying redirect:", popupError);
        
        // If popup fails (e.g., mobile browsers), fall back to redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, provider);
          // The result will be handled by getRedirectResult in the useEffect
          return null;
        } else {
          throw popupError;
        }
      }
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
      console.log("Attempting email sign in for:", email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Email sign in successful:", result.user);
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
      console.log("Attempting email sign up for:", email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Email sign up successful:", result.user);
      
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
      console.log("Attempting anonymous sign in");
      const result = await signInAnonymously(auth);
      console.log("Anonymous sign in successful:", result.user);
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
      console.log("Sign out successful");
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
        console.log("Verification email sent to:", currentUser.email);
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
    console.log("Translating error code:", errorCode);
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
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for OAuth operations. Please contact support.';
      case 'auth/app-deleted':
        return 'The authentication server configuration is invalid. Please contact support.';
      case 'auth/app-not-authorized':
        return 'This app is not authorized to use Firebase Authentication. Please contact support.';
      case 'auth/argument-error':
        return 'Invalid argument provided to authentication method.';
      case 'auth/invalid-api-key':
        return 'Invalid API key provided to Firebase SDK.';
      case 'auth/invalid-user-token':
        return 'User credentials are no longer valid. Please sign in again.';
      case 'auth/invalid-tenant-id':
        return 'Invalid tenant ID provided.';
      case 'auth/requires-recent-login':
        return 'This operation requires recent authentication. Please sign in again.';
      case 'auth/web-storage-unsupported':
        return 'Web storage is not supported or is disabled on this browser.';
      default:
        return `Authentication error (${errorCode}). Please try again or contact support.`;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? `User: ${user.uid}` : "No user");
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
    authError,
    isRedirectResult
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
