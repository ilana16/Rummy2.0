import React, { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref, set, update, push, onValue } from 'firebase/database';
import { useAuth } from '../context/AuthContext';

// Custom hook for game logic and state management
export const useGameLogic = (gameId) => {
  const { currentUser } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [playerRack, setPlayerRack] = useState([]);
  const [tableSets, setTableSets] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('');
  const [isInitialMeld, setIsInitialMeld] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const database = getDatabase();

  // Initialize game state
  const initializeGame = useCallback(() => {
    if (!gameId || !currentUser) return;
    
    const gameRef = ref(database, `games/${gameId}`);
    
    // Listen for game state changes
    return onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      setGameState(data);
      
      // Set player rack
      if (data.players && data.players[currentUser.uid] && data.players[currentUser.uid].rack) {
        setPlayerRack(data.players[currentUser.uid].rack);
      }
      
      // Set table sets
      if (data.tableSets) {
        setTableSets(data.tableSets);
      }
      
      // Set current turn
      if (data.currentTurn) {
        setCurrentTurn(data.currentTurn);
      }
      
      // Check if player has made initial meld
      if (data.players && data.players[currentUser.uid] && data.players[currentUser.uid].hasInitialMeld) {
        setIsInitialMeld(false);
      }
      
      // Check if game is over
      if (data.status === 'completed') {
        setGameOver(true);
        setWinner(data.winner);
      }
    });
  }, [gameId, currentUser, database]);

  // Start a new game
  const startGame = useCallback(() => {
    if (!gameId) return;
    
    // Generate all tiles
    const tiles = generateTiles();
    
    // Shuffle tiles
    const shuffledTiles = shuffleTiles(tiles);
    
    // Distribute tiles to players
    const playerTiles = {};
    const players = gameState.players || {};
    const playerIds = Object.keys(players);
    
    playerIds.forEach((playerId, index) => {
      playerTiles[playerId] = shuffledTiles.slice(index * 14, (index + 1) * 14);
    });
    
    // Remaining tiles go to the pool
    const poolTiles = shuffledTiles.slice(playerIds.length * 14);
    
    // Determine first player randomly
    const firstPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];
    
    // Update game state in Firebase
    const gameRef = ref(database, `games/${gameId}`);
    update(gameRef, {
      status: 'playing',
      currentTurn: firstPlayerId,
      pool: poolTiles,
      tableSets: [],
      startedAt: Date.now(),
      players: Object.fromEntries(
        Object.entries(players).map(([id, player]) => [
          id,
          {
            ...player,
            rack: playerTiles[id],
            hasInitialMeld: false,
            score: 0
          }
        ])
      )
    });
  }, [gameId, gameState, database]);

  // Generate all tiles for the game
  const generateTiles = () => {
    const tiles = [];
    const colors = ['red', 'blue', 'yellow', 'black'];
    
    // Generate numbered tiles (1-13) in each color, with 2 sets
    for (let set = 0; set < 2; set++) {
      for (let color of colors) {
        for (let number = 1; number <= 13; number++) {
          tiles.push({
            id: `${color}-${number}-${set}`,
            color,
            number,
            isJoker: false
          });
        }
      }
    }
    
    // Add 2 joker tiles
    tiles.push({ id: 'joker-1', color: 'joker', number: 0, isJoker: true });
    tiles.push({ id: 'joker-2', color: 'joker', number: 0, isJoker: true });
    
    return tiles;
  };

  // Shuffle tiles using Fisher-Yates algorithm
  const shuffleTiles = (tiles) => {
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Draw a tile from the pool
  const drawTile = useCallback(() => {
    if (!gameId || !currentUser || currentTurn !== currentUser.uid) {
      setValidationError("It's not your turn");
      return;
    }
    
    const gameRef = ref(database, `games/${gameId}`);
    
    // Get current game state
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const pool = data.pool || [];
      if (pool.length === 0) {
        setValidationError("No tiles left in the pool");
        return;
      }
      
      // Take the first tile from the pool
      const drawnTile = pool[0];
      const newPool = pool.slice(1);
      
      // Add tile to player's rack
      const playerRack = data.players[currentUser.uid].rack || [];
      const newRack = [...playerRack, drawnTile];
      
      // Determine next player
      const playerIds = Object.keys(data.players);
      const currentPlayerIndex = playerIds.indexOf(currentUser.uid);
      const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
      const nextPlayerId = playerIds[nextPlayerIndex];
      
      // Update game state
      update(gameRef, {
        pool: newPool,
        currentTurn: nextPlayerId,
        [`players/${currentUser.uid}/rack`]: newRack,
        lastAction: {
          type: 'draw',
          playerId: currentUser.uid,
          timestamp: Date.now()
        }
      });
      
      setValidationError('');
    }, { onlyOnce: true });
  }, [gameId, currentUser, currentTurn, database]);

  // Check if a set is valid
  const isValidSet = (tiles) => {
    if (!tiles || tiles.length < 3) return false;
    
    // Check if it's a group (same number, different colors)
    const isGroup = tiles.every(tile => !tile.isJoker && tile.number === tiles[0].number) || 
                   (tiles.filter(tile => !tile.isJoker).every(tile => tile.number === tiles.filter(tile => !tile.isJoker)[0].number));
    
    // Check if it's a run (consecutive numbers, same color)
    let isRun = false;
    if (!isGroup) {
      // Get non-joker tiles
      const nonJokerTiles = tiles.filter(tile => !tile.isJoker);
      
      // Check if all non-joker tiles have the same color
      const sameColor = nonJokerTiles.every(tile => tile.color === nonJokerTiles[0].color);
      
      if (sameColor) {
        // Sort by number
        const sortedTiles = [...nonJokerTiles].sort((a, b) => a.number - b.number);
        
        // Count jokers
        const jokerCount = tiles.length - nonJokerTiles.length;
        
        // Check if numbers are consecutive with jokers filling gaps
        let gapsNeeded = 0;
        for (let i = 1; i < sortedTiles.length; i++) {
          gapsNeeded += sortedTiles[i].number - sortedTiles[i-1].number - 1;
        }
        
        isRun = gapsNeeded <= jokerCount;
      }
    }
    
    return isGroup || isRun;
  };

  // Calculate the total points in a set of tiles
  const calculatePoints = (tiles) => {
    return tiles.reduce((sum, tile) => {
      if (tile.isJoker) {
        // Joker value depends on the set it's in
        return sum + 0; // Will be calculated based on context
      }
      return sum + tile.number;
    }, 0);
  };

  // Play tiles from rack to table
  const playTiles = useCallback((selectedTiles, targetSetIndex = -1) => {
    if (!gameId || !currentUser || currentTurn !== currentUser.uid) {
      setValidationError("It's not your turn");
      return;
    }
    
    // Validate the selected tiles
    if (!selectedTiles || selectedTiles.length === 0) {
      setValidationError("No tiles selected");
      return;
    }
    
    const gameRef = ref(database, `games/${gameId}`);
    
    // Get current game state
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const currentRack = data.players[currentUser.uid].rack || [];
      const currentTableSets = data.tableSets || [];
      
      // Check if player has the selected tiles in their rack
      const hasAllTiles = selectedTiles.every(selectedTile => 
        currentRack.some(rackTile => rackTile.id === selectedTile.id)
      );
      
      if (!hasAllTiles) {
        setValidationError("You don't have all the selected tiles");
        return;
      }
      
      // Check if this is the initial meld
      const isFirstMeld = !data.players[currentUser.uid].hasInitialMeld;
      
      if (isFirstMeld) {
        // For initial meld, check if total points >= 30
        const points = calculatePoints(selectedTiles);
        if (points < 30) {
          setValidationError("Initial meld must be at least 30 points");
          return;
        }
        
        // Check if the selected tiles form a valid set
        if (!isValidSet(selectedTiles)) {
          setValidationError("Selected tiles do not form a valid set");
          return;
        }
        
        // Add new set to table
        const newTableSets = [...currentTableSets, selectedTiles];
        
        // Remove played tiles from rack
        const newRack = currentRack.filter(rackTile => 
          !selectedTiles.some(selectedTile => selectedTile.id === rackTile.id)
        );
        
        // Determine next player
        const playerIds = Object.keys(data.players);
        const currentPlayerIndex = playerIds.indexOf(currentUser.uid);
        const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
        const nextPlayerId = playerIds[nextPlayerIndex];
        
        // Update game state
        update(gameRef, {
          tableSets: newTableSets,
          [`players/${currentUser.uid}/rack`]: newRack,
          [`players/${currentUser.uid}/hasInitialMeld`]: true,
          currentTurn: nextPlayerId,
          lastAction: {
            type: 'play',
            playerId: currentUser.uid,
            timestamp: Date.now()
          }
        });
        
        // Check if player has emptied their rack
        if (newRack.length === 0) {
          update(gameRef, {
            status: 'completed',
            winner: currentUser.uid,
            endedAt: Date.now()
          });
        }
        
        setValidationError('');
      } else {
        // For subsequent plays
        if (targetSetIndex >= 0 && targetSetIndex < currentTableSets.length) {
          // Adding to existing set
          const targetSet = currentTableSets[targetSetIndex];
          const newSet = [...targetSet, ...selectedTiles];
          
          // Validate the new set
          if (!isValidSet(newSet)) {
            setValidationError("Resulting set would not be valid");
            return;
          }
          
          // Update the target set
          const newTableSets = [...currentTableSets];
          newTableSets[targetSetIndex] = newSet;
          
          // Remove played tiles from rack
          const newRack = currentRack.filter(rackTile => 
            !selectedTiles.some(selectedTile => selectedTile.id === rackTile.id)
          );
          
          // Determine next player
          const playerIds = Object.keys(data.players);
          const currentPlayerIndex = playerIds.indexOf(currentUser.uid);
          const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
          const nextPlayerId = playerIds[nextPlayerIndex];
          
          // Update game state
          update(gameRef, {
            tableSets: newTableSets,
            [`players/${currentUser.uid}/rack`]: newRack,
            currentTurn: nextPlayerId,
            lastAction: {
              type: 'play',
              playerId: currentUser.uid,
              timestamp: Date.now()
            }
          });
          
          // Check if player has emptied their rack
          if (newRack.length === 0) {
            update(gameRef, {
              status: 'completed',
              winner: currentUser.uid,
              endedAt: Date.now()
            });
          }
          
          setValidationError('');
        } else {
          // Creating a new set
          if (!isValidSet(selectedTiles)) {
            setValidationError("Selected tiles do not form a valid set");
            return;
          }
          
          // Add new set to table
          const newTableSets = [...currentTableSets, selectedTiles];
          
          // Remove played tiles from rack
          const newRack = currentRack.filter(rackTile => 
            !selectedTiles.some(selectedTile => selectedTile.id === rackTile.id)
          );
          
          // Determine next player
          const playerIds = Object.keys(data.players);
          const currentPlayerIndex = playerIds.indexOf(currentUser.uid);
          const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
          const nextPlayerId = playerIds[nextPlayerIndex];
          
          // Update game state
          update(gameRef, {
            tableSets: newTableSets,
            [`players/${currentUser.uid}/rack`]: newRack,
            currentTurn: nextPlayerId,
            lastAction: {
              type: 'play',
              playerId: currentUser.uid,
              timestamp: Date.now()
            }
          });
          
          // Check if player has emptied their rack
          if (newRack.length === 0) {
            update(gameRef, {
              status: 'completed',
              winner: currentUser.uid,
              endedAt: Date.now()
            });
          }
          
          setValidationError('');
        }
      }
    }, { onlyOnce: true });
  }, [gameId, currentUser, currentTurn, database]);

  // Manipulate tiles on the table
  const manipulateTiles = useCallback((manipulationPlan) => {
    if (!gameId || !currentUser || currentTurn !== currentUser.uid) {
      setValidationError("It's not your turn");
      return;
    }
    
    const gameRef = ref(database, `games/${gameId}`);
    
    // Get current game state
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const currentRack = data.players[currentUser.uid].rack || [];
      const currentTableSets = data.tableSets || [];
      
      // Apply the manipulation plan to create new table sets
      const newTableSets = [...manipulationPlan.newSets];
      
      // Validate all new sets
      const allSetsValid = newTableSets.every(set => isValidSet(set));
      
      if (!allSetsValid) {
        setValidationError("One or more resulting sets would not be valid");
        return;
      }
      
      // Check if the player has all the tiles from their rack that are being used
      const tilesFromRack = manipulationPlan.tilesFromRack || [];
      const hasAllTiles = tilesFromRack.every(tile => 
        currentRack.some(rackTile => rackTile.id === tile.id)
      );
      
      if (!hasAllTiles) {
        setValidationError("You don't have all the required tiles in your rack");
        return;
      }
      
      // Remove played tiles from rack
      const newRack = currentRack.filter(rackTile => 
        !tilesFromRack.some(tile => tile.id === rackTile.id)
      );
      
      // Determine next player
      const playerIds = Object.keys(data.players);
      const currentPlayerIndex = playerIds.indexOf(currentUser.uid);
      const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
      const nextPlayerId = playerIds[nextPlayerIndex];
      
      // Update game state
      update(gameRef, {
        tableSets: newTableSets,
        [`players/${currentUser.uid}/rack`]: newRack,
        currentTurn: nextPlayerId,
        lastAction: {
          type: 'manipulate',
          playerId: currentUser.uid,
          timestamp: Date.now()
        }
      });
      
      // Check if player has emptied their rack
      if (newRack.length === 0) {
        update(gameRef, {
          status: 'completed',
          winner: currentUser.uid,
          endedAt: Date.now()
        });
      }
      
      setValidationError('');
    }, { onlyOnce: true });
  }, [gameId, currentUser, currentTurn, database]);

  // Retrieve a joker from a set
  const retrieveJoker = useCallback((setIndex, jokerIndex, replacementTile) => {
    if (!gameId || !currentUser || currentTurn !== currentUser.uid) {
      setValidationError("It's not your turn");
      return;
    }
    
    const gameRef = ref(database, `games/${gameId}`);
    
    // Get current game state
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const currentRack = data.players[currentUser.uid].rack || [];
      const currentTableSets = data.tableSets || [];
      
      // Check if the set and joker exist
      if (setIndex < 0 || setIndex >= currentTableSets.length) {
        setValidationError("Invalid set index");
        return;
      }
      
      const targetSet = currentTableSets[setIndex];
      if (jokerIndex < 0 || jokerIndex >= targetSet.length) {
        setValidationError("Invalid joker index");
        return;
      }
      
      const jokerTile = targetSet[jokerIndex];
      if (!jokerTile.isJoker) {
        setValidationError("Selected tile is not a joker");
        return;
      }
      
      // Check if player has the replacement tile
      const hasTile = currentRack.some(tile => tile.id === replacementTile.id);
      if (!hasTile) {
        setValidationError("You don't have the replacement tile");
        return;
      }
      
      // Create new set with joker replaced
      const newSet = [...targetSet];
      newSet[jokerIndex] = replacementTile;
      
      // Validate the new set
      if (!isValidSet(newSet)) {
        setValidationError("Resulting set would not be valid");
        return;
      }
      
      // Update table sets
      const newTableSets = [...currentTableSets];
      newTableSets[setIndex] = newSet;
      
      // Remove replacement tile from rack and add joker
      const newRack = currentRack.filter(tile => tile.id !== replacementTile.id);
      newRack.push(jokerTile);
      
      // Update game state
      update(gameRef, {
        tableSets: newTableSets,
        [`players/${currentUser.uid}/rack`]: newRack,
        lastAction: {
          type: 'retrieveJoker',
          playerId: currentUser.uid,
          timestamp: Date.now()
        }
      });
      
      setValidationError('');
    }, { onlyOnce: true });
  }, [gameId, currentUser, currentTurn, database]);

  // Initialize game when component mounts
  useEffect(() => {
    const unsubscribe = initializeGame();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initializeGame]);

  return {
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
  };
};
