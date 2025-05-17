import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebase';
import Game from './components/Game';
import GameRoom from './components/GameRoom';
import WaitingRoom from './components/WaitingRoom';
import Chat from './components/Chat';
import { 
  createGame, 
  joinGame, 
  addBot, 
  removePlayer, 
  toggleReady, 
  startGame,
  sendChatMessage
} from './utils/gameService';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';

const auth = getAuth(app);
const db = getFirestore(app);

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const GameContainer = styled.div`
  display: flex;
  flex: 1;
  padding: 20px;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const SidePanel = styled.div`
  width: 300px;
  margin-left: 20px;
`;

const MultiplayerGame: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [gameState, setGameState] = useState<'lobby' | 'waiting' | 'playing'>('lobby');
  const [gameCode, setGameCode] = useState<string>('');
  const [gameData, setGameData] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/';
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to game updates when game code is set
  useEffect(() => {
    if (!gameCode) return;

    const gameRef = doc(db, 'games', gameCode);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setGameData(data);
        
        // Update game state based on game status
        if (data.status === 'waiting') {
          setGameState('waiting');
        } else if (data.status === 'active') {
          setGameState('playing');
        }
      } else {
        setError('Game not found');
        setGameState('lobby');
        setGameCode('');
      }
    });

    return () => unsubscribe();
  }, [gameCode]);

  // Subscribe to chat messages
  useEffect(() => {
    if (!gameCode) return;

    const messagesRef = collection(db, 'games', gameCode, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: any[] = [];
      snapshot.forEach((doc) => {
        messages.push(doc.data());
      });
      setChatMessages(messages);
    });

    return () => unsubscribe();
  }, [gameCode]);

  const handleCreateRoom = async (roomName: string, isPrivate: boolean) => {
    try {
      setError('');
      const code = await createGame(
        user.uid, 
        user.displayName || user.email, 
        isPrivate
      );
      setGameCode(code);
      setGameState('waiting');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoinRoom = async (code: string) => {
    try {
      setError('');
      await joinGame(
        code, 
        user.uid, 
        user.displayName || user.email
      );
      setGameCode(code);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddBot = async (difficulty: 'easy' | 'medium' | 'hard') => {
    try {
      setError('');
      await addBot(gameCode, difficulty);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    try {
      setError('');
      await removePlayer(gameCode, playerId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleReady = async () => {
    try {
      setError('');
      await toggleReady(gameCode, user.uid);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStartGame = async () => {
    try {
      setError('');
      await startGame(gameCode);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      await sendChatMessage(
        gameCode,
        user.uid,
        user.displayName || user.email,
        message
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <AppContainer>
      <header className="App-header">
        <h1>Rummy Tile Game</h1>
        {gameCode && <p>Game Code: {gameCode}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </header>

      <GameContainer>
        <MainContent>
          {gameState === 'lobby' && (
            <GameRoom 
              onCreateRoom={handleCreateRoom} 
              onJoinRoom={handleJoinRoom} 
            />
          )}

          {gameState === 'waiting' && gameData && (
            <WaitingRoom 
              gameCode={gameCode}
              hostId={gameData.host}
              currentUserId={user.uid}
              players={gameData.players}
              onAddBot={handleAddBot}
              onRemovePlayer={handleRemovePlayer}
              onToggleReady={handleToggleReady}
              onStartGame={handleStartGame}
            />
          )}

          {gameState === 'playing' && gameData && (
            <Game />
          )}
        </MainContent>

        {(gameState === 'waiting' || gameState === 'playing') && (
          <SidePanel>
            <Chat 
              messages={chatMessages}
              onSendMessage={handleSendMessage}
            />
          </SidePanel>
        )}
      </GameContainer>
    </AppContainer>
  );
};

export default MultiplayerGame;
