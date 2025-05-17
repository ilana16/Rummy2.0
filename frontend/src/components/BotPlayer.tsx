import React from 'react';
import styled from 'styled-components';
import { Tile as TileType } from '../utils/gameLogic';

// AI Bot difficulty levels and strategies
export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface BotStrategy {
  evaluateMove: (board: any[], playerRack: TileType[], pool: TileType[]) => {
    action: 'play' | 'draw';
    tiles?: TileType[];
    targetSet?: string;
  };
  handleManipulation: (board: any[], playerRack: TileType[]) => any[];
  calculateMoveDelay: () => number;
}

// Easy Bot Strategy
export const easyBotStrategy: BotStrategy = {
  evaluateMove: (board, playerRack, pool) => {
    // Simple strategy: Try to play any valid set, or draw
    // Look for groups first (easier to identify)
    const numbers = new Map<number, TileType[]>();
    
    // Group tiles by number
    playerRack.forEach(tile => {
      if (!numbers.has(tile.value)) {
        numbers.set(tile.value, []);
      }
      numbers.get(tile.value)?.push(tile);
    });
    
    // Find groups of 3 or 4 tiles with the same number
    for (const [number, tiles] of numbers.entries()) {
      if (tiles.length >= 3) {
        // Check if they have different colors
        const colors = new Set(tiles.map(t => t.color));
        if (colors.size >= 3) {
          // Found a valid group
          return {
            action: 'play',
            tiles: tiles.slice(0, 3) // Just use 3 tiles for simplicity
          };
        }
      }
    }
    
    // If no groups found, look for runs (more complex, simplified for easy bot)
    // Easy bot only looks for obvious runs
    const colorGroups = new Map<string, TileType[]>();
    
    // Group tiles by color
    playerRack.forEach(tile => {
      if (!colorGroups.has(tile.color)) {
        colorGroups.set(tile.color, []);
      }
      colorGroups.get(tile.color)?.push(tile);
    });
    
    // Find runs in each color
    for (const [color, tiles] of colorGroups.entries()) {
      if (tiles.length >= 3) {
        // Sort by value
        const sorted = [...tiles].sort((a, b) => a.value - b.value);
        
        // Look for consecutive numbers
        for (let i = 0; i <= sorted.length - 3; i++) {
          if (
            sorted[i+1].value === sorted[i].value + 1 &&
            sorted[i+2].value === sorted[i].value + 2
          ) {
            // Found a valid run
            return {
              action: 'play',
              tiles: [sorted[i], sorted[i+1], sorted[i+2]]
            };
          }
        }
      }
    }
    
    // If no valid sets found, draw a tile
    return { action: 'draw' };
  },
  
  handleManipulation: (board, playerRack) => {
    // Easy bot doesn't do complex manipulations
    return board;
  },
  
  calculateMoveDelay: () => {
    // Easy bot takes 1-3 seconds to make a move
    return 1000 + Math.random() * 2000;
  }
};

