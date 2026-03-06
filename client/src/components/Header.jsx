import { useContext, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { api } from '../lib/api';

export default function Header() {
  const { user, authLoading, logout } = useContext(AuthContext);
  const [showBoards, setShowBoards] = useState(false);
  const [boards, setBoards] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showBoards) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowBoards(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showBoards]);

  const toggleBoards = async () => {
    if (showBoards) {
      setShowBoards(false);
      return;
    }
    setShowBoards(true);
    try {
      const data = await api.getMyBoards();
      setBoards(data.boards);
    } catch {
      setBoards([]);
    }
  };

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
            <div className="boards-dropdown-wrapper" ref={dropdownRef}>
              <button onClick={toggleBoards} className="btn btn-small">
                📋 My Boards {showBoards ? '▲' : '▼'}
              </button>
              {showBoards && (
                <div className="boards-dropdown">
                  {boards === null ? (
                    <div className="dropdown-item dropdown-loading">Loading...</div>
                  ) : boards.length === 0 ? (
                    <div className="dropdown-empty">
                      <p>No boards yet!</p>
                      <Link to="/create" className="btn btn-small" onClick={() => setShowBoards(false)}>
                        Create your first board
                      </Link>
                    </div>
                  ) : (
                    boards.map((b) => (
                      <Link
                        key={b.id}
                        to={`/board/${b.id}`}
                        className="dropdown-item"
                        onClick={() => setShowBoards(false)}
                      >
                        {b.title}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
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
