import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const ProfileCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
  width: 100%;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  margin-right: 20px;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const Username = styled.h2`
  margin: 0 0 5px 0;
`;

const Email = styled.p`
  margin: 0;
  color: #666;
`;

const Button = styled.button`
  background-color: ${props => props.primary ? '#4285F4' : '#f44336'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.primary ? '#3367D6' : '#d32f2f'};
  }
`;

const BackButton = styled(Button)`
  background-color: #757575;
  margin-right: auto;
  
  &:hover {
    background-color: #616161;
  }
`;

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleBackToLobby = () => {
    navigate('/lobby');
  };

  if (!currentUser) {
    return null; // Will redirect via useEffect
  }

  return (
    <ProfileContainer>
      <ProfileCard>
        <BackButton onClick={handleBackToLobby}>Back to Lobby</BackButton>
        <ProfileHeader>
          <Avatar src={currentUser.photoURL || 'https://via.placeholder.com/80'} />
          <UserInfo>
            <Username>{currentUser.displayName || 'User'}</Username>
            <Email>{currentUser.email}</Email>
          </UserInfo>
        </ProfileHeader>
        
        <Button primary onClick={handleBackToLobby}>Back to Game</Button>
        <Button onClick={handleLogout}>Sign Out</Button>
      </ProfileCard>
    </ProfileContainer>
  );
};

export default Profile;
