import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface WaitingRoomProps {
  gameCode: string;
  hostId: string;
  currentUserId: string;
  players: Array<{
    id: string;
    name: string;
    isReady: boolean;
    isBot: boolean;
    botDifficulty?: 'easy' | 'medium' | 'hard';
  }>;
  onAddBot: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onRemovePlayer: (playerId: string) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
}

const WaitingRoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const GameCodeDisplay = styled.div`
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
  width: 100%;
  
  h3 {
    margin: 0 0 10px 0;
  }
  
  p {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
    color: #4caf50;
  }
`;

const PlayersList = styled.div`
  width: 100%;
  margin-bottom: 20px;
`;

const PlayerItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  border-radius: 5px;
  border-left: 5px solid #4caf50;
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  
  span {
    margin-left: 10px;
  }
`;

const PlayerStatus = styled.div<{ isReady: boolean }>`
  padding: 5px 10px;
  border-radius: 15px;
  background-color: ${props => props.isReady ? '#4caf50' : '#f44336'};
  color: white;
  font-size: 14px;
`;

const BotBadge = styled.div<{ difficulty: string }>`
  padding: 5px 10px;
  border-radius: 15px;
  margin-left: 10px;
  background-color: ${props => {
    switch(props.difficulty) {
      case 'easy': return '#8bc34a';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      default: return '#9e9e9e';
    }
  }};
  color: white;
  font-size: 14px;
`;

const RemoveButton = styled.button`
  background-color: transparent;
  color: #f44336;
  border: none;
  cursor: pointer;
  font-size: 18px;
  
  &:hover {
    color: #d32f2f;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ButtonsRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s;
  flex: 1;
  margin: 0 5px;

  &:hover {
    background-color: #388e3c;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const AddBotButton = styled(Button)<{ difficulty: string }>`
  background-color: ${props => {
    switch(props.difficulty) {
      case 'easy': return '#8bc34a';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      default: return '#9e9e9e';
    }
  }};
  
  &:hover {
    background-color: ${props => {
      switch(props.difficulty) {
        case 'easy': return '#7cb342';
        case 'medium': return '#fb8c00';
        case 'hard': return '#d32f2f';
        default: return '#757575';
      }
    }};
  }
`;

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  gameCode,
  hostId,
  currentUserId,
  players,
  onAddBot,
  onRemovePlayer,
  onToggleReady,
  onStartGame
}) => {
  const [canStart, setCanStart] = useState(false);
  const isHost = currentUserId === hostId;
  const currentPlayer = players.find(p => p.id === currentUserId);
  
  useEffect(() => {
    // Game can start if:
    // 1. There are at least 2 players
    // 2. All players are ready
    // 3. Current user is the host
    const allReady = players.every(player => player.isReady);
    setCanStart(players.length >= 2 && allReady && isHost);
  }, [players, isHost]);
  
  return (
    <WaitingRoomContainer>
      <GameCodeDisplay>
        <h3>Game Code</h3>
        <p>{gameCode}</p>
      </GameCodeDisplay>
      
      <PlayersList>
        <h3>Players ({players.length}/4)</h3>
        {players.map(player => (
          <PlayerItem key={player.id}>
            <PlayerInfo>
              {player.id === hostId && <span>👑</span>}
              <span>{player.name}</span>
              {player.isBot && (
                <BotBadge difficulty={player.botDifficulty || 'easy'}>
                  {player.botDifficulty?.toUpperCase() || 'EASY'} BOT
                </BotBadge>
              )}
            </PlayerInfo>
            <div>
              <PlayerStatus isReady={player.isReady}>
                {player.isReady ? 'Ready' : 'Not Ready'}
              </PlayerStatus>
              {isHost && player.id !== currentUserId && (
                <RemoveButton onClick={() => onRemovePlayer(player.id)}>
                  ✕
                </RemoveButton>
              )}
            </div>
          </PlayerItem>
        ))}
      </PlayersList>
      
      <ControlsContainer>
        {isHost && players.length < 4 && (
          <ButtonsRow>
            <AddBotButton 
              difficulty="easy"
              onClick={() => onAddBot('easy')}
            >
              Add Easy Bot
            </AddBotButton>
            <AddBotButton 
              difficulty="medium"
              onClick={() => onAddBot('medium')}
            >
              Add Medium Bot
            </AddBotButton>
            <AddBotButton 
              difficulty="hard"
              onClick={() => onAddBot('hard')}
            >
              Add Hard Bot
            </AddBotButton>
          </ButtonsRow>
        )}
        
        <ButtonsRow>
          <Button 
            onClick={onToggleReady}
            style={{ backgroundColor: currentPlayer?.isReady ? '#f44336' : '#4caf50' }}
          >
            {currentPlayer?.isReady ? 'Not Ready' : 'Ready'}
          </Button>
          
          {isHost && (
            <Button 
              onClick={onStartGame}
              disabled={!canStart}
            >
              Start Game
            </Button>
          )}
        </ButtonsRow>
      </ControlsContainer>
    </WaitingRoomContainer>
  );
};

export default WaitingRoom;
