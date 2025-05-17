import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '../firebase';
import { GameOptions } from './GameOptions';

const db = getFirestore(app);

interface GameStateManagerProps {
  gameCode: string;
  gameData: any;
  currentUserId: string;
}

const Container = styled.div`
  margin-top: 20px;
  width: 100%;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 5px;
  margin-bottom: 10px;
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatusLabel = styled.div`
  font-size: 12px;
  color: #757575;
`;

const StatusValue = styled.div`
  font-weight: bold;
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 10px;
  
  &:hover {
    background-color: #388e3c;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const GameStateManager: React.FC<GameStateManagerProps> = ({
  gameCode,
  gameData,
  currentUserId
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Auto-save game state every 30 seconds
  useEffect(() => {
    if (!gameData || gameData.status !== 'active') return;
    
    const saveInterval = setInterval(() => {
      saveGameState();
    }, 30000); // 30 seconds
    
    return () => clearInterval(saveInterval);
  }, [gameData]);
  
  const saveGameState = async () => {
    if (!gameData || isSaving) return;
    
    try {
      setIsSaving(true);
      
      const gameRef = doc(db, 'games', gameCode);
      await updateDoc(gameRef, {
        lastUpdatedAt: new Date()
      });
      
      // Create a snapshot in the states subcollection
      // This would be more complex in a real implementation
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving game state:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleForfeit = async () => {
    if (!gameData) return;
    
    try {
      const gameRef = doc(db, 'games', gameCode);
      await updateDoc(gameRef, {
        players: gameData.players.map((p: any) => 
          p.id === currentUserId ? { ...p, isConnected: false } : p
        ),
        lastUpdatedAt: new Date()
      });
    } catch (error) {
      console.error('Error forfeiting game:', error);
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  return (
    <Container>
      <StatusBar>
        <StatusItem>
          <StatusLabel>Game Status</StatusLabel>
          <StatusValue>{gameData?.status || 'Unknown'}</StatusValue>
        </StatusItem>
        
        <StatusItem>
          <StatusLabel>Players</StatusLabel>
          <StatusValue>{gameData?.players?.length || 0}/4</StatusValue>
        </StatusItem>
        
        {lastSaved && (
          <StatusItem>
            <StatusLabel>Last Saved</StatusLabel>
            <StatusValue>{formatTime(lastSaved)}</StatusValue>
          </StatusItem>
        )}
        
        <div>
          <Button onClick={saveGameState} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Game'}
          </Button>
          <Button onClick={handleForfeit} style={{ backgroundColor: '#f44336' }}>
            Forfeit
          </Button>
        </div>
      </StatusBar>
    </Container>
  );
};

export default GameStateManager;
