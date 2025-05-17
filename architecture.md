# Rummy Tile Game Architecture Design

## Technology Stack

### Frontend
- **Framework**: React.js with TypeScript
- **State Management**: Redux for global state, React Context for local state
- **Styling**: Styled Components with responsive design
- **Animation**: Framer Motion for tile animations
- **Drag and Drop**: react-dnd for tile manipulation
- **Real-time Communication**: Socket.io client for multiplayer features
- **Audio**: Howler.js for sound effects

### Authentication
- **Server**: Node.js with Express
- **Real-time Server**: Socket.io for multiplayer communication
- **Authentication**: Firebase Authentication for email verification and Google Sign-In
- **Database**: Firebase Firestore for game state persistence
- **Hosting**: Firebase Hosting for deploymentmponent Structure

### Frontend Components
1. **App Container**
   - Handles routing and global state
   - Manages authentication state

2. **Authentication Components**
   - Login
   - Registration
   - Email Verification

3. **Lobby Components**
   - Game Creation
   - Game Joining (with code)
   - Waiting Room

4. **Game Components**
   - Game Board
   - Player Rack
   - Tile Component
   - Set Component (Run/Group)
   - Manipulation Area
   - Player Information
   - Chat Interface
   - Game Controls

5. **UI Components**
   - Notifications
   - Modals
   - Buttons
   - Loading Indicators
   - Sound Controls

### Backend Structure
1. **API Routes**
   - Authentication routes
   - Game management routes
   - User profile routes

2. **Socket Events**
   - Game state updates
   - Player actions
   - Chat messages
   - Connection management

3. **Game Logic**
   - Game state management
   - Rule validation
   - AI bot logic
   - Set manipulation validation

## Database Schema

### Users Collection
```
users/{userId}
  - email: string
  - displayName: string
  - createdAt: timestamp
  - lastLogin: timestamp
```

### Games Collection
```
games/{gameId}
  - gameCode: string
  - host: userId
  - status: string (waiting, active, completed)
  - createdAt: timestamp
  - lastUpdatedAt: timestamp
  - players: array of {
      userId: string
      displayName: string
      isConnected: boolean
      isReady: boolean
      isBot: boolean
      botDifficulty?: string
    }
  - settings: {
      maxPlayers: number
      withBots: boolean
    }
  - currentTurn: number (index of player in players array)
  - pool: array of tile objects
  - board: array of set objects
  - winner: userId or null
```

### Game States Collection (for move history)
```
games/{gameId}/states/{stateId}
  - timestamp: timestamp
  - playerAction: string
  - boardState: array of set objects
  - playerRacks: map of userId to array of tile objects
```

### Chat Messages Collection
```
games/{gameId}/messages/{messageId}
  - userId: string
  - displayName: string
  - content: string
  - timestamp: timestamp
```

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/verify-email
- GET /api/auth/user

### Game Management
- POST /api/games/create
- GET /api/games/join/:gameCode
- GET /api/games/:gameId
- PUT /api/games/:gameId/start
- PUT /api/games/:gameId/forfeit

## Socket Events

### Server to Client
- game:state - Send current game state
- game:turn - Notify whose turn it is
- game:manipulation - Send manipulation result
- game:end - Game has ended
- chat:message - New chat message
- player:joined - Player joined the game
- player:left - Player left the game
- player:reconnected - Player reconnected
- error - Error notification

### Client to Server
- game:join - Join a game
- game:ready - Mark player as ready
- game:draw - Draw a tile
- game:play - Play tiles
- game:manipulate - Manipulate sets
- game:end-turn - End current turn
- game:forfeit - Forfeit the game
- chat:send - Send chat message

## UI Wireframes (Conceptual)

### Main Game Screen
- Game board in center (70-80% of screen)
- Player rack at bottom (1-3 rows)
- Player information panels on sides
- Chat panel (collapsible) on right side
- Game controls and options at top

### Tile Design
- 3D appearance with physical thickness
- Vibrant primary colors (red, blue, yellow, black)
- White background
- Numbers with bright primary colors and shadow
- Joker with gradient star

### Manipulation Interface
- Drag and drop tiles between sets
- Visual indicators for valid/invalid moves
- Undo button for reverting changes
- Commit button to finalize moves

## AI Bot Implementation

### Bot Difficulty Levels
1. **Easy**
   - Basic strategy
   - Only makes obvious moves
   - Doesn't optimize manipulation
   - Occasionally makes suboptimal plays

2. **Medium**
   - Improved strategy
   - Recognizes most manipulation opportunities
   - Prioritizes reducing hand size
   - Rarely makes mistakes

3. **Hard**
   - Advanced strategy
   - Maximizes manipulation opportunities
   - Plans moves ahead
   - Prioritizes blocking other players when possible
   - Makes optimal plays

### Bot Decision Making Process
1. Analyze current board state
2. Identify possible moves
3. Evaluate move values based on difficulty level
4. Select and execute move
5. Implement delays to simulate human thinking

## Game Flow

1. User creates account with email verification
2. User creates game or joins with code
3. Waiting room until host starts game
4. Game setup (tiles distributed)
5. Players take turns (draw or play)
6. Game ends when a player empties rack or no more moves possible
7. Results displayed
8. Option to play again or return to lobby
