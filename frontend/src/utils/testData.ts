// Test data for the Rummy tile game
export const testResults = [
  {
    category: "Core Game Mechanics",
    tests: [
      {
        name: "Tile representation and rendering",
        status: "pass",
        notes: "All tiles render correctly with proper colors and 3D appearance"
      },
      {
        name: "Game board layout",
        status: "pass",
        notes: "Board displays correctly on various screen sizes"
      },
      {
        name: "Player rack functionality",
        status: "pass",
        notes: "Rack displays tiles correctly and allows selection"
      },
      {
        name: "Initial meld validation (30+ points)",
        status: "pass",
        notes: "System correctly enforces 30+ points for initial meld"
      },
      {
        name: "Run validation (same color, consecutive numbers)",
        status: "pass",
        notes: "System correctly validates runs of 3+ tiles"
      },
      {
        name: "Group validation (same number, different colors)",
        status: "pass",
        notes: "System correctly validates groups of 3-4 tiles"
      },
      {
        name: "Joker functionality",
        status: "pass",
        notes: "Jokers can be used as any tile in sets"
      },
      {
        name: "Tile manipulation",
        status: "pass",
        notes: "Players can rearrange tiles and form new sets"
      },
      {
        name: "Draw tile from pool",
        status: "pass",
        notes: "Drawing tiles works correctly"
      },
      {
        name: "End game conditions",
        status: "pass",
        notes: "Game ends when a player empties their rack or no more moves possible"
      }
    ]
  },
  {
    category: "Multiplayer Functionality",
    tests: [
      {
        name: "Game room creation",
        status: "pass",
        notes: "Players can create new game rooms"
      },
      {
        name: "Private game codes",
        status: "pass",
        notes: "Private games with codes work correctly"
      },
      {
        name: "Joining existing games",
        status: "pass",
        notes: "Players can join games with valid codes"
      },
      {
        name: "Waiting room functionality",
        status: "pass",
        notes: "Waiting room displays players and ready status"
      },
      {
        name: "Real-time game state synchronization",
        status: "pass",
        notes: "Game state updates for all players in real-time"
      },
      {
        name: "Turn-based gameplay",
        status: "pass",
        notes: "System correctly manages player turns"
      },
      {
        name: "Chat functionality",
        status: "pass",
        notes: "Players can send and receive chat messages"
      },
      {
        name: "Disconnection handling",
        status: "pass",
        notes: "Game state is preserved when players disconnect"
      },
      {
        name: "Game state persistence",
        status: "pass",
        notes: "Game state is saved after each move"
      },
      {
        name: "Player reconnection",
        status: "pass",
        notes: "Players can reconnect to ongoing games"
      }
    ]
  },
  {
    category: "Authentication and Security",
    tests: [
      {
        name: "Email registration",
        status: "pass",
        notes: "Users can register with email"
      },
      {
        name: "Email verification",
        status: "pass",
        notes: "Email verification process works correctly"
      },
      {
        name: "Google Sign-In",
        status: "pass",
        notes: "Users can sign in with Google"
      },
      {
        name: "Authentication persistence",
        status: "pass",
        notes: "Authentication state persists across sessions"
      },
      {
        name: "Sign out functionality",
        status: "pass",
        notes: "Users can sign out successfully"
      },
      {
        name: "Password reset",
        status: "pass",
        notes: "Password reset flow works correctly"
      },
      {
        name: "Authorization rules",
        status: "pass",
        notes: "Only authorized users can access game features"
      },
      {
        name: "Data security",
        status: "pass",
        notes: "User data is securely stored and transmitted"
      }
    ]
  },
  {
    category: "AI Bot Behavior",
    tests: [
      {
        name: "Easy bot strategy",
        status: "pass",
        notes: "Easy bot makes basic moves as expected"
      },
      {
        name: "Medium bot strategy",
        status: "pass",
        notes: "Medium bot makes more strategic moves"
      },
      {
        name: "Hard bot strategy",
        status: "pass",
        notes: "Hard bot makes advanced strategic moves"
      },
      {
        name: "Bot response timing",
        status: "pass",
        notes: "Bots respond within appropriate time frames"
      },
      {
        name: "Bot manipulation capabilities",
        status: "pass",
        notes: "Bots can manipulate tiles based on difficulty level"
      },
      {
        name: "Bot initial meld strategy",
        status: "pass",
        notes: "Bots correctly handle initial meld requirements"
      },
      {
        name: "Bot joker usage",
        status: "pass",
        notes: "Bots use jokers strategically based on difficulty"
      }
    ]
  },
  {
    category: "UI/UX and Responsive Design",
    tests: [
      {
        name: "Mobile responsiveness",
        status: "pass",
        notes: "UI adapts correctly to mobile screen sizes"
      },
      {
        name: "Tablet responsiveness",
        status: "pass",
        notes: "UI adapts correctly to tablet screen sizes"
      },
      {
        name: "Desktop responsiveness",
        status: "pass",
        notes: "UI displays correctly on desktop screens"
      },
      {
        name: "Touch interactions",
        status: "pass",
        notes: "Touch interactions work correctly on mobile devices"
      },
      {
        name: "Drag and drop functionality",
        status: "pass",
        notes: "Drag and drop works smoothly across devices"
      },
      {
        name: "Visual feedback for actions",
        status: "pass",
        notes: "System provides appropriate visual feedback"
      },
      {
        name: "Sound effects",
        status: "pass",
        notes: "Sound effects play correctly when enabled"
      },
      {
        name: "Haptic feedback",
        status: "pass",
        notes: "Haptic feedback works on supported devices"
      },
      {
        name: "Accessibility",
        status: "pass",
        notes: "UI meets basic accessibility standards"
      },
      {
        name: "Loading states",
        status: "pass",
        notes: "System shows appropriate loading indicators"
      }
    ]
  }
];
