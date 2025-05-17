import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import GameBoard from './components/GameBoard';
import PlayerRack from './components/PlayerRack';
import { 
  Tile, 
  TileSet, 
  createNewTileDeck, 
  dealTiles, 
  isValidSet,
  canMakeInitialMeld
} from './utils/gameLogic';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 20px;
`;

const GameControls = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin: 10px 0;
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  margin: 0 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s;

  &:hover {
    background-color: #388e3c;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin: 10px 0;
`;

const PlayerStatus = styled.div`
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const Game: React.FC = () => {
  const [playerRack, setPlayerRack] = useState<Tile[]>([]);
  const [board, setBoard] = useState<TileSet[]>([]);
  const [pool, setPool] = useState<Tile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [initialMeldComplete, setInitialMeldComplete] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Initialize game
  useEffect(() => {
    const deck = createNewTileDeck();
    const { playerRacks, pool } = dealTiles(deck, 1); // Single player for now
    setPlayerRack(playerRacks['player-0']);
    setPool(pool);
    setBoard([]);
  }, []);

  const handleTileClick = (tileId: string) => {
    setSelectedTiles(prev => {
      if (prev.includes(tileId)) {
        return prev.filter(id => id !== tileId);
      } else {
        return [...prev, tileId];
      }
    });
  };

  const handleDrawTile = () => {
    if (pool.length === 0) {
      setMessage('No more tiles in the pool!');
      return;
    }

    const newTile = pool[0];
    const newPool = [...pool.slice(1)];
    
    setPlayerRack(prev => [...prev, newTile]);
    setPool(newPool);
    setSelectedTiles([]);
    setMessage('You drew a tile. Your turn is over.');
  };

  const handlePlaySet = () => {
    const selectedTilesObjects = playerRack.filter(tile => 
      selectedTiles.includes(tile.id)
    );
    
    const { valid, type } = isValidSet(selectedTilesObjects);
    
    if (!valid) {
      setMessage('Invalid set! Please select a valid run or group.');
      return;
    }
    
    // Check if this is the initial meld
    if (!initialMeldComplete) {
      const points = selectedTilesObjects.reduce((sum, tile) => sum + tile.value, 0);
      if (points < 30) {
        setMessage('Initial meld must be at least 30 points!');
        return;
      }
      setInitialMeldComplete(true);
    }
    
    // Create a new set
    const newSet: TileSet = {
      id: `set-${Date.now()}`,
      tiles: selectedTilesObjects,
      type: type || 'unassigned'
    };
    
    // Add to board
    setBoard(prev => [...prev, newSet]);
    
    // Remove from rack
    setPlayerRack(prev => 
      prev.filter(tile => !selectedTiles.includes(tile.id))
    );
    
    setSelectedTiles([]);
    setMessage(`Successfully played a ${type}!`);
  };

  return (
    <GameContainer>
      <PlayerInfo>
        <PlayerStatus>
          <h3>Your Rack: {playerRack.length} tiles</h3>
          {message && <p>{message}</p>}
        </PlayerStatus>
        <PlayerStatus>
          <h3>Pool: {pool.length} tiles</h3>
          {initialMeldComplete ? 
            <p>Initial meld complete</p> : 
            <p>Need 30+ points for initial meld</p>
          }
        </PlayerStatus>
      </PlayerInfo>
      
      <GameBoard 
        tileSets={board} 
        onTileClick={() => {}} // Will implement for manipulation later
      />
      
      <GameControls>
        <Button onClick={handleDrawTile}>
          Draw Tile
        </Button>
        <Button 
          onClick={handlePlaySet}
          disabled={selectedTiles.length < 3}
        >
          Play Set
        </Button>
      </GameControls>
      
      <PlayerRack 
        tiles={playerRack}
        onTileClick={handleTileClick}
        selectedTileIds={selectedTiles}
      />
    </GameContainer>
  );
};

export default Game;
