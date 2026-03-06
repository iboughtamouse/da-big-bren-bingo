import { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';

export default function Home() {
  const { user, authLoading } = useContext(AuthContext);

  useEffect(() => { document.title = 'Da Big Bren Bingo'; }, []);

  return (
    <div className="home">
      <div className="hero">
        <h1>Da Big Bren Bingo</h1>
        <p className="hero-subtitle">
          Create a bingo board. Share it with your stream. Everyone gets their
          own unique board. Scribble on it like you're in MS Paint.
        </p>
        {authLoading ? null : user ? (
          <Link to="/create" className="btn btn-large">
            Create a Board
          </Link>
        ) : (
          <a href="/api/auth/discord" className="btn btn-large btn-discord">
            Login with Discord to Create a Board
          </a>
        )}
      </div>
    </div>
  );
}
