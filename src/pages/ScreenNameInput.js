import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getDatabase, ref, set, update, onValue } from 'firebase/database';

const ScreenNameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
`;

const Card = styled.div`
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

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 30px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Input = styled.input`
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const Button = styled.button`
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #3367D6;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #d32f2f;
  margin-top: 15px;
  font-size: 14px;
`;

const ScreenNameInput = () => {
  const [screenName, setScreenName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const database = getDatabase();

  useEffect(() => {
    // If no user is logged in, redirect to login
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    // Check if user already has a screen name in the database
    const userProfileRef = ref(database, `users/${currentUser.uid}/profile`);
    const unsubscribe = onValue(userProfileRef, (snapshot) => {
      const profileData = snapshot.val();
      if (profileData && profileData.displayName) {
        // If user already has a screen name in the database, update auth profile if needed
        if (!currentUser.displayName) {
          currentUser.updateProfile({
            displayName: profileData.displayName
          }).then(() => {
            navigate('/lobby');
          });
        } else {
          navigate('/lobby');
        }
      } else if (currentUser.displayName) {
        // If user has a display name in auth but not in database, save it to database
        set(userProfileRef, {
          displayName: currentUser.displayName,
          createdAt: Date.now(),
          lastLogin: Date.now()
        }).then(() => {
          navigate('/lobby');
        });
      } else {
        // Suggest a screen name based on email or anonymous ID
        let suggestedName = '';
        if (currentUser.email) {
          suggestedName = currentUser.email.split('@')[0];
        } else if (currentUser.isAnonymous) {
          suggestedName = `Guest${Math.floor(Math.random() * 10000)}`;
        }
        setScreenName(suggestedName);
      }
    });
    
    return () => unsubscribe();
  }, [currentUser, database, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!screenName.trim()) {
      setError('Please enter a screen name');
      return;
    }
    
    if (screenName.length < 3) {
      setError('Screen name must be at least 3 characters');
      return;
    }
    
    if (screenName.length > 15) {
      setError('Screen name must be at most 15 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Update user profile in Firebase Auth
      await currentUser.updateProfile({
        displayName: screenName
      });
      
      console.log("Updated auth profile with display name:", screenName);
      
      // Also store in database for persistence
      await set(ref(database, `users/${currentUser.uid}/profile`), {
        displayName: screenName,
        email: currentUser.email || null,
        isAnonymous: currentUser.isAnonymous || false,
        createdAt: Date.now(),
        lastLogin: Date.now()
      });
      
      console.log("Updated database profile with display name:", screenName);
      
      // Update last login time
      await update(ref(database, `users/${currentUser.uid}`), {
        lastLoginAt: Date.now()
      });
      
      // Redirect to lobby
      navigate('/lobby');
    } catch (error) {
      console.error('Error setting screen name:', error);
      setError('Failed to set screen name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenNameContainer>
      <Card>
        <Title>Welcome to Rummy!</Title>
        <Subtitle>Please choose a screen name that will be displayed to other players</Subtitle>
        
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Enter your screen name"
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            maxLength={15}
            required
          />
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Continue to Game'}
          </Button>
        </Form>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Card>
    </ScreenNameContainer>
  );
};

export default ScreenNameInput;