// Medium Bot Strategy
export const mediumBotStrategy: BotStrategy = {
  evaluateMove: (board, playerRack, pool) => {
    // Medium bot has more sophisticated strategy
    // First, check if we can add to existing sets on the board
    if (board.length > 0) {
      for (const set of board) {
        for (const tile of playerRack) {
          // Check if tile can be added to this set
          if (set.type === 'group' && set.tiles.length < 4) {
            // For groups, check if tile has same value but different color
            const sameValue = set.tiles[0].value === tile.value;
            const colorExists = set.tiles.some(t => t.color === tile.color);
            
            if (sameValue && !colorExists) {
              return {
                action: 'play',
                tiles: [tile],
                targetSet: set.id
              };
            }
          } else if (set.type === 'run') {
            // For runs, check if tile can extend the run
            const sortedTiles = [...set.tiles].sort((a, b) => a.value - b.value);
            const firstTile = sortedTiles[0];
            const lastTile = sortedTiles[sortedTiles.length - 1];
            
            // Check if tile can be added to beginning or end of run
            if (
              tile.color === firstTile.color && 
              (tile.value === firstTile.value - 1 || tile.value === lastTile.value + 1)
            ) {
              return {
                action: 'play',
                tiles: [tile],
                targetSet: set.id
              };
            }
          }
        }
      }
    }
    
    // If can't add to existing sets, try to form new sets
    // Similar to easy bot but more thorough
    
    // Look for groups
    const numberGroups = new Map<number, TileType[]>();
    playerRack.forEach(tile => {
      if (!numberGroups.has(tile.value)) {
        numberGroups.set(tile.value, []);
      }
      numberGroups.get(tile.value)?.push(tile);
    });
    
    // Find the best group (prefer 4 tiles over 3)
    let bestGroup: TileType[] | null = null;
    
    for (const [_, tiles] of numberGroups.entries()) {
      const uniqueColors = new Set(tiles.map(t => t.color));
      if (uniqueColors.size >= 3) {
        const validGroup = [];
        const usedColors = new Set<string>();
        
        for (const tile of tiles) {
          if (!usedColors.has(tile.color)) {
            validGroup.push(tile);
            usedColors.add(tile.color);
            if (validGroup.length === 4) break;
          }
        }
        
        if (validGroup.length >= 3 && (!bestGroup || validGroup.length > bestGroup.length)) {
          bestGroup = validGroup;
        }
      }
    }
    
    if (bestGroup) {
      return {
        action: 'play',
        tiles: bestGroup
      };
    }
    
    // Look for runs
    const colorGroups = new Map<string, TileType[]>();
    playerRack.forEach(tile => {
      if (!colorGroups.has(tile.color)) {
        colorGroups.set(tile.color, []);
      }
      colorGroups.get(tile.color)?.push(tile);
    });
    
    let bestRun: TileType[] | null = null;
    
    for (const [_, tiles] of colorGroups.entries()) {
      if (tiles.length >= 3) {
        // Sort by value
        const sorted = [...tiles].sort((a, b) => a.value - b.value);
        
        // Find the longest run
        for (let i = 0; i < sorted.length; i++) {
          let currentRun = [sorted[i]];
          
          for (let j = i + 1; j < sorted.length; j++) {
            if (sorted[j].value === currentRun[currentRun.length - 1].value + 1) {
              currentRun.push(sorted[j]);
            }
          }
          
          if (currentRun.length >= 3 && (!bestRun || currentRun.length > bestRun.length)) {
            bestRun = currentRun;
          }
        }
      }
    }
    
    if (bestRun) {
      return {
        action: 'play',
        tiles: bestRun
      };
    }
    
    // If no valid sets found, draw a tile
    return { action: 'draw' };
  },
  
  handleManipulation: (board, playerRack) => {
    // Medium bot attempts basic manipulations
    // This is a simplified version - real implementation would be more complex
    
    // Try to add tiles to existing sets
    const newBoard = [...board];
    let madeChanges = false;
    
    for (let i = 0; i < newBoard.length; i++) {
      const set = newBoard[i];
      
      for (let j = 0; j < playerRack.length; j++) {
        const tile = playerRack[j];
        
        // Check if tile can be added to this set
        if (set.type === 'group' && set.tiles.length < 4) {
          // For groups, check if tile has same value but different color
          const sameValue = set.tiles[0].value === tile.value;
          const colorExists = set.tiles.some(t => t.color === tile.color);
          
          if (sameValue && !colorExists) {
            // Add tile to group
            set.tiles.push(tile);
            playerRack.splice(j, 1);
            madeChanges = true;
            break;
          }
        } else if (set.type === 'run') {
          // For runs, check if tile can extend the run
          const sortedTiles = [...set.tiles].sort((a, b) => a.value - b.value);
          const firstTile = sortedTiles[0];
          const lastTile = sortedTiles[sortedTiles.length - 1];
          
          // Check if tile can be added to beginning or end of run
          if (tile.color === firstTile.color) {
            if (tile.value === firstTile.value - 1) {
              // Add to beginning
              set.tiles.push(tile);
              playerRack.splice(j, 1);
              madeChanges = true;
              break;
            } else if (tile.value === lastTile.value + 1) {
              // Add to end
              set.tiles.push(tile);
              playerRack.splice(j, 1);
              madeChanges = true;
              break;
            }
          }
        }
      }
      
      if (madeChanges) break;
    }
    
    return newBoard;
  },
  
  calculateMoveDelay: () => {
    // Medium bot takes 1-2 seconds to make a move
    return 1000 + Math.random() * 1000;
  }
};

