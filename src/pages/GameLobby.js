import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getDatabase, ref, push, set, onValue, remove } from 'firebase/database';

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  background-color: #4285F4;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 1.8rem;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  margin-right: 10px;
  cursor: pointer;
`;

const Username = styled.span`
  margin-right: 15px;
`;

const Button = styled.button`
  background-color: ${props => props.primary ? '#4285F4' : props.secondary ? '#4CAF50' : '#f44336'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: ${props => props.small ? '8px 12px' : '10px 20px'};
  font-size: ${props => props.small ? '14px' : '16px'};
  cursor: pointer;
  margin: ${props => props.margin || '0'};
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.primary ? '#3367D6' : props.secondary ? '#388E3C' : '#d32f2f'};
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const Content = styled.main`
  flex: 1;
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
`;

const Tab = styled.button`
  background-color: ${props => props.active ? '#4285F4' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.active ? '#3367D6' : '#e0e0e0'};
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
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
  background-color: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
`;

const GameInfo = styled.div`
  margin-bottom: 15px;
`;

const PlayerCount = styled.div`
  margin-bottom: 10px;
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

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 10px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const RadioInput = styled.input`
  margin-right: 8px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
`;

const GameLobby = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('public');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [codeType, setCodeType] = useState('generate');
  const [games, setGames] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const database = getDatabase();

  useEffect(() => {
    // Redirect to login if not authenticated or email not verified
    if (!currentUser) {
      navigate('/');
    } else if (!currentUser.emailVerified) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Listen for games in the database
    const gamesRef = ref(database, 'games');
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      const gamesData = snapshot.val();
      if (gamesData) {
        const gamesArray = Object.entries(gamesData).map(([id, game]) => ({
          id,
          ...game
        }));
        setGames(gamesArray);
      } else {
        setGames([]);
      }
    });

    return () => unsubscribe();
  }, [database]);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleCreateGame = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setGameCode('');
    setCodeType('generate');
  };

  const generateRandomCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const isCodeUnique = (code) => {
    return !games.some(game => game.gameCode === code);
  };

  const handleSubmitGame = () => {
    let finalGameCode;
    
    if (codeType === 'generate') {
      // Generate a unique code
      let newCode;
      do {
        newCode = generateRandomCode();
      } while (!isCodeUnique(newCode));
      finalGameCode = newCode;
    } else {
      // Use custom code if it's valid and unique
      if (gameCode.length < 4) {
        alert('Game code must be at least 4 characters');
        return;
      }
      
      if (!isCodeUnique(gameCode)) {
        alert('This game code is already in use. Please choose another.');
        return;
      }
      
      finalGameCode = gameCode.toUpperCase();
    }
    
    // Create the game in Firebase
    const gamesRef = ref(database, 'games');
    const newGameRef = push(gamesRef);
    
    set(newGameRef, {
      gameCode: finalGameCode,
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
    }).then(() => {
      handleCloseModal();
      navigate(`/game/${newGameRef.key}`);
    }).catch(error => {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    });
  };

  const handleJoinGame = (gameId) => {
    // Add the current user to the game's players
    const gamePlayerRef = ref(database, `games/${gameId}/players/${currentUser.uid}`);
    
    set(gamePlayerRef, {
      id: currentUser.uid,
      name: currentUser.displayName || 'Anonymous',
      photoURL: currentUser.photoURL || '',
      isHost: false,
      isReady: false
    }).then(() => {
      navigate(`/game/${gameId}`);
    }).catch(error => {
      console.error('Error joining game:', error);
      alert('Failed to join game. Please try again.');
    });
  };

  const handleJoinByCode = () => {
    if (!joinCode) {
      alert('Please enter a game code');
      return;
    }
    
    const game = games.find(g => g.gameCode === joinCode.toUpperCase());
    
    if (game) {
      handleJoinGame(game.id);
    } else {
      alert('Game not found. Please check the code and try again.');
    }
  };

  if (!currentUser) {
    return null; // Will redirect via useEffect
  }

  return (
    <LobbyContainer>
      <Header>
        <Logo>Rummy Tile Game</Logo>
        <UserSection>
          <Username>{currentUser.displayName || 'User'}</Username>
          <Avatar 
            src={currentUser.photoURL || 'https://via.placeholder.com/40'} 
            onClick={handleProfileClick}
          />
        </UserSection>
      </Header>
      
      <Content>
        <TabContainer>
          <Tab 
            active={activeTab === 'public'} 
            onClick={() => setActiveTab('public')}
          >
            Public Games
          </Tab>
          <Tab 
            active={activeTab === 'join'} 
            onClick={() => setActiveTab('join')}
          >
            Join by Code
          </Tab>
        </TabContainer>
        
        <Button secondary onClick={handleCreateGame} margin="0 0 20px 0">
          Create New Game
        </Button>
        
        {activeTab === 'public' ? (
          <GamesList>
            {games
              .filter(game => game.status === 'waiting')
              .map(game => (
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
                    disabled={Object.keys(game.players || {}).length >= 4 || 
                             Object.keys(game.players || {}).includes(currentUser.uid)}
                  >
                    {Object.keys(game.players || {}).includes(currentUser.uid) 
                      ? 'Rejoin Game' 
                      : 'Join Game'}
                  </Button>
                </GameCard>
              ))}
            {games.filter(game => game.status === 'waiting').length === 0 && (
              <p>No active games found. Create a new game to start playing!</p>
            )}
          </GamesList>
        ) : (
          <div>
            <FormGroup>
              <Label>Enter Game Code:</Label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Input 
                  type="text" 
                  value={joinCode} 
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter 6-character code"
                />
                <Button primary onClick={handleJoinByCode}>
                  Join
                </Button>
              </div>
            </FormGroup>
          </div>
        )}
      </Content>
      
      {showCreateModal && (
        <CreateGameModal>
          <ModalContent>
            <ModalTitle>Create New Game</ModalTitle>
            
            <FormGroup>
              <Label>Game Code:</Label>
              <RadioGroup>
                <RadioLabel>
                  <RadioInput 
                    type="radio" 
                    name="codeType" 
                    value="generate" 
                    checked={codeType === 'generate'} 
                    onChange={() => setCodeType('generate')}
                  />
                  Generate Random Code
                </RadioLabel>
                <RadioLabel>
                  <RadioInput 
                    type="radio" 
                    name="codeType" 
                    value="custom" 
                    checked={codeType === 'custom'} 
                    onChange={() => setCodeType('custom')}
                  />
                  Custom Code
                </RadioLabel>
              </RadioGroup>
            </FormGroup>
            
            {codeType === 'custom' && (
              <FormGroup>
                <Label>Enter Custom Code (min 4 characters):</Label>
                <Input 
                  type="text" 
                  value={gameCode} 
                  onChange={(e) => setGameCode(e.target.value)}
                  placeholder="Enter custom code"
                  minLength={4}
                />
              </FormGroup>
            )}
            
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
