import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
`;

const LoginCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const Subtitle = styled.h2`
  color: #666;
  font-size: 1.2rem;
  margin-bottom: 30px;
`;

const Button = styled.button`
  background-color: ${props => props.color || '#4285F4'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto;
  width: 100%;
  max-width: 280px;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.hoverColor || '#3367D6'};
  }

  img {
    margin-right: 10px;
    width: 20px;
    height: 20px;
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
  
  &:before, &:after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #ddd;
  }
  
  span {
    margin: 0 10px;
    color: #666;
    font-size: 14px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const ToggleLink = styled.button`
  background: none;
  border: none;
  color: #4285F4;
  cursor: pointer;
  font-size: 14px;
  margin-top: 15px;
  text-decoration: underline;
  
  &:hover {
    color: #3367D6;
  }
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  margin-top: 15px;
  font-size: 14px;
  background-color: #ffebee;
  padding: 12px;
  border-radius: 4px;
  text-align: left;
  word-break: break-word;
`;

const VerificationMessage = styled.p`
  color: #388e3c;
  margin-top: 15px;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  flex: 1;
  padding: 10px;
  background-color: ${props => props.active ? '#4285F4' : '#f5f5f5'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  
  &:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
  
  &:hover {
    background-color: ${props => props.active ? '#3367D6' : '#e0e0e0'};
  }
`;

const DebugInfo = styled.div`
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  text-align: left;
  word-break: break-word;
  max-height: 100px;
  overflow-y: auto;
`;

const Login = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  
  const { 
    currentUser, 
    signInWithGoogle, 
    signInWithEmail,
    signUpWithEmail,
    signInAnonymous,
    verifyEmail,
    authError,
    isRedirectResult
  } = useAuth();
  
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in and email is verified or anonymous, redirect to lobby
    if (currentUser) {
      console.log("Current user in Login component:", currentUser);
      setDebugInfo(prev => ({
        ...prev,
        currentUser: {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
          isAnonymous: currentUser.isAnonymous,
          providerData: currentUser.providerData
        }
      }));
      
      if (currentUser.isAnonymous || currentUser.emailVerified) {
        navigate('/lobby');
      }
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Set error from auth context if available
    if (authError) {
      console.log("Auth error in Login component:", authError);
      setError(authError.message);
      setDebugInfo(prev => ({
        ...prev,
        authError
      }));
    }
  }, [authError]);

  useEffect(() => {
    // Check if we just completed a redirect sign-in
    if (isRedirectResult) {
      console.log("Redirect result detected in Login component");
      setDebugInfo(prev => ({
        ...prev,
        isRedirectResult
      }));
    }
  }, [isRedirectResult]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      console.log("Initiating Google sign in from Login component");
      setDebugInfo(prev => ({
        ...prev,
        action: "Google sign in initiated"
      }));
      
      await signInWithGoogle();
    } catch (error) {
      // Error is handled in AuthContext and set via authError
      console.error("Google sign in error in Login component:", error);
      setDebugInfo(prev => ({
        ...prev,
        googleSignInError: {
          code: error.code,
          message: error.message
        }
      }));
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError('');
      console.log("Initiating email sign in from Login component");
      setDebugInfo(prev => ({
        ...prev,
        action: "Email sign in initiated",
        email: email
      }));
      
      await signInWithEmail(email, password);
    } catch (error) {
      // Error is handled in AuthContext and set via authError
      console.error("Email sign in error in Login component:", error);
      setDebugInfo(prev => ({
        ...prev,
        emailSignInError: {
          code: error.code,
          message: error.message
        }
      }));
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setError('');
      console.log("Initiating email sign up from Login component");
      setDebugInfo(prev => ({
        ...prev,
        action: "Email sign up initiated",
        email: email
      }));
      
      await signUpWithEmail(email, password);
      setVerificationSent(true);
    } catch (error) {
      // Error is handled in AuthContext and set via authError
      console.error("Email sign up error in Login component:", error);
      setDebugInfo(prev => ({
        ...prev,
        emailSignUpError: {
          code: error.code,
          message: error.message
        }
      }));
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setError('');
      console.log("Initiating anonymous sign in from Login component");
      setDebugInfo(prev => ({
        ...prev,
        action: "Anonymous sign in initiated"
      }));
      
      await signInAnonymous();
    } catch (error) {
      // Error is handled in AuthContext and set via authError
      console.error("Anonymous sign in error in Login component:", error);
      setDebugInfo(prev => ({
        ...prev,
        anonymousSignInError: {
          code: error.code,
          message: error.message
        }
      }));
    }
  };

  const handleResendVerification = async () => {
    try {
      console.log("Initiating email verification from Login component");
      setDebugInfo(prev => ({
        ...prev,
        action: "Email verification initiated"
      }));
      
      await verifyEmail();
      setVerificationSent(true);
    } catch (error) {
      setError('Failed to send verification email. Please try again.');
      console.error("Email verification error in Login component:", error);
      setDebugInfo(prev => ({
        ...prev,
        emailVerificationError: {
          code: error.code,
          message: error.message
        }
      }));
    }
  };

  const toggleDebugInfo = () => {
    setShowDebug(!showDebug);
  };

  const renderSignInForm = () => (
    <Form onSubmit={handleEmailSignIn}>
      <Input 
        type="email" 
        placeholder="Email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input 
        type="password" 
        placeholder="Password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" color="#4CAF50" hoverColor="#388E3C">
        Sign In
      </Button>
    </Form>
  );

  const renderSignUpForm = () => (
    <Form onSubmit={handleEmailSignUp}>
      <Input 
        type="email" 
        placeholder="Email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input 
        type="password" 
        placeholder="Password (min 6 characters)" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" color="#FF5722" hoverColor="#E64A19">
        Sign Up
      </Button>
    </Form>
  );

  return (
    <LoginContainer>
      <LoginCard>
        <Title>Rummy Tile Game</Title>
        
        {currentUser && !currentUser.isAnonymous && !currentUser.emailVerified ? (
          <>
            <VerificationMessage>
              Please verify your email address to continue.
              {verificationSent && " Verification email sent!"}
            </VerificationMessage>
            <Button onClick={handleResendVerification} color="#4CAF50" hoverColor="#388E3C">
              Resend Verification Email
            </Button>
          </>
        ) : (
          <>
            <Subtitle>Sign in to play online</Subtitle>
            
            <TabContainer>
              <Tab 
                active={activeTab === 'signin'} 
                onClick={() => setActiveTab('signin')}
              >
                Sign In
              </Tab>
              <Tab 
                active={activeTab === 'signup'} 
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </Tab>
            </TabContainer>
            
            {activeTab === 'signin' ? renderSignInForm() : renderSignUpForm()}
            
            <OrDivider>
              <span>OR</span>
            </OrDivider>
            
            <Button onClick={handleGoogleSignIn}>
              <img src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" alt="Google" />
              Sign in with Google
            </Button>
            
            <OrDivider>
              <span>OR</span>
            </OrDivider>
            
            <Button onClick={handleAnonymousSignIn} color="#9E9E9E" hoverColor="#757575">
              Play as Guest
            </Button>
            
            {error && (
              <ErrorMessage>
                <strong>Error:</strong> {error}
              </ErrorMessage>
            )}
            
            <ToggleLink onClick={toggleDebugInfo}>
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </ToggleLink>
            
            {showDebug && (
              <DebugInfo>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </DebugInfo>
            )}
          </>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
