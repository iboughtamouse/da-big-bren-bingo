import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { getVisitorId } from '../lib/visitor';
import { AuthContext } from '../App';
import BingoGrid from '../components/BingoGrid';
import { useDrawingState, DrawingToolbar, DrawingStage } from '../components/DrawingCanvas';

export default function BoardPlay() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [board, setBoard] = useState(null);
  const [grid, setGrid] = useState(null);
  const [error, setError] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 650, height: 650 });
  const gridRef = useRef(null);
  const visitorId = getVisitorId();
  const drawing = useDrawingState(id, visitorId);

  useEffect(() => {
    api
      .getPlayBoard(id, visitorId)
      .then((data) => {
        setBoard(data.board);
        setGrid(data.grid);
        document.title = `${data.board.title} — Da Big Bren Bingo`;
      })
      .catch((err) => setError(err.message));
  }, [id, visitorId]);

  // Measure the grid to size the canvas overlay
  useEffect(() => {
    if (!gridRef.current) return;
    const measure = () => {
      const gridEl = gridRef.current;
      if (gridEl) {
        const rect = gridEl.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [grid]);

  if (error) {
    return (
      <div className="error-page">
        <h1>Board not found</h1>
        <p>{error}</p>
        <Link to="/" className="btn">
          Go Home
        </Link>
      </div>
    );
  }

  if (!board || !grid) {
    return <div className="loading">Loading board...</div>;
  }

  return (
    <div className="board-play">
      {user && board && (
        <div className="board-actions">
          <Link to={`/board/${id}/edit`} className="btn btn-small">
            ✏️ Edit Board
          </Link>
        </div>
      )}

      <h2 className="bingo-title">{board.title}</h2>
      <div className="board-play-layout">
        <div className="board-play-area">
          <DrawingToolbar {...drawing} />
          <div ref={gridRef}>
            <BingoGrid grid={grid} />
          </div>
          <div className="canvas-overlay">
            <DrawingStage
              width={canvasSize.width}
              height={canvasSize.height}
              drawing={drawing}
            />
          </div>
        </div>
      </div>

      <div className="share-section">
        <p className="share-hint">Share this board:</p>
        <code className="share-url">{window.location.href}</code>
        <button
          className="btn btn-small"
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          📋 Copy Link
        </button>
      </div>
    </div>
  );
}
