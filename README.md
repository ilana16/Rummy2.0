# Rummy Tile Game

A multiplayer online Rummy tile game with real-time gameplay, private game codes, and AI opponents.

## Features

- **Multiplayer Gameplay**: Play with 2-4 players in real-time
- **Private Game Codes**: Create private games with custom codes
- **Authentication**: Email verification and Google Sign-In
- **AI Opponents**: Three difficulty levels (Easy, Medium, Hard)
- **Game Options**: Customize gameplay settings
- **Chat System**: In-game chat with other players
- **Responsive Design**: Works on desktop and mobile devices
- **Game State Persistence**: Games are saved automatically

## Game Rules

The game follows standard Rummikub rules:
- 106 tiles (8 sets of 1-13 in four colors, plus 2 jokers)
- Initial meld requires 30+ points
- Form runs (consecutive numbers in same color) or groups (same number in different colors)
- Manipulate existing sets on the board
- First player to empty their rack wins

## Technology Stack

- **Frontend**: React with TypeScript
- **State Management**: Redux and React Context
- **Styling**: Styled Components
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
```
git clone https://github.com/ilana16/Rummy2.0.git
cd Rummy2.0
```

2. Install dependencies
```
npm install
```

3. Set up Firebase
   - Create a Firebase project
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Update the Firebase configuration in `src/firebase.ts`

4. Start the development server
```
npm start
```

## Deployment

The game can be deployed to Firebase Hosting:

1. Install Firebase CLI
```
npm install -g firebase-tools
```

2. Login to Firebase
```
firebase login
```

3. Initialize Firebase
```
firebase init
```

4. Build the project
```
npm run build
```

5. Deploy to Firebase
```
firebase deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
