export interface Tile {
  id: string;
  value: number;
  color: 'red' | 'blue' | 'yellow' | 'black';
  isJoker: boolean;
}

export type TileSet = {
  id: string;
  tiles: Tile[];
  type: 'run' | 'group' | 'unassigned';
};

export type Player = {
  id: string;
  name: string;
  isConnected: boolean;
  isReady: boolean;
  isBot: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
};

export type GameState = {
  id: string;
  gameCode: string;
  status: 'waiting' | 'active' | 'completed';
  players: Player[];
  currentTurn: number;
  board: TileSet[];
  pool: Tile[];
  playerRacks: Record<string, Tile[]>;
  winner: string | null;
  initialMeldComplete: Record<string, boolean>;
};

export const COLORS = ['red', 'blue', 'yellow', 'black'] as const;
export const VALUES = Array.from({ length: 13 }, (_, i) => i + 1);

export const createNewTileDeck = (): Tile[] => {
  const tiles: Tile[] = [];
  
  // Create 8 sets of tiles (2 sets of each color)
  for (let set = 0; set < 2; set++) {
    for (const color of COLORS) {
      for (const value of VALUES) {
        tiles.push({
          id: `${color}-${value}-${set}`,
          value,
          color: color as 'red' | 'blue' | 'yellow' | 'black',
          isJoker: false
        });
      }
    }
  }
  
  // Add 2 joker tiles
  tiles.push({
    id: 'joker-1',
    value: 0,
    color: 'red', // Doesn't matter for jokers
    isJoker: true
  });
  
  tiles.push({
    id: 'joker-2',
    value: 0,
    color: 'red', // Doesn't matter for jokers
    isJoker: true
  });
  
  return tiles;
};

export const shuffleTiles = (tiles: Tile[]): Tile[] => {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealTiles = (tiles: Tile[], playerCount: number): { playerRacks: Record<string, Tile[]>, pool: Tile[] } => {
  const shuffled = shuffleTiles(tiles);
  const playerRacks: Record<string, Tile[]> = {};
  
  for (let i = 0; i < playerCount; i++) {
    playerRacks[`player-${i}`] = shuffled.slice(i * 14, (i + 1) * 14);
  }
  
  const pool = shuffled.slice(playerCount * 14);
  
  return { playerRacks, pool };
};

export const isValidRun = (tiles: Tile[]): boolean => {
  if (tiles.length < 3) return false;
  
  // All tiles must be the same color (except jokers)
  const nonJokerTiles = tiles.filter(tile => !tile.isJoker);
  const colors = new Set(nonJokerTiles.map(tile => tile.color));
  if (colors.size > 1) return false;
  
  // Sort tiles by value
  const sortedTiles = [...tiles].sort((a, b) => {
    if (a.isJoker) return 1;
    if (b.isJoker) return -1;
    return a.value - b.value;
  });
  
  // Check if values are consecutive
  let jokerCount = tiles.filter(tile => tile.isJoker).length;
  let gapsToFill = 0;
  
  for (let i = 1; i < nonJokerTiles.length; i++) {
    const gap = nonJokerTiles[i].value - nonJokerTiles[i-1].value - 1;
    if (gap < 0) return false; // Not in ascending order
    gapsToFill += gap;
  }
  
  return gapsToFill <= jokerCount;
};

export const isValidGroup = (tiles: Tile[]): boolean => {
  if (tiles.length < 3 || tiles.length > 4) return false;
  
  // All tiles must have the same value (except jokers)
  const nonJokerTiles = tiles.filter(tile => !tile.isJoker);
  const values = new Set(nonJokerTiles.map(tile => tile.value));
  if (values.size > 1) return false;
  
  // All tiles must have different colors
  const colors = new Set(nonJokerTiles.map(tile => tile.color));
  if (colors.size !== nonJokerTiles.length) return false;
  
  return true;
};

export const isValidSet = (tiles: Tile[]): { valid: boolean, type: 'run' | 'group' | null } => {
  if (isValidRun(tiles)) return { valid: true, type: 'run' };
  if (isValidGroup(tiles)) return { valid: true, type: 'group' };
  return { valid: false, type: null };
};

export const calculateSetPoints = (tiles: Tile[]): number => {
  return tiles.reduce((sum, tile) => {
    if (tile.isJoker) {
      // For jokers, we need to determine what value they represent
      // This is a simplification - in a real game, we'd need more context
      return sum + 0;
    }
    return sum + tile.value;
  }, 0);
};

export const canMakeInitialMeld = (sets: TileSet[]): boolean => {
  const totalPoints = sets.reduce((sum, set) => {
    return sum + calculateSetPoints(set.tiles);
  }, 0);
  
  return totalPoints >= 30;
};

export const validateManipulation = (
  originalBoard: TileSet[],
  newBoard: TileSet[],
  playerRack: Tile[]
): boolean => {
  // This is a simplified validation
  // In a real implementation, we would need to track which tiles came from the rack
  // and ensure all original tiles are accounted for
  
  // Check that all sets on the new board are valid
  for (const set of newBoard) {
    const { valid } = isValidSet(set.tiles);
    if (!valid) return false;
  }
  
  return true;
};
