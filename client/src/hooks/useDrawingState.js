import { useState, useRef, useCallback, useEffect } from 'react';

const SIZES = [
  { id: 'thin', width: 3 },
  { id: 'medium', width: 8 },
  { id: 'thicc', width: 16 },
];

const TOOLS = [
  { id: 'brush', cursor: 'crosshair' },
  { id: 'highlighter', cursor: 'crosshair' },
  { id: 'eraser', cursor: 'cell' },
];

const STORAGE_PREFIX = 'bingo_drawing_';

function loadStoredLines(storageKey) {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useDrawingState(boardId, visitorId) {
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#FF0000');
  const [size, setSize] = useState('medium');
  const storageKey = `${STORAGE_PREFIX}${boardId}_${visitorId}`;
  const [lines, setLines] = useState(() => loadStoredLines(storageKey));
  const isDrawing = useRef(false);
  const stageRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      return;
    }
  }, [lines, storageKey]);

  const getStrokeProps = useCallback(() => {
    const sizeObj = SIZES.find((entry) => entry.id === size);
    const strokeWidth = sizeObj?.width || 8;

    if (tool === 'eraser') {
      return {
        stroke: '#000000',
        strokeWidth: strokeWidth * 2,
        globalCompositeOperation: 'destination-out',
        opacity: 1,
      };
    }

    if (tool === 'highlighter') {
      return {
        stroke: color,
        strokeWidth: strokeWidth * 2.5,
        globalCompositeOperation: 'source-over',
        opacity: 0.3,
      };
    }

    return {
      stroke: color,
      strokeWidth,
      globalCompositeOperation: 'source-over',
      opacity: 1,
    };
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

  const handlePointerUp = () => {
    isDrawing.current = false;
  };

  const handleClear = () => setLines([]);
  const handleUndo = () => setLines((prev) => prev.slice(0, -1));
  const currentTool = TOOLS.find((entry) => entry.id === tool);

  return {
    tool,
    setTool,
    color,
    setColor,
    size,
    setSize,
    lines,
    stageRef,
    currentTool,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClear,
    handleUndo,
  };
}