import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getDatabase, ref, onValue, update, push, set, remove } from 'firebase/database';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useGameLogic } from '../hooks/useGameLogic';
import RummyAIBot from '../services/RummyAIBot';

// Styled components from previous implementation...

const GameRoom = () => {
  const { gameId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [manipulationMode, setManipulationMode] = useState(false);
  const [manipulationPlan, setManipulationPlan] = useState({ newSets: [], tilesFromRack: [] });
  const [aiBotsInitialized, setAiBotsInitialized] = useState(false);
  const [aiBotsInstances, setAiBotsInstances] = useState({});
  const chatEndRef = useRef(null);
  const database = getDatabase();
  
  // Use the game logic hook
  const {
    gameState,
    playerRack,
    tableSets,
    currentTurn,
    isInitialMeld,
    validationError,
    gameOver,
    winner,
    startGame,
    drawTile,
    playTiles,
    manipulateTiles,
    retrieveJoker,
    isValidSet,
    calculatePoints
  } = useGameLogic(gameId);

  useEffect(() => {
    // Redirect to login if not authenticated or email not verified
    if (!currentUser) {
      navigate('/');
    } else if (!currentUser.emailVerified) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Initialize AI bots when game starts
  useEffect(() => {
    if (gameState && gameState.status === 'playing' && !aiBotsInitialized) {
      // Check if there are any AI bots in the game
      const players = gameState.players || {};
      const botPlayers = Object.values(players).filter(player => player.isBot);
      
      if (botPlayers.length > 0) {
        // Initialize bots
        const botInstances = {};
        
        botPlayers.forEach(bot => {
          const aiBot = new RummyAIBot(
            gameId,
            bot.id,
            bot.name,
            bot.botDifficulty || 'medium'
          );
          
          // Start listening for game state changes
          aiBot.startListening();
          
          botInstances[bot.id] = aiBot;
        });
        
        setAiBotsInstances(botInstances);
        setAiBotsInitialized(true);
      }
    }
  }, [gameState, aiBotsInitialized, gameId]);

  // Clean up AI bot listeners when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any bot listeners
      Object.values(aiBotsInstances).forEach(bot => {
        if (bot.cleanup) bot.cleanup();
      });
    };
  }, [aiBotsInstances]);

  // Rest of the component implementation...

  // Modify startGame function to initialize the game with AI bots
  const handleStartGame = () => {
    // Check if at least 2 players and all are ready
    const players = gameState.players || {};
    const playerCount = Object.keys(players).length;
    
    if (playerCount < 2) {
      alert('Need at least 2 players to start the game.');
      return;
    }
    
    const allReady = Object.values(players).every(player => player.isReady);
    if (!allReady) {
      alert('All players must be ready to start the game.');
      return;
    }
    
    // Start the game
    startGame();
  };

  // Render waiting room with AI bot indicators
  const renderWaitingRoom = () => {
    if (!gameState) return null;
    
    return (
      <WaitingRoomContainer>
        <WaitingRoomTitle>Waiting Room</WaitingRoomTitle>
        
        <PlayersList>
          {gameState.players && Object.values(gameState.players).map(player => (
            <PlayerItem key={player.id}>
              <PlayerAvatar src={player.photoURL || 'https://via.placeholder.com/40'} />
              <PlayerName isHost={player.isHost}>
                {player.name} {player.isBot && `(${player.botDifficulty} AI)`}
              </PlayerName>
              <ReadyStatus isReady={player.isReady}>
                {player.isReady ? 'Ready' : 'Not Ready'}
              </ReadyStatus>
            </PlayerItem>
          ))}
        </PlayersList>
        
        <ButtonContainer>
          <Button onClick={handleLeaveGame}>Leave Game</Button>
          {!gameState.isSinglePlayer && (
            <Button 
              secondary 
              onClick={() => {
                const playerRef = ref(database, `games/${gameId}/players/${currentUser.uid}`);
                update(playerRef, {
                  isReady: !gameState.players[currentUser.uid].isReady
                });
              }}
            >
              {gameState.players[currentUser.uid].isReady ? 'Not Ready' : 'Ready'}
            </Button>
          )}
          {gameState.players[currentUser.uid].isHost && (
            <Button 
              primary 
              onClick={handleStartGame}
              disabled={Object.keys(gameState.players).length < 2 || 
                       (!gameState.isSinglePlayer && !Object.values(gameState.players).every(player => player.isReady))}
            >
              Start Game
            </Button>
          )}
        </ButtonContainer>
      </WaitingRoomContainer>
    );
  };

  // Rest of the component implementation...

  return (
    <GameRoomContainer>
      <Header>
        <Logo>Rummy Tile Game</Logo>
        <GameCode>Code: {gameState?.gameCode}</GameCode>
        <UserSection>
          <Avatar 
            src={currentUser.photoURL || 'https://via.placeholder.com/32'} 
            onClick={() => navigate('/profile')}
          />
        </UserSection>
      </Header>
      
      {gameState?.status === 'waiting' ? (
        renderWaitingRoom()
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
            <GameBoardContainer>
              <GameBoard>
                {renderGameBoard()}
              </GameBoard>
              {renderPlayerRack()}
            </GameBoardContainer>
            
            <ChatContainer>
              <ChatHeader>Game Chat</ChatHeader>
              <ChatMessages>
                {chatMessages.map((msg) => (
                  <ChatMessage 
                    key={msg.id} 
                    isCurrentUser={msg.senderId === currentUser.uid}
                  >
                    <MessageSender isCurrentUser={msg.senderId === currentUser.uid}>
                      {msg.senderName}
                    </MessageSender>
                    <MessageText>{msg.text}</MessageText>
                  </ChatMessage>
                ))}
                <div ref={chatEndRef} />
              </ChatMessages>
              <ChatInput>
                <ChatTextInput 
                  type="text" 
                  value={chatMessage} 
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <SendButton onClick={handleSendMessage}>Send</SendButton>
              </ChatInput>
            </ChatContainer>
          </div>
        </DndProvider>
      )}
      
      {renderGameOver()}
    </GameRoomContainer>
  );
};

export default GameRoom;
