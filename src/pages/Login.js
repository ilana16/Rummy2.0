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
  margin-bottom: 30px;
`;

const Subtitle = styled.h2`
  color: #666;
  font-size: 1.2rem;
  margin-bottom: 30px;
`;

const Button = styled.button`
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  transition: background-color 0.3s;

  &:hover {
    background-color: #3367D6;
  }

  img {
    margin-right: 10px;
    width: 20px;
    height: 20px;
  }
`;

const ErrorMessage = styled.p`
  color: #d32f2f;
  margin-top: 20px;
`;

const VerificationMessage = styled.p`
  color: #388e3c;
  margin-top: 20px;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
`;

const Login = () => {
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const { currentUser, signInWithGoogle, verifyEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in and email is verified, redirect to lobby
    if (currentUser && currentUser.emailVerified) {
      navigate('/lobby');
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
      // After successful sign-in, check if email verification is needed
      if (currentUser && !currentUser.emailVerified) {
        await verifyEmail();
        setVerificationSent(true);
      }
    } catch (error) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(error);
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

  return (
    <LoginContainer>
      <LoginCard>
        <Title>Rummy Tile Game</Title>
        <Subtitle>Sign in to play online</Subtitle>
        
        {currentUser && !currentUser.emailVerified ? (
          <>
            <VerificationMessage>
              Please verify your email address to continue.
              {verificationSent && " Verification email sent!"}
            </VerificationMessage>
            <Button onClick={handleResendVerification}>
              Resend Verification Email
            </Button>
          </>
        ) : (
          <Button onClick={handleGoogleSignIn}>
            <img src="/google-icon.png" alt="Google" />
            Sign in with Google
          </Button>
        )}
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
