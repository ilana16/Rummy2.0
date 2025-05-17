import React, { useState } from 'react';
import styled from 'styled-components';
import Game from './components/Game';
import { app } from './firebase';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const AuthContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 20px;
`;

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  padding: 30px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const Input = styled.input`
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s;

  &:hover {
    background-color: #388e3c;
  }
`;

const GoogleButton = styled(Button)`
  background-color: #4285f4;
  
  &:hover {
    background-color: #3367d6;
  }
`;

const ErrorMessage = styled.p`
  color: #f44336;
  margin-top: 10px;
`;

const App: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Check if user is already logged in
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (user) {
    return (
      <AppContainer>
        <header className="App-header">
          <h1>Rummy Tile Game</h1>
          <Button onClick={() => auth.signOut()}>Sign Out</Button>
        </header>
        <Game />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <header className="App-header">
        <h1>Rummy Tile Game</h1>
      </header>
      <AuthContainer>
        <AuthForm onSubmit={handleEmailAuth}>
          <h2>{isLogin ? 'Login' : 'Register'}</h2>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit">
            {isLogin ? 'Login' : 'Register'}
          </Button>
          <GoogleButton type="button" onClick={handleGoogleAuth}>
            Sign in with Google
          </GoogleButton>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <a href="#" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Register' : 'Login'}
            </a>
          </p>
        </AuthForm>
      </AuthContainer>
    </AppContainer>
  );
};

export default App;
