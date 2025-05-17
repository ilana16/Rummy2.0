import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getDatabase, ref, onValue, update, remove } from 'firebase/database';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const GameRoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  background-color: #4285F4;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

const GameCode = styled.div`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 5px 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 1rem;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  margin-left: 10px;
  cursor: pointer;
`;

const WaitingRoomContainer = styled.div`
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const WaitingRoomTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
`;

const PlayersList = styled.div`
  margin-bottom: 30px;
`;

const PlayerItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const PlayerAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  margin-right: 15px;
`;

const PlayerName = styled.div`
  flex: 1;
  font-weight: ${props => props.isHost ? 'bold' : 'normal'};
  
  &::after {
    content: '${props => props.isHost ? ' (Host)' : ''}';
    color: #4285F4;
  }
`;

const ReadyStatus = styled.div`
  padding: 5px 10px;
  border-radius: 4px;
  background-color: ${props => props.isReady ? '#4CAF50' : '#f44336'};
  color: white;
  font-size: 0.8rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const Button = styled.button`
  background-color: ${props => props.primary ? '#4285F4' : props.secondary ? '#4CAF50' : '#f44336'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${props => props.primary ? '#3367D6' : props.secondary ? '#388E3C' : '#d32f2f'};
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const GameBoardContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #e0e0e0;
`;

const GameBoard = styled.div`
  flex: 1;
  background-color: #2e7d32;
  border-radius: 8px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;
  margin-bottom: 20px;
  overflow-y: auto;
  position: relative;
`;

const PlayerRack = styled.div`
  background-color: #795548;
  border-radius: 8px;
  padding: 15px;
  min-height: 120px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
`;

const TileContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const SetContainer = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const Tile = styled.div`
  width: 50px;
  height: 70px;
  background-color: white;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  cursor: grab;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  position: relative;
  transform-style: preserve-3d;
  transform: ${props => props.isDragging ? 'scale(1.05)' : 'scale(1)'};
  transition: transform 0.2s;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    transform: translateZ(-3px);
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    border-radius: 2px;
    box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.2);
  }
`;

const TileNumber = styled.span`
  position: relative;
  color: ${props => props.color || 'black'};
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
`;

const JokerTile = styled(Tile)`
  background: linear-gradient(45deg, #ff9800, #f44336, #9c27b0, #3f51b5, #4CAF50);
  
  &::after {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const JokerStar = styled.span`
  font-size: 32px;
  color: white;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
`;

const ChatContainer = styled.div`
  width: 300px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ChatHeader = styled.div`
  padding: 10px;
  background-color: #f5f5f5;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ChatMessage = styled.div`
  padding: 8px 12px;
  background-color: ${props => props.isCurrentUser ? '#e3f2fd' : '#f5f5f5'};
  border-radius: 8px;
  align-self: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
  max-width: 80%;
`;

const MessageSender = styled.div`
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 4px;
  color: ${props => props.isCurrentUser ? '#1976d2' : '#333'};
`;

const MessageText = styled.div`
  word-break: break-word;
`;

const ChatInput = styled.div`
  display: flex;
  padding: 10px;
  border-top: 1px solid #eee;
`;

const ChatTextInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
`;

const SendButton = styled.button`
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  
  &:hover {
    background-color: #3367D6;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const GameStatusBar = styled.div`
  background-color: #f5f5f5;
  padding: 10px 20px;
  border-radius: 4px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CurrentTurnIndicator = styled.div`
  font-weight: bold;
  color: ${props => props.isCurrentUserTurn ? '#4285F4' : '#333'};
`;

