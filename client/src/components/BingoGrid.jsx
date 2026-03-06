import './BingoGrid.css';

export default function BingoGrid({ grid }) {
  if (!grid) return null;

  return (
    <div className="bingo-grid">
        {grid.flat().map((cell, i) => (
          <div
            key={i}
            className={`bingo-cell ${cell.isFreeSpace ? 'free-space' : ''}`}
          >
            <span className="cell-text">{cell.text}</span>
          </div>
        ))}
    </div>
  );
}
