# Rummy Tile Game Website Requirements

## Game Components
- **Tiles**: 106 tiles total
  - 8 sets of tiles 1-13 in four colors (red, blue, yellow, and black all with a white background)
  - 2 joker tiles with a white star and gradient background of all the other colors
- **Players**: 2-4 players

## Game Rules

### Object of The Game
- Be the first player to play all tiles from your rack by forming them into sets (runs and/or groups)

### Sets
- **Group**: A set of either three or four tiles of the same number in different colors
- **Run**: A set of three or more consecutive numbers all in the same color
- **Number 1 Rule**: The number 1 is played as the lowest or highest number
  - It may follow the number 13
  - If it follows 13, it cannot be followed by a 2, 3, 4, etc.

### Game Setup
- Each player starts with 14 random tiles hidden from other players (their "hand")
- Remaining tiles are called the "pool"

### Playing The Game
- Each tile is worth its face value
- Initial meld requirements:
  - Must place tiles on the table in one or more sets that total at least 30 points
  - Points must come from tiles on each player's rack
  - Cannot use tiles already played on the table for initial meld
  - Joker used in initial meld scores the value of the tile it represents
- Turn mechanics:
  - When players cannot play any tiles or choose not to, they must draw a single tile from the pool
  - Turn ends when player either draws or adds at least 1 tile to the table
  - For initial turn, tiles must add up to at least 30
  - Play passes to the next player
- Subsequent turns:
  - Player can build onto other sets on the table with tiles from their rack
  - If unable to add to another set or play a set, player picks a tile from the pool
  - Players cannot lay down a tile they just drew (must wait until next turn)
- Game end conditions:
  - One player empties their rack
  - If pool is empty but no player has emptied their rack, play continues until no more plays can be made
  - Winner has the least amount of tiles at this point

### Manipulation
- Players can rearrange or add to sets already on the table
- Sets can be manipulated in many ways as long as only legitimate sets remain at the end of each round
- No loose tiles can be left over
- Manipulation techniques:
  1. Add one or more tiles from rack to make new set
  2. Remove a fourth tile from a group and use it to form a new set
  3. Add a fourth tile to a set and remove one tile from it to make another set
  4. Splitting a run
  5. Combined split
  6. Multiple split

### The Joker
- Two jokers in the game
- Each joker can be used as any tile in a set
- Number and color are equivalent to the tile needed to complete the set
- Joker retrieval:
  - Can be retrieved from a set by a player who can replace it during their turn
  - Replacement tile can come from table or player's rack
  - In a group of three tiles, joker can be replaced by a tile of either missing color
  - Retrieved joker will have any value or color
  - Player must play the joker on their current turn to make a new set
  - Must also use at least one tile from their rack on that turn
  - Cannot retrieve a joker before playing initial meld
- Four ways to clear the joker:
  1. Replace joker in a group with tiles from rack
  2. Split a run and clear the joker
  3. Add a tile and clear the joker
  4. Split a run by moving tiles to groups and free the joker

## Technical Requirements

### Private Game Codes
- Host can decide to use randomly generated code or specify their own
- Minimum 4 characters
- Must ensure all codes are unique

### Game Visibility
- Players can see how many tiles other players have in their racks

### Tile Manipulation
- No time limit for manipulating tiles
- Other players should not see manipulation in real-time, only at the end of each turn
- Must include an 'undo' feature if manipulation results in invalid sets

### Game State
- Game must save progress if a player disconnects
- Indefinitely save games with a disconnected player
- Save every move
- Must include a chat feature for players to communicate
- Keep chat history for the entire game

### UI/UX Requirements
- Drag-and-drop interface for tile manipulation
- Visual indicators for valid/invalid sets
- Animations for tile movements
- No timer for turns
- Sound effects for tile movements and valid/invalid sets
- Haptic feedback for mobile devices
- Light gray shadow outlining the numbers on the tiles
- Indicate whose turn it is
- Rack should be 1-3 rows along the bottom of the board

### Game Flow
- Ready-check before starting the game
- Surrender/forfeit option
- Anyone opening a new game or joining a hosted game must enter a screen name
- Include single player AI bots with different difficulty levels (Easy, Medium, Hard)
- Make it possible to create a game with only the host
- Create a waiting room until at least one other participant joins and the host starts the game
- Do not require more than just the host to open the waiting room
- Require 2+ players to start a game from the waiting room

### Visual Design
- Vibrant primary colors for the 4 colors (red, blue, yellow, and black)
- 3D appearance for tiles with physical thickness
- Joker tiles: same background as others with the star a gradient of all game colors
- Classic tabletop look for the game interface
- Number colors should be primary and bright with a shadow for clarity

### Authentication
- Require a verified email-based account to play
- Include Google Sign-In as an authentication option

### Multiplayer
- Must be able to hold live multiplayer games
- No spectating of ongoing games

## Development Requirements
- Push all code to GitHub repository: https://github.com/ilana16/Rummy2.0.git