// Hard Bot Strategy
export const hardBotStrategy: BotStrategy = {
  evaluateMove: (board, playerRack, pool) => {
    // Hard bot has advanced strategy
    // First, try to play tiles that will empty the rack fastest
    
    // Check if we can add to existing sets on the board
    if (board.length > 0) {
      // Similar to medium bot but prioritizes moves that lead to emptying rack
      // This is a simplified version - real implementation would be more complex
    }
    
    // Try to form optimal new sets
    // Prioritize using high-value tiles first
    
    // Look for groups
    const numberGroups = new Map<number, TileType[]>();
    playerRack.forEach(tile => {
      if (!numberGroups.has(tile.value)) {
        numberGroups.set(tile.value, []);
      }
      numberGroups.get(tile.value)?.push(tile);
    });
    
    // Find the best group (prefer high values and 4 tiles)
    let bestGroup: TileType[] | null = null;
    let bestGroupValue = 0;
    
    for (const [number, tiles] of numberGroups.entries()) {
      const uniqueColors = new Set(tiles.map(t => t.color));
      if (uniqueColors.size >= 3) {
        const validGroup = [];
        const usedColors = new Set<string>();
        
        for (const tile of tiles) {
          if (!usedColors.has(tile.color)) {
            validGroup.push(tile);
            usedColors.add(tile.color);
            if (validGroup.length === 4) break;
          }
        }
        
        if (validGroup.length >= 3) {
          const groupValue = validGroup.length * number; // Value based on size and number
          if (!bestGroup || groupValue > bestGroupValue) {
            bestGroup = validGroup;
            bestGroupValue = groupValue;
          }
        }
      }
    }
    
    // Look for runs
    const colorGroups = new Map<string, TileType[]>();
    playerRack.forEach(tile => {
      if (!colorGroups.has(tile.color)) {
        colorGroups.set(tile.color, []);
      }
      colorGroups.get(tile.color)?.push(tile);
    });
    
    let bestRun: TileType[] | null = null;
    let bestRunValue = 0;
    
    for (const [_, tiles] of colorGroups.entries()) {
      if (tiles.length >= 3) {
        // Sort by value
        const sorted = [...tiles].sort((a, b) => a.value - b.value);
        
        // Find all possible runs
        for (let i = 0; i < sorted.length; i++) {
          let currentRun = [sorted[i]];
          
          for (let j = i + 1; j < sorted.length; j++) {
            if (sorted[j].value === currentRun[currentRun.length - 1].value + 1) {
              currentRun.push(sorted[j]);
            }
          }
          
          if (currentRun.length >= 3) {
            const runValue = currentRun.reduce((sum, tile) => sum + tile.value, 0);
            if (!bestRun || runValue > bestRunValue || 
                (runValue === bestRunValue && currentRun.length > bestRun.length)) {
              bestRun = currentRun;
              bestRunValue = runValue;
            }
          }
        }
      }
    }
    
    // Choose the better option between best group and best run
    if (bestGroup && bestRun) {
      if (bestGroupValue > bestRunValue) {
        return {
          action: 'play',
          tiles: bestGroup
        };
      } else {
        return {
          action: 'play',
          tiles: bestRun
        };
      }
    } else if (bestGroup) {
      return {
        action: 'play',
        tiles: bestGroup
      };
    } else if (bestRun) {
      return {
        action: 'play',
        tiles: bestRun
      };
    }
    
    // If no valid sets found, draw a tile
    return { action: 'draw' };
  },
  
  handleManipulation: (board, playerRack) => {
    // Hard bot performs complex manipulations
    // This is a simplified version - real implementation would be more complex
    
    // Try various manipulation strategies
    // 1. Add tiles to existing sets
    // 2. Split runs to create new sets
    // 3. Combine tiles from multiple sets
    
    // For now, just return the board unchanged
    return board;
  },
  
  calculateMoveDelay: () => {
    // Hard bot takes 1.5-3 seconds to make a move (simulating "thinking")
    return 1500 + Math.random() * 1500;
  }
};

// Get bot strategy based on difficulty
export const getBotStrategy = (difficulty: BotDifficulty): BotStrategy => {
  switch (difficulty) {
    case 'easy':
      return easyBotStrategy;
    case 'medium':
      return mediumBotStrategy;
    case 'hard':
      return hardBotStrategy;
    default:
      return easyBotStrategy;
  }
};

// Bot player component (visual representation)
const BotPlayerContainer = styled.div<{ difficulty: BotDifficulty }>`
  padding: 10px;
  border-radius: 5px;
  background-color: ${props => {
    switch(props.difficulty) {
      case 'easy': return '#e8f5e9';
      case 'medium': return '#fff3e0';
      case 'hard': return '#ffebee';
      default: return '#f5f5f5';
    }
  }};
  margin-bottom: 10px;
  display: flex;
  align-items: center;
`;

const BotAvatar = styled.div<{ difficulty: BotDifficulty }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => {
    switch(props.difficulty) {
      case 'easy': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      default: return '#9e9e9e';
    }
  }};
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  margin-right: 10px;
`;

const BotInfo = styled.div`
  flex: 1;
`;

const BotName = styled.div`
  font-weight: bold;
`;

const BotStatus = styled.div`
  font-size: 12px;
  color: #757575;
`;

interface BotPlayerProps {
  name: string;
  difficulty: BotDifficulty;
  tileCount: number;
  isCurrentTurn: boolean;
}

export const BotPlayer: React.FC<BotPlayerProps> = ({ 
  name, 
  difficulty, 
  tileCount, 
  isCurrentTurn 
}) => {
  return (
    <BotPlayerContainer difficulty={difficulty}>
      <BotAvatar difficulty={difficulty}>
        {difficulty.charAt(0).toUpperCase()}
      </BotAvatar>
      <BotInfo>
        <BotName>{name}</BotName>
        <BotStatus>
          {isCurrentTurn ? 'Thinking...' : `${tileCount} tiles`}
        </BotStatus>
      </BotInfo>
    </BotPlayerContainer>
  );
};

export default BotPlayer;
