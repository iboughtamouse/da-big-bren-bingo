import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';

export default function Header() {
  const { user, authLoading, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <Link to="/" className="header-title">
        🎯 Da Big Bren Bingo
      </Link>
      <nav className="header-nav">
        {authLoading ? null : user ? (
          <>
            <span className="header-user">
              {user.avatar && (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=32`}
                  alt=""
                  className="header-avatar"
                />
              )}
              {user.username}
            </span>
            <Link to="/create" className="btn btn-small">
              New Board
            </Link>
            <button onClick={logout} className="btn btn-small btn-ghost">
              Logout
            </button>
          </>
        ) : (
          <a href="/api/auth/discord" className="btn btn-small btn-discord">
            Login with Discord
          </a>
        )}
      </nav>
    </header>
  );
}
