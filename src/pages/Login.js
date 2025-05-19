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

const ErrorMessage = styled.p`
  color: #d32f2f;
  margin-top: 15px;
  font-size: 14px;
  background-color: #ffebee;
  padding: 8px;
  border-radius: 4px;
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

const Login = () => {
  const [activeTab, setActiveTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  const { 
    currentUser, 
    signInWithGoogle, 
    signInWithEmail,
    signUpWithEmail,
    signInAnonymous,
    verifyEmail,
    authError 
  } = useAuth();
  
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in and email is verified or anonymous, redirect to lobby
    if (currentUser) {
      if (currentUser.isAnonymous || currentUser.emailVerified) {
        navigate('/lobby');
      }
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Set error from auth context if available
    if (authError) {
      setError(authError.message);
    }
  }, [authError]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (error) {
      // Error is handled in AuthContext and set via authError
      console.error("Google sign in error:", error);
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
      await signInWithEmail(email, password);
    } catch (error) {
      // Error is handled in AuthContext and set via authError
      console.error("Email sign in error:", error);
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
      await signUpWithEmail(email, password);
      setVerificationSent(true);
    } catch (error) {
      // Error is handled in AuthContext and set via authError
      console.error("Email sign up error:", error);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setError('');
      await signInAnonymous();
    } catch (error) {
      // Error is handled in AuthContext and set via authError
      console.error("Anonymous sign in error:", error);
    }
  };

  const handleResendVerification = async () => {
    try {
      await verifyEmail();
      setVerificationSent(true);
    } catch (error) {
      setError('Failed to send verification email. Please try again.');
      console.error(error);
    }
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
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