const GameRoom = () => {
  const { gameId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
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
    // Listen for game data
    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const gameData = snapshot.val();
      if (gameData) {
        setGame(gameData);
        
        // Check if game has started
        if (gameData.status === 'playing') {
          setGameStarted(true);
        } else {
          setGameStarted(false);
        }
        
        // Update ready status
        if (gameData.players && gameData.players[currentUser.uid]) {
          setIsReady(gameData.players[currentUser.uid].isReady);
        }
      } else {
        // Game doesn't exist, redirect to lobby
        navigate('/lobby');
      }
    });

    return () => unsubscribe();
  }, [gameId, database, navigate, currentUser]);

  useEffect(() => {
    // Listen for chat messages
    const chatRef = ref(database, `games/${gameId}/chat`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const chatData = snapshot.val();
      if (chatData) {
        const messagesArray = Object.values(chatData);
        // Sort by timestamp
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        setChatMessages(messagesArray);
      } else {
        setChatMessages([]);
      }
    });

    return () => unsubscribe();
  }, [gameId, database]);

  const handleToggleReady = () => {
    const playerRef = ref(database, `games/${gameId}/players/${currentUser.uid}`);
    update(playerRef, {
      isReady: !isReady
    });
  };

  const handleStartGame = () => {
    // Check if at least 2 players and all are ready
    const players = game.players || {};
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
    const gameRef = ref(database, `games/${gameId}`);
    update(gameRef, {
      status: 'playing',
      startedAt: Date.now()
    });
  };

  const handleLeaveGame = () => {
    // If host is leaving and there are other players, transfer host status
    if (game.players[currentUser.uid].isHost && Object.keys(game.players).length > 1) {
      const otherPlayers = Object.entries(game.players)
        .filter(([id]) => id !== currentUser.uid);
      
      if (otherPlayers.length > 0) {
        // Transfer host to first other player
        const [newHostId] = otherPlayers[0];
        const newHostRef = ref(database, `games/${gameId}/players/${newHostId}`);
        update(newHostRef, { isHost: true });
      }
    }
    
    // Remove player from game
    const playerRef = ref(database, `games/${gameId}/players/${currentUser.uid}`);
    remove(playerRef).then(() => {
      // Check if this was the last player
      const remainingPlayers = { ...game.players };
      delete remainingPlayers[currentUser.uid];
      
      if (Object.keys(remainingPlayers).length === 0) {
        // Last player left, remove the game
        const gameRef = ref(database, `games/${gameId}`);
        remove(gameRef);
      }
      
      navigate('/lobby');
    });
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    const chatRef = ref(database, `games/${gameId}/chat`);
    const newMessageRef = push(chatRef);
    
    set(newMessageRef, {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
      text: chatMessage.trim(),
      timestamp: Date.now()
    });
    
    setChatMessage('');
  };

  // Placeholder for game board rendering
  const renderGameBoard = () => {
    return (
      <div>
        <GameStatusBar>
          <CurrentTurnIndicator isCurrentUserTurn={true}>
            Your Turn
          </CurrentTurnIndicator>
          <div>
            Tiles in pool: 78
          </div>
        </GameStatusBar>
        
        <TileContainer>
          <SetContainer>
            <Tile>
              <TileNumber color="red">7</TileNumber>
            </Tile>
            <Tile>
              <TileNumber color="red">8</TileNumber>
            </Tile>
            <Tile>
              <TileNumber color="red">9</TileNumber>
            </Tile>
          </SetContainer>
          
          <SetContainer>
            <Tile>
              <TileNumber color="blue">4</TileNumber>
            </Tile>
            <Tile>
              <TileNumber color="yellow">4</TileNumber>
            </Tile>
            <Tile>
              <TileNumber color="black">4</TileNumber>
            </Tile>
            <Tile>
              <TileNumber color="red">4</TileNumber>
            </Tile>
          </SetContainer>
        </TileContainer>
      </div>
    );
  };

  // Placeholder for player rack rendering
  const renderPlayerRack = () => {
    return (
      <PlayerRack>
        <Tile>
          <TileNumber color="red">1</TileNumber>
        </Tile>
        <Tile>
          <TileNumber color="blue">3</TileNumber>
        </Tile>
        <Tile>
          <TileNumber color="blue">4</TileNumber>
        </Tile>
        <Tile>
          <TileNumber color="yellow">6</TileNumber>
        </Tile>
        <Tile>
          <TileNumber color="black">7</TileNumber>
        </Tile>
        <Tile>
          <TileNumber color="red">8</TileNumber>
        </Tile>
        <Tile>
          <TileNumber color="yellow">9</TileNumber>
        </Tile>
        <Tile>
          <TileNumber color="black">10</TileNumber>
        </Tile>
        <Tile>
          <TileNumber color="red">11</TileNumber>
        </Tile>
        <Tile>
          <TileNumber color="blue">12</TileNumber>
        </Tile>
        <Tile>
          <TileNumber color="yellow">13</TileNumber>
        </Tile>
        <JokerTile>
          <JokerStar>★</JokerStar>
        </JokerTile>
      </PlayerRack>
    );
  };

  if (!game) {
    return <div>Loading game...</div>;
  }

  return (
    <GameRoomContainer>
      <Header>
        <Logo>Rummy Tile Game</Logo>
        <GameCode>Code: {game.gameCode}</GameCode>
        <UserSection>
          <Avatar 
            src={currentUser.photoURL || 'https://via.placeholder.com/32'} 
            onClick={() => navigate('/profile')}
          />
        </UserSection>
      </Header>
      
      {!gameStarted ? (
        <WaitingRoomContainer>
          <WaitingRoomTitle>Waiting Room</WaitingRoomTitle>
          
          <PlayersList>
            {game.players && Object.values(game.players).map(player => (
              <PlayerItem key={player.id}>
                <PlayerAvatar src={player.photoURL || 'https://via.placeholder.com/40'} />
                <PlayerName isHost={player.isHost}>
                  {player.name}
                </PlayerName>
                <ReadyStatus isReady={player.isReady}>
                  {player.isReady ? 'Ready' : 'Not Ready'}
                </ReadyStatus>
              </PlayerItem>
            ))}
          </PlayersList>
          
          <ButtonContainer>
            <Button onClick={handleLeaveGame}>Leave Game</Button>
            <Button 
              secondary 
              onClick={handleToggleReady}
            >
              {isReady ? 'Not Ready' : 'Ready'}
            </Button>
            {game.players[currentUser.uid].isHost && (
              <Button 
                primary 
                onClick={handleStartGame}
                disabled={Object.keys(game.players).length < 2 || 
                         !Object.values(game.players).every(player => player.isReady)}
              >
                Start Game
              </Button>
            )}
          </ButtonContainer>
        </WaitingRoomContainer>
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
                {chatMessages.map((msg, index) => (
                  <ChatMessage 
                    key={index} 
                    isCurrentUser={msg.senderId === currentUser.uid}
                  >
                    <MessageSender isCurrentUser={msg.senderId === currentUser.uid}>
                      {msg.senderName}
                    </MessageSender>
                    <MessageText>{msg.text}</MessageText>
                  </ChatMessage>
                ))}
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
    </GameRoomContainer>
  );
};

export default GameRoom;
