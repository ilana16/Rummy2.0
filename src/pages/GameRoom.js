import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getDatabase, ref, onValue, update, push, set, remove } from 'firebase/database';

const GameRoomContainer = styled.div`
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

const GameCode = styled.div`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 5px 10px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
`;

const WaitingRoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const WaitingRoomTitle = styled.h2`
  margin-bottom: 30px;
  text-align: center;
`;

const PlayersList = styled.div`
  width: 100%;
  max-width: 600px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
`;

const PlayerItem = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const PlayerAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 15px;
`;

const PlayerName = styled.div`
  flex: 1;
  font-weight: ${props => props.isHost ? 'bold' : 'normal'};
  
  &::after {
    content: ${props => props.isHost ? '" (Host)"' : '""'};
    color: #4285F4;
    margin-left: 5px;
  }
`;

const ReadyStatus = styled.div`
  padding: 5px 10px;
  border-radius: 4px;
  background-color: ${props => props.isReady ? '#4CAF50' : '#F44336'};
  color: white;
  font-size: 0.9rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
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

const ChatContainer = styled.div`
  width: 100%;
  max-width: 600px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 300px;
  margin-bottom: 30px;
`;

const ChatHeader = styled.div`
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 10px 15px;
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
  padding: 10px 15px;
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

const GameRoom = () => {
  const { gameId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const chatEndRef = useRef(null);
  const database = getDatabase();

  useEffect(() => {
    // If no user is logged in, redirect to login
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    // Load game data
    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        alert('Game not found!');
        navigate('/lobby');
        return;
      }
      
      setGameState(data);
      
      // If user is not in the game, add them
      if (data.status === 'waiting' && !data.players[currentUser.uid]) {
        // Check if game is full
        if (Object.keys(data.players).length >= 4) {
          alert('Game is full!');
          navigate('/lobby');
          return;
        }
        
        // Add user to game
        update(ref(database, `games/${gameId}/players/${currentUser.uid}`), {
          id: currentUser.uid,
          name: currentUser.displayName || 'Anonymous',
          photoURL: currentUser.photoURL || '',
          isHost: false,
          isReady: false
        });
      }
    });
    
    // Load chat messages
    const chatRef = ref(database, `games/${gameId}/chat`);
    const chatUnsubscribe = onValue(chatRef, (snapshot) => {
      const chatData = snapshot.val();
      if (chatData) {
        const messagesArray = Object.entries(chatData).map(([id, message]) => ({
          id,
          ...message
        }));
        
        // Sort by timestamp
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        setChatMessages(messagesArray);
        
        // Scroll to bottom of chat
        setTimeout(() => {
          if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    });
    
    return () => {
      unsubscribe();
      chatUnsubscribe();
    };
  }, [currentUser, gameId, database, navigate]);

  useEffect(() => {
    // Scroll to bottom of chat when messages change
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleLeaveGame = async () => {
    try {
      // If user is host, delete the game
      if (gameState.players[currentUser.uid]?.isHost) {
        // Send system message that host left and game is ending
        const chatRef = ref(database, `games/${gameId}/chat`);
        const newMessageRef = push(chatRef);
        await set(newMessageRef, {
          senderId: 'system',
          senderName: 'System',
          text: `Host (${currentUser.displayName || 'Anonymous'}) left the game. Game is ending.`,
          timestamp: Date.now()
        });
        
        // Remove game
        await remove(ref(database, `games/${gameId}`));
      } else {
        // Remove user from game
        await remove(ref(database, `games/${gameId}/players/${currentUser.uid}`));
        
        // Send system message that user left
        const chatRef = ref(database, `games/${gameId}/chat`);
        const newMessageRef = push(chatRef);
        await set(newMessageRef, {
          senderId: 'system',
          senderName: 'System',
          text: `${currentUser.displayName || 'Anonymous'} left the game.`,
          timestamp: Date.now()
        });
      }
      
      // Navigate back to lobby
      navigate('/lobby');
    } catch (error) {
      console.error('Error leaving game:', error);
      alert('Failed to leave game. Please try again.');
    }
  };

  const handleToggleReady = async () => {
    try {
      const isReady = !gameState.players[currentUser.uid].isReady;
      
      // Update ready status
      await update(ref(database, `games/${gameId}/players/${currentUser.uid}`), {
        isReady
      });
      
      // Send system message
      const chatRef = ref(database, `games/${gameId}/chat`);
      const newMessageRef = push(chatRef);
      await set(newMessageRef, {
        senderId: 'system',
        senderName: 'System',
        text: `${currentUser.displayName || 'Anonymous'} is ${isReady ? 'ready' : 'not ready'}.`,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error toggling ready status:', error);
      alert('Failed to update ready status. Please try again.');
    }
  };

  const handleStartGame = async () => {
    try {
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
      
      // Update game status
      await update(ref(database, `games/${gameId}`), {
        status: 'playing',
        startedAt: Date.now()
      });
      
      // Send system message
      const chatRef = ref(database, `games/${gameId}/chat`);
      const newMessageRef = push(chatRef);
      await set(newMessageRef, {
        senderId: 'system',
        senderName: 'System',
        text: 'Game has started!',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    try {
      const chatRef = ref(database, `games/${gameId}/chat`);
      const newMessageRef = push(chatRef);
      
      await set(newMessageRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        text: chatMessage.trim(),
        timestamp: Date.now()
      });
      
      setChatMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  if (!gameState) {
    return (
      <GameRoomContainer>
        <Header>
          <Logo>Rummy Tile Game</Logo>
        </Header>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          Loading game...
        </div>
      </GameRoomContainer>
    );
  }

  return (
    <GameRoomContainer>
      <Header>
        <Logo>Rummy Tile Game</Logo>
        <GameCode>Code: {gameState.gameCode}</GameCode>
        <UserSection>
          <Avatar 
            src={currentUser.photoURL || 'https://via.placeholder.com/32'} 
            onClick={() => navigate('/profile')}
            alt="Profile"
          />
        </UserSection>
      </Header>
      
      {gameState.status === 'waiting' ? (
        <WaitingRoomContainer>
          <WaitingRoomTitle>Waiting Room</WaitingRoomTitle>
          
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
          
          <PlayersList>
            {gameState.players && Object.values(gameState.players).map(player => (
              <PlayerItem key={player.id}>
                <PlayerAvatar src={player.photoURL || 'https://via.placeholder.com/40'} alt={player.name} />
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
              {gameState.players[currentUser.uid]?.isReady ? 'Not Ready' : 'Ready'}
            </Button>
            {gameState.players[currentUser.uid]?.isHost && (
              <Button 
                primary 
                onClick={handleStartGame}
                disabled={Object.keys(gameState.players).length < 2 || 
                         !Object.values(gameState.players).every(player => player.isReady)}
              >
                Start Game
              </Button>
            )}
          </ButtonContainer>
        </WaitingRoomContainer>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          Game has started! Game board implementation coming soon...
        </div>
      )}
    </GameRoomContainer>
  );
};

export default GameRoom;
