import { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import './DrawingCanvas.css';

const COLORS = [
  '#FF0000', '#FF6B00', '#FFD600', '#00C853',
  '#2979FF', '#AA00FF', '#FF4081', '#FFFFFF',
  '#000000', '#795548',
];

const TOOLS = [
  { id: 'brush', label: '🖌️', title: 'Brush', cursor: 'crosshair' },
  { id: 'highlighter', label: '🖍️', title: 'Highlighter', cursor: 'crosshair' },
  { id: 'eraser', label: '🧹', title: 'Eraser', cursor: 'cell' },
];

const SIZES = [
  { id: 'thin', label: 'Thin', width: 3 },
  { id: 'medium', label: 'Med', width: 8 },
  { id: 'thicc', label: 'Thicc', width: 16 },
];

const STORAGE_PREFIX = 'bingo_drawing_';

export function useDrawingState(boardId, visitorId) {
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#FF0000');
  const [size, setSize] = useState('medium');
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);
  const stageRef = useRef(null);

  const storageKey = `${STORAGE_PREFIX}${boardId}_${visitorId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setLines(JSON.parse(saved));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {}
  }, [lines, storageKey]);

  const getStrokeProps = useCallback(() => {
    const sizeObj = SIZES.find((s) => s.id === size);
    const strokeWidth = sizeObj?.width || 8;

    if (tool === 'eraser') {
      return { stroke: '#000000', strokeWidth: strokeWidth * 2, globalCompositeOperation: 'destination-out', opacity: 1 };
    }
    if (tool === 'highlighter') {
      return { stroke: color, strokeWidth: strokeWidth * 2.5, globalCompositeOperation: 'source-over', opacity: 0.3 };
    }
    return { stroke: color, strokeWidth, globalCompositeOperation: 'source-over', opacity: 1 };
  }, [tool, color, size]);

  const handlePointerDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines((prev) => [...prev, { ...getStrokeProps(), points: [pos.x, pos.y] }]);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current) return;
    const pos = e.target.getStage().getPointerPosition();
    setLines((prev) => {
      const updated = [...prev];
      const last = { ...updated[updated.length - 1] };
      last.points = [...last.points, pos.x, pos.y];
      updated[updated.length - 1] = last;
      return updated;
    });
  };

  const handlePointerUp = () => { isDrawing.current = false; };
  const handleClear = () => setLines([]);
  const handleUndo = () => setLines((prev) => prev.slice(0, -1));

  const currentTool = TOOLS.find((t) => t.id === tool);

  return {
    tool, setTool, color, setColor, size, setSize,
    lines, stageRef, currentTool,
    handlePointerDown, handlePointerMove, handlePointerUp,
    handleClear, handleUndo,
  };
}

export function DrawingToolbar({ tool, setTool, color, setColor, size, setSize, handleUndo, handleClear }) {
  return (
    <div className="drawing-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">Tool</span>
        <div className="toolbar-group">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              className={`toolbar-btn ${tool === t.id ? 'active' : ''}`}
              onClick={() => setTool(t.id)}
              title={t.title}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">Size</span>
        <div className="toolbar-group">
          {SIZES.map((s) => (
            <button
              key={s.id}
              className={`toolbar-btn ${size === s.id ? 'active' : ''}`}
              onClick={() => setSize(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">Color</span>
        <div className="toolbar-group color-group">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-btn ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-group toolbar-row">
          <button className="toolbar-btn" onClick={handleUndo} title="Undo">↩️</button>
          <button className="toolbar-btn danger" onClick={handleClear} title="Clear all">🗑️</button>
        </div>
      </div>
    </div>
  );
}

export function DrawingStage({ width, height, drawing }) {
  const { stageRef, currentTool, lines, handlePointerDown, handlePointerMove, handlePointerUp } = drawing;

  return (
    <div
      className="drawing-stage-wrapper"
      style={{ cursor: currentTool?.cursor || 'crosshair' }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={line.globalCompositeOperation}
              opacity={line.opacity}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
