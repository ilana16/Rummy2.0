import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getDatabase, ref, push, set, onValue, query, orderByChild, equalTo, remove } from 'firebase/database';

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #4285F4;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
`;

const Username = styled.span`
  margin-right: 10px;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
`;

const Content = styled.main`
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const Button = styled.button`
  background-color: ${props => props.primary ? '#4285F4' : props.secondary ? '#4CAF50' : '#f5f5f5'};
  color: ${props => props.primary || props.secondary ? 'white' : '#333'};
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: ${props => props.primary ? '#3367D6' : props.secondary ? '#388E3C' : '#e0e0e0'};
  }
  
  &:disabled {
    background-color: #cccccc;
    color: #666666;
    cursor: not-allowed;
  }
`;

const GamesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const GameCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const GameTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const GameCode = styled.span`
  background-color: #f5f5f5;
  padding: 5px 10px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
`;

const GameInfo = styled.div`
  margin-bottom: 15px;
`;

const PlayerCount = styled.div`
  color: #666;
`;

const CreateGameModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
`;

const NoGamesMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1rem;
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  color: #4285F4;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const GameLobby = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const database = getDatabase();

  useEffect(() => {
    // If no user is logged in, redirect to login
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    // Load active games
    const gamesRef = query(
      ref(database, 'games'),
      orderByChild('status'),
      equalTo('waiting')
    );
    
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      const gamesData = snapshot.val();
      const gamesArray = [];
      
      if (gamesData) {
        Object.entries(gamesData).forEach(([id, game]) => {
          gamesArray.push({
            id,
            ...game
          });
        });
      }
      
      setGames(gamesArray);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser, database, navigate]);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleCreateGame = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const handleSubmitGame = async () => {
    try {
      // Generate a 5-digit game code
      const gameCode = generateGameCode();
      
      // Create the game in Firebase
      const gamesRef = ref(database, 'games');
      const newGameRef = push(gamesRef);
      
      await set(newGameRef, {
        gameCode: gameCode,
        hostId: currentUser.uid,
        hostName: currentUser.displayName || 'Anonymous',
        players: {
          [currentUser.uid]: {
            id: currentUser.uid,
            name: currentUser.displayName || 'Anonymous',
            photoURL: currentUser.photoURL || '',
            isHost: true,
            isReady: false
          }
        },
        status: 'waiting',
        createdAt: Date.now()
      });
      
      // Close modal and navigate to game room
      handleCloseModal();
      navigate(`/game/${newGameRef.key}`);
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    }
  };

  const handleJoinGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const handleRefreshGames = () => {
    setLoading(true);
    const gamesRef = query(
      ref(database, 'games'),
      orderByChild('status'),
      equalTo('waiting')
    );
    
    onValue(gamesRef, (snapshot) => {
      const gamesData = snapshot.val();
      const gamesArray = [];
      
      if (gamesData) {
        Object.entries(gamesData).forEach(([id, game]) => {
          gamesArray.push({
            id,
            ...game
          });
        });
      }
      
      setGames(gamesArray);
      setLoading(false);
    }, { onlyOnce: true });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Generate a random 5-digit game code
  const generateGameCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  return (
    <LobbyContainer>
      <Header>
        <Logo>Rummy Tile Game</Logo>
        <UserSection>
          <Username>{currentUser?.displayName || 'Anonymous'}</Username>
          <Avatar 
            src={currentUser?.photoURL || 'https://via.placeholder.com/40'} 
            onClick={handleProfileClick}
            alt="Profile"
          />
        </UserSection>
      </Header>
      
      <Content>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Game Lobby</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <RefreshButton onClick={handleRefreshGames}>
              ↻ Refresh Games
            </RefreshButton>
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Button primary onClick={handleCreateGame}>
            Create New Game
          </Button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading games...</div>
        ) : games.length > 0 ? (
          <GamesList>
            {games.map(game => (
              <GameCard key={game.id}>
                <GameHeader>
                  <GameTitle>Host: {game.hostName}</GameTitle>
                  <GameCode>{game.gameCode}</GameCode>
                </GameHeader>
                <GameInfo>
                  <PlayerCount>
                    Players: {Object.keys(game.players || {}).length}/4
                  </PlayerCount>
                </GameInfo>
                <Button 
                  primary 
                  onClick={() => handleJoinGame(game.id)}
                  disabled={Object.keys(game.players || {}).length >= 4}
                >
                  {Object.keys(game.players || {}).includes(currentUser.uid) 
                    ? 'Rejoin Game' 
                    : 'Join Game'}
                </Button>
              </GameCard>
            ))}
          </GamesList>
        ) : (
          <NoGamesMessage>
            No active games found. Create a new game to start playing!
          </NoGamesMessage>
        )}
      </Content>
      
      {showCreateModal && (
        <CreateGameModal>
          <ModalContent>
            <ModalTitle>Create New Game</ModalTitle>
            <p>A random 5-digit game code will be generated for your game.</p>
            <p>Other players can join using this code or from the public games list.</p>
            
            <ModalActions>
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button primary onClick={handleSubmitGame}>Create Game</Button>
            </ModalActions>
          </ModalContent>
        </CreateGameModal>
      )}
    </LobbyContainer>
  );
};

export default GameLobby;
