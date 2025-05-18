import { getDatabase, ref, update, onValue } from 'firebase/database';

// AI Bot class with different difficulty levels
class RummyAIBot {
  constructor(gameId, botId, botName, difficultyLevel) {
    this.gameId = gameId;
    this.botId = botId;
    this.botName = botName;
    this.difficultyLevel = difficultyLevel; // 'easy', 'medium', 'hard'
    this.database = getDatabase();
    this.gameState = null;
    this.botRack = [];
    this.tableSets = [];
    this.thinkingTime = this.getThinkingTime();
  }

  // Get thinking time based on difficulty level
  getThinkingTime() {
    switch (this.difficultyLevel) {
      case 'easy':
        return { min: 2000, max: 4000 }; // 2-4 seconds
      case 'medium':
        return { min: 1500, max: 3000 }; // 1.5-3 seconds
      case 'hard':
        return { min: 1000, max: 2000 }; // 1-2 seconds
      default:
        return { min: 2000, max: 4000 };
    }
  }

  // Start listening for game state changes
  startListening() {
    const gameRef = ref(this.database, `games/${this.gameId}`);
    return onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      this.gameState = data;
      
      // Update bot's rack
      if (data.players && data.players[this.botId] && data.players[this.botId].rack) {
        this.botRack = data.players[this.botId].rack;
      }
      
      // Update table sets
      if (data.tableSets) {
        this.tableSets = data.tableSets;
      }
      
      // Check if it's bot's turn
      if (data.currentTurn === this.botId && data.status === 'playing') {
        this.takeTurn();
      }
    });
  }

  // Take a turn with random delay based on difficulty
  takeTurn() {
    const delay = Math.floor(
      Math.random() * (this.thinkingTime.max - this.thinkingTime.min) + this.thinkingTime.min
    );
    
    setTimeout(() => {
      if (this.gameState.currentTurn !== this.botId) return; // Double-check it's still bot's turn
      
      // Check if bot has made initial meld
      const hasInitialMeld = this.gameState.players[this.botId].hasInitialMeld;
      
      if (!hasInitialMeld) {
        this.makeInitialMeld();
      } else {
        // Regular turn
        this.makeRegularMove();
      }
    }, delay);
  }

  // Make initial meld (30+ points)
  makeInitialMeld() {
    // Find best possible initial meld
    const possibleSets = this.findAllPossibleSets();
    
    // Filter sets that have 30+ points
    const validInitialSets = possibleSets.filter(set => this.calculatePoints(set) >= 30);
    
    if (validInitialSets.length > 0) {
      // Choose the best set based on difficulty
      let chosenSet;
      
      if (this.difficultyLevel === 'easy') {
        // Easy: Choose randomly from valid sets
        chosenSet = validInitialSets[Math.floor(Math.random() * validInitialSets.length)];
      } else if (this.difficultyLevel === 'medium') {
        // Medium: Choose set with points closest to 30
        chosenSet = validInitialSets.reduce((best, current) => {
          const bestPoints = this.calculatePoints(best);
          const currentPoints = this.calculatePoints(current);
          return Math.abs(currentPoints - 30) < Math.abs(bestPoints - 30) ? current : best;
        });
      } else {
        // Hard: Choose set with highest points
        chosenSet = validInitialSets.reduce((best, current) => {
          return this.calculatePoints(current) > this.calculatePoints(best) ? current : best;
        });
      }
      
      // Play the chosen set
      this.playSet(chosenSet);
    } else {
      // No valid initial meld, draw a tile
      this.drawTile();
    }
  }

  // Make a regular move
  makeRegularMove() {
    // Try to play tiles first based on difficulty strategy
    const shouldTryToPlay = Math.random() < this.getPlayProbability();
    
    if (shouldTryToPlay) {
      // Try to play tiles
      const possibleSets = this.findAllPossibleSets();
      
      if (possibleSets.length > 0) {
        // Choose set based on difficulty
        let chosenSet;
        
        if (this.difficultyLevel === 'easy') {
          // Easy: Choose randomly
          chosenSet = possibleSets[Math.floor(Math.random() * possibleSets.length)];
        } else if (this.difficultyLevel === 'medium') {
          // Medium: Prefer sets with more tiles
          possibleSets.sort((a, b) => b.length - a.length);
          chosenSet = possibleSets[0];
        } else {
          // Hard: Choose strategically to empty rack fastest
          // Prioritize sets that use tiles that aren't useful in other potential sets
          const tileUsageCount = this.countTileUsage(possibleSets);
          
          chosenSet = possibleSets.reduce((best, current) => {
            const bestScore = this.calculateSetStrategicValue(best, tileUsageCount);
            const currentScore = this.calculateSetStrategicValue(current, tileUsageCount);
            return currentScore > bestScore ? current : best;
          });
        }
        
        // Play the chosen set
        this.playSet(chosenSet);
        return;
      }
      
      // Try to add to existing sets
      const addableTiles = this.findTilesToAddToExistingSets();
      
      if (addableTiles.length > 0) {
        // Choose which tiles to add based on difficulty
        let chosenAddition;
        
        if (this.difficultyLevel === 'easy') {
          // Easy: Choose randomly
          chosenAddition = addableTiles[Math.floor(Math.random() * addableTiles.length)];
        } else {
          // Medium/Hard: Choose the one that adds the most tiles
          addableTiles.sort((a, b) => b.tiles.length - a.tiles.length);
          chosenAddition = addableTiles[0];
        }
        
        // Add tiles to the set
        this.addToSet(chosenAddition.tiles, chosenAddition.setIndex);
        return;
      }
      
      // Try manipulation if hard difficulty
      if (this.difficultyLevel === 'hard') {
        const manipulationPlan = this.findPossibleManipulation();
        
        if (manipulationPlan) {
          this.manipulateSets(manipulationPlan);
          return;
        }
      }
    }
    
    // If no plays were made or decided not to play, draw a tile
    this.drawTile();
  }

  // Get probability of trying to play tiles vs drawing based on difficulty
  getPlayProbability() {
    switch (this.difficultyLevel) {
      case 'easy':
        return 0.6; // 60% chance to try to play
      case 'medium':
        return 0.8; // 80% chance to try to play
      case 'hard':
        return 0.95; // 95% chance to try to play
      default:
        return 0.7;
    }
  }

  // Find all possible valid sets from bot's rack
  findAllPossibleSets() {
    const possibleSets = [];
    
    // Find groups (same number, different colors)
    const numberGroups = {};
    
    this.botRack.forEach(tile => {
      if (!tile.isJoker) {
        if (!numberGroups[tile.number]) {
          numberGroups[tile.number] = [];
        }
        numberGroups[tile.number].push(tile);
      }
    });
    
    // Add jokers to potential groups
    const jokers = this.botRack.filter(tile => tile.isJoker);
    
    // Check for valid groups (3+ tiles of same number)
    Object.values(numberGroups).forEach(group => {
      if (group.length >= 3) {
        // Valid group without jokers
        possibleSets.push([...group]);
      } else if (group.length === 2 && jokers.length > 0) {
        // Can form a group with one joker
        possibleSets.push([...group, jokers[0]]);
      } else if (group.length === 1 && jokers.length >= 2) {
        // Can form a group with two jokers
        possibleSets.push([group[0], jokers[0], jokers[1]]);
      }
    });
    
    // Find runs (consecutive numbers, same color)
    const colorGroups = {};
    
    this.botRack.forEach(tile => {
      if (!tile.isJoker) {
        if (!colorGroups[tile.color]) {
          colorGroups[tile.color] = [];
        }
        colorGroups[tile.color].push(tile);
      }
    });
    
    // Check for valid runs in each color
    Object.values(colorGroups).forEach(colorGroup => {
      // Sort by number
      colorGroup.sort((a, b) => a.number - b.number);
      
      // Find all possible runs of 3+ tiles
      for (let i = 0; i < colorGroup.length - 2; i++) {
        for (let j = i + 2; j < colorGroup.length; j++) {
          const potentialRun = colorGroup.slice(i, j + 1);
          
          // Check if it's a valid run or can be made valid with jokers
          const isValid = this.isValidRunWithJokers(potentialRun, jokers);
          
          if (isValid) {
            possibleSets.push(isValid);
          }
        }
      }
    });
    
    return possibleSets;
  }

  // Check if tiles can form a valid run, potentially with jokers
  isValidRunWithJokers(tiles, availableJokers) {
    if (tiles.length < 3) return false;
    
    // Sort by number
    tiles.sort((a, b) => a.number - b.number);
    
    // Count gaps
    let gapsNeeded = 0;
    for (let i = 1; i < tiles.length; i++) {
      const gap = tiles[i].number - tiles[i-1].number - 1;
      if (gap > 0) gapsNeeded += gap;
    }
    
    if (gapsNeeded === 0) {
      // Already a valid run
      return tiles;
    } else if (gapsNeeded <= availableJokers.length) {
      // Can form a valid run with jokers
      const result = [...tiles];
      let jokersUsed = 0;
      
      // Insert jokers where needed
      for (let i = 1; i < tiles.length; i++) {
        const gap = tiles[i].number - tiles[i-1].number - 1;
        
        for (let j = 0; j < gap && jokersUsed < availableJokers.length; j++) {
          result.splice(i + jokersUsed, 0, availableJokers[jokersUsed]);
          jokersUsed++;
        }
      }
      
      return result;
    }
    
    return false;
  }

  // Find tiles that can be added to existing sets on the table
  findTilesToAddToExistingSets() {
    const addableTiles = [];
    
    this.tableSets.forEach((set, setIndex) => {
      // Check if it's a group or run
      const isGroup = set.every(tile => !tile.isJoker && tile.number === set[0].number) ||
                     (set.filter(tile => !tile.isJoker).every(tile => 
                       tile.number === set.filter(tile => !tile.isJoker)[0].number));
      
      if (isGroup) {
        // It's a group, can add tiles of same number but different color
        const groupNumber = set.find(tile => !tile.isJoker).number;
        const existingColors = new Set(set.filter(tile => !tile.isJoker).map(tile => tile.color));
        
        const addableTilesForGroup = this.botRack.filter(tile => 
          !tile.isJoker && 
          tile.number === groupNumber && 
          !existingColors.has(tile.color)
        );
        
        if (addableTilesForGroup.length > 0) {
          addableTiles.push({
            setIndex,
            tiles: addableTilesForGroup
          });
        }
      } else {
        // It's a run, can add consecutive numbers of same color
        const runColor = set.find(tile => !tile.isJoker).color;
        const numbers = set.filter(tile => !tile.isJoker).map(tile => tile.number).sort((a, b) => a - b);
        const lowestNumber = numbers[0];
        const highestNumber = numbers[numbers.length - 1];
        
        // Check for tiles that can be added to beginning or end of run
        const addableTilesForRun = this.botRack.filter(tile => 
          !tile.isJoker && 
          tile.color === runColor && 
          (tile.number === lowestNumber - 1 || tile.number === highestNumber + 1)
        );
        
        if (addableTilesForRun.length > 0) {
          addableTiles.push({
            setIndex,
            tiles: addableTilesForRun
          });
        }
      }
    });
    
    return addableTiles;
  }

  // Find possible manipulations (for hard difficulty)
  findPossibleManipulation() {
    // This is a simplified version - a real implementation would be more complex
    // and would consider many possible manipulations
    
    // For now, just try to use jokers more efficiently
    const jokerSets = this.tableSets.filter(set => 
      set.some(tile => tile.isJoker)
    );
    
    for (const set of jokerSets) {
      const jokerIndex = set.findIndex(tile => tile.isJoker);
      if (jokerIndex === -1) continue;
      
      const joker = set[jokerIndex];
      
      // Determine what the joker represents
      let replacementValue;
      
      if (set.every(tile => !tile.isJoker || tile === joker)) {
        // It's a group, joker represents a number with a missing color
        const groupNumber = set.find(tile => !tile.isJoker).number;
        const existingColors = new Set(set.filter(tile => !tile.isJoker).map(tile => tile.color));
        const missingColors = ['red', 'blue', 'yellow', 'black'].filter(color => !existingColors.has(color));
        
        // Check if bot has a tile that can replace the joker
        for (const color of missingColors) {
          const replacementTile = this.botRack.find(tile => 
            !tile.isJoker && tile.number === groupNumber && tile.color === color
          );
          
          if (replacementTile) {
            // Found a replacement, can retrieve joker
            return {
              type: 'retrieveJoker',
              setIndex: this.tableSets.indexOf(set),
              jokerIndex,
              replacementTile
            };
          }
        }
      } else {
        // It's a run, joker represents a specific number in the sequence
        const runColor = set.find(tile => !tile.isJoker).color;
        const numbers = set.filter(tile => !tile.isJoker).map(tile => tile.number).sort((a, b) => a - b);
        
        // Find the missing number that joker represents
        let jokerNumber;
        
        if (jokerIndex === 0) {
          jokerNumber = numbers[0] - 1;
        } else if (jokerIndex === set.length - 1) {
          jokerNumber = numbers[numbers.length - 1] + 1;
        } else {
          // Joker is in the middle, find the gap
          for (let i = 0; i < numbers.length - 1; i++) {
            if (numbers[i+1] - numbers[i] > 1) {
              jokerNumber = numbers[i] + 1;
              break;
            }
          }
        }
        
        if (jokerNumber) {
          const replacementTile = this.botRack.find(tile => 
            !tile.isJoker && tile.number === jokerNumber && tile.color === runColor
          );
          
          if (replacementTile) {
            // Found a replacement, can retrieve joker
            return {
              type: 'retrieveJoker',
              setIndex: this.tableSets.indexOf(set),
              jokerIndex,
              replacementTile
            };
          }
        }
      }
    }
    
    return null;
  }

  // Count how many potential sets each tile could be part of
  countTileUsage(possibleSets) {
    const tileUsage = {};
    
    this.botRack.forEach(tile => {
      tileUsage[tile.id] = 0;
    });
    
    possibleSets.forEach(set => {
      set.forEach(tile => {
        if (tileUsage[tile.id] !== undefined) {
          tileUsage[tile.id]++;
        }
      });
    });
    
    return tileUsage;
  }

  // Calculate strategic value of a set based on tile usage
  calculateSetStrategicValue(set, tileUsage) {
    // Prioritize sets that use tiles that aren't useful elsewhere
    return set.reduce((score, tile) => {
      // If tile is only useful in this set, it's more valuable to play it
      const usageScore = tileUsage[tile.id] === 1 ? 3 : 1;
      return score + usageScore;
    }, 0);
  }

  // Calculate points in a set
  calculatePoints(tiles) {
    return tiles.reduce((sum, tile) => {
      if (tile.isJoker) {
        // For initial meld calculation, assume joker is worth 10 points
        return sum + 10;
      }
      return sum + tile.number;
    }, 0);
  }

  // Play a set to the table
  playSet(tiles) {
    const gameRef = ref(this.database, `games/${this.gameId}`);
    
    // Get current game state to ensure it's still bot's turn
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || data.currentTurn !== this.botId) return;
      
      const currentRack = data.players[this.botId].rack || [];
      const currentTableSets = data.tableSets || [];
      
      // Add new set to table
      const newTableSets = [...currentTableSets, tiles];
      
      // Remove played tiles from rack
      const newRack = currentRack.filter(rackTile => 
        !tiles.some(playedTile => playedTile.id === rackTile.id)
      );
      
      // Determine next player
      const playerIds = Object.keys(data.players);
      const currentPlayerIndex = playerIds.indexOf(this.botId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
      const nextPlayerId = playerIds[nextPlayerIndex];
      
      // Update game state
      update(gameRef, {
        tableSets: newTableSets,
        [`players/${this.botId}/rack`]: newRack,
        [`players/${this.botId}/hasInitialMeld`]: true,
        currentTurn: nextPlayerId,
        lastAction: {
          type: 'play',
          playerId: this.botId,
          timestamp: Date.now()
        }
      });
      
      // Check if bot has emptied their rack
      if (newRack.length === 0) {
        update(gameRef, {
          status: 'completed',
          winner: this.botId,
          endedAt: Date.now()
        });
      }
    }, { onlyOnce: true });
  }

  // Add tiles to an existing set
  addToSet(tiles, setIndex) {
    const gameRef = ref(this.database, `games/${this.gameId}`);
    
    // Get current game state to ensure it's still bot's turn
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || data.currentTurn !== this.botId) return;
      
      const currentRack = data.players[this.botId].rack || [];
      const currentTableSets = data.tableSets || [];
      
      // Add tiles to the target set
      const newTableSets = [...currentTableSets];
      newTableSets[setIndex] = [...newTableSets[setIndex], ...tiles];
      
      // Remove played tiles from rack
      const newRack = currentRack.filter(rackTile => 
        !tiles.some(playedTile => playedTile.id === rackTile.id)
      );
      
      // Determine next player
      const playerIds = Object.keys(data.players);
      const currentPlayerIndex = playerIds.indexOf(this.botId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
      const nextPlayerId = playerIds[nextPlayerIndex];
      
      // Update game state
      update(gameRef, {
        tableSets: newTableSets,
        [`players/${this.botId}/rack`]: newRack,
        currentTurn: nextPlayerId,
        lastAction: {
          type: 'play',
          playerId: this.botId,
          timestamp: Date.now()
        }
      });
      
      // Check if bot has emptied their rack
      if (newRack.length === 0) {
        update(gameRef, {
          status: 'completed',
          winner: this.botId,
          endedAt: Date.now()
        });
      }
    }, { onlyOnce: true });
  }

  // Manipulate sets (for hard difficulty)
  manipulateSets(manipulationPlan) {
    if (manipulationPlan.type === 'retrieveJoker') {
      const gameRef = ref(this.database, `games/${this.gameId}`);
      
      // Get current game state to ensure it's still bot's turn
      onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        if (!data || data.currentTurn !== this.botId) return;
        
        const currentRack = data.players[this.botId].rack || [];
        const currentTableSets = data.tableSets || [];
        
        // Get the set and joker
        const set = currentTableSets[manipulationPlan.setIndex];
        const joker = set[manipulationPlan.jokerIndex];
        
        // Create new set with joker replaced
        const newSet = [...set];
        newSet[manipulationPlan.jokerIndex] = manipulationPlan.replacementTile;
        
        // Update table sets
        const newTableSets = [...currentTableSets];
        newTableSets[manipulationPlan.setIndex] = newSet;
        
        // Remove replacement tile from rack and add joker
        const newRack = currentRack.filter(tile => 
          tile.id !== manipulationPlan.replacementTile.id
        );
        newRack.push(joker);
        
        // Update game state
        update(gameRef, {
          tableSets: newTableSets,
          [`players/${this.botId}/rack`]: newRack,
          lastAction: {
            type: 'retrieveJoker',
            playerId: this.botId,
            timestamp: Date.now()
          }
        });
      }, { onlyOnce: true });
    }
  }

  // Draw a tile from the pool
  drawTile() {
    const gameRef = ref(this.database, `games/${this.gameId}`);
    
    // Get current game state to ensure it's still bot's turn
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || data.currentTurn !== this.botId) return;
      
      const pool = data.pool || [];
      if (pool.length === 0) {
        // No tiles left, end turn
        this.endTurn();
        return;
      }
      
      // Take the first tile from the pool
      const drawnTile = pool[0];
      const newPool = pool.slice(1);
      
      // Add tile to bot's rack
      const botRack = data.players[this.botId].rack || [];
      const newRack = [...botRack, drawnTile];
      
      // Determine next player
      const playerIds = Object.keys(data.players);
      const currentPlayerIndex = playerIds.indexOf(this.botId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
      const nextPlayerId = playerIds[nextPlayerIndex];
      
      // Update game state
      update(gameRef, {
        pool: newPool,
        currentTurn: nextPlayerId,
        [`players/${this.botId}/rack`]: newRack,
        lastAction: {
          type: 'draw',
          playerId: this.botId,
          timestamp: Date.now()
        }
      });
    }, { onlyOnce: true });
  }

  // End turn without drawing (if pool is empty)
  endTurn() {
    const gameRef = ref(this.database, `games/${this.gameId}`);
    
    // Get current game state to ensure it's still bot's turn
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || data.currentTurn !== this.botId) return;
      
      // Determine next player
      const playerIds = Object.keys(data.players);
      const currentPlayerIndex = playerIds.indexOf(this.botId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
      const nextPlayerId = playerIds[nextPlayerIndex];
      
      // Update game state
      update(gameRef, {
        currentTurn: nextPlayerId,
        lastAction: {
          type: 'pass',
          playerId: this.botId,
          timestamp: Date.now()
        }
      });
    }, { onlyOnce: true });
  }
}

export default RummyAIBot;
