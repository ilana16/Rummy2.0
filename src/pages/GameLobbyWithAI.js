import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getDatabase, ref, push, set, onValue, update } from 'firebase/database';
import RummyAIBot from '../services/RummyAIBot';

// Styled components from previous implementation...

const SinglePlayerSetupModal = styled.div`
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

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const NumberInput = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NumberButton = styled.button`
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 40px;
  height: 40px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: #e0e0e0;
  }
  
  &:disabled {
    background-color: #f5f5f5;
    color: #bdbdbd;
    cursor: not-allowed;
  }
`;

const NumberDisplay = styled.div`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 40px;
  text-align: center;
  font-size: 16px;
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
  const [showSinglePlayerModal, setShowSinglePlayerModal] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [codeType, setCodeType] = useState('generate');
  const [games, setGames] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [botDifficulty, setBotDifficulty] = useState('medium');
  const [botCount, setBotCount] = useState(2);
  const database = getDatabase();

  // Rest of the component implementation...

  // Add new function for single player game setup
  const handleSinglePlayerSetup = () => {
    setShowSinglePlayerModal(true);
  };

  const handleCloseSinglePlayerModal = () => {
    setShowSinglePlayerModal(false);
  };

  const handleStartSinglePlayerGame = () => {
    // Generate a unique code for the game
    let gameCode;
    do {
      gameCode = generateRandomCode();
    } while (!isCodeUnique(gameCode));
    
    // Create the game in Firebase
    const gamesRef = ref(database, 'games');
    const newGameRef = push(gamesRef);
    
    // Create initial game state with human player
    set(newGameRef, {
      gameCode: gameCode,
      hostId: currentUser.uid,
      hostName: currentUser.displayName || 'You',
      players: {
        [currentUser.uid]: {
          id: currentUser.uid,
          name: currentUser.displayName || 'You',
          photoURL: currentUser.photoURL || '',
          isHost: true,
          isReady: true,
          isBot: false
        }
      },
      status: 'waiting',
      isSinglePlayer: true,
      createdAt: Date.now()
    }).then(() => {
      // Add AI bots to the game
      const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma'];
      const botPromises = [];
      
      for (let i = 0; i < botCount; i++) {
        const botId = `bot-${newGameRef.key}-${i}`;
        const botRef = ref(database, `games/${newGameRef.key}/players/${botId}`);
        
        botPromises.push(
          set(botRef, {
            id: botId,
            name: botNames[i] || `Bot ${i+1}`,
            photoURL: '',
            isHost: false,
            isReady: true,
            isBot: true,
            botDifficulty: botDifficulty
          })
        );
      }
      
      // Wait for all bots to be added
      Promise.all(botPromises).then(() => {
        handleCloseSinglePlayerModal();
        navigate(`/game/${newGameRef.key}`);
      });
    }).catch(error => {
      console.error('Error creating single player game:', error);
      alert('Failed to create game. Please try again.');
    });
  };

  // Generate random code function (already implemented)
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Check if code is unique function (already implemented)
  const isCodeUnique = (code) => {
    return !games.some(game => game.gameCode === code);
  };

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
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <Button secondary onClick={handleCreateGame}>
            Create Multiplayer Game
          </Button>
          <Button primary onClick={handleSinglePlayerSetup}>
            Play with AI Bots
          </Button>
        </div>
        
        {activeTab === 'public' ? (
          <GamesList>
            {games
              .filter(game => game.status === 'waiting' && !game.isSinglePlayer)
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
            {games.filter(game => game.status === 'waiting' && !game.isSinglePlayer).length === 0 && (
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
      
      {/* Create Multiplayer Game Modal */}
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
      
      {/* Single Player Game Modal */}
      {showSinglePlayerModal && (
        <SinglePlayerSetupModal>
          <ModalContent>
            <ModalTitle>Play with AI Bots</ModalTitle>
            
            <FormGroup>
              <Label>Bot Difficulty:</Label>
              <Select 
                value={botDifficulty} 
                onChange={(e) => setBotDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Number of Bots:</Label>
              <NumberInput>
                <NumberButton 
                  onClick={() => setBotCount(Math.max(1, botCount - 1))}
                  disabled={botCount <= 1}
                >
                  -
                </NumberButton>
                <NumberDisplay>{botCount}</NumberDisplay>
                <NumberButton 
                  onClick={() => setBotCount(Math.min(3, botCount + 1))}
                  disabled={botCount >= 3}
                >
                  +
                </NumberButton>
              </NumberInput>
            </FormGroup>
            
            <ModalActions>
              <Button onClick={handleCloseSinglePlayerModal}>Cancel</Button>
              <Button primary onClick={handleStartSinglePlayerGame}>Start Game</Button>
            </ModalActions>
          </ModalContent>
        </SinglePlayerSetupModal>
      )}
    </LobbyContainer>
  );
};

export default GameLobby;
