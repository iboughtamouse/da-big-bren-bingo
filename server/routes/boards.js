import { Router } from 'express';
import { nanoid } from 'nanoid';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { generateGrid } from '../lib/shuffle.js';

const router = Router();
const MAX_ITEMS = 500;
const MAX_ITEM_LENGTH = 255;
const MAX_TITLE_LENGTH = 255;
const DEFAULT_FREE_SPACE_TEXT = 'FREE';

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function normalizeFreeSpaceText(freeSpace, freeSpaceText) {
  if (freeSpace === false) {
    return null;
  }

  if (typeof freeSpaceText !== 'string') {
    return DEFAULT_FREE_SPACE_TEXT;
  }

  const normalized = freeSpaceText.trim();
  return normalized || DEFAULT_FREE_SPACE_TEXT;
}

function validateBoardPayload(title, items, freeSpace, freeSpaceText) {
  if (!title || !title.trim()) {
    return 'Title is required';
  }

  if (title.trim().length > MAX_TITLE_LENGTH) {
    return `Title must be ${MAX_TITLE_LENGTH} characters or fewer`;
  }

  if (!Array.isArray(items)) {
    return 'Items are required';
  }

  const normalizedItems = normalizeItems(items);
  if (normalizedItems.length === 0) {
    return 'Items are required';
  }

  const slotsNeeded = freeSpace !== false ? 24 : 25;
  if (normalizedItems.length < slotsNeeded) {
    return `Need at least ${slotsNeeded} items for a 5×5 board${freeSpace !== false ? ' (with free space)' : ''}`;
  }

  if (normalizedItems.length > MAX_ITEMS) {
    return `Too many items. Max ${MAX_ITEMS}.`;
  }

  if (normalizedItems.some((item) => item.length > MAX_ITEM_LENGTH)) {
    return `Each item must be ${MAX_ITEM_LENGTH} characters or fewer`;
  }

  const normalizedFreeSpaceText = normalizeFreeSpaceText(freeSpace, freeSpaceText);
  if (normalizedFreeSpaceText && normalizedFreeSpaceText.length > MAX_ITEM_LENGTH) {
    return `Free space text must be ${MAX_ITEM_LENGTH} characters or fewer`;
  }

  return null;
}

// List boards for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, title, created_at FROM boards WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ boards: result.rows });
});

// Create a new board
router.post('/', requireAuth, async (req, res) => {
  const { title, items, freeSpace, freeSpaceText } = req.body;
  const validationError = validateBoardPayload(title, items, freeSpace, freeSpaceText);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const normalizedItems = normalizeItems(items);
  const normalizedFreeSpaceText = normalizeFreeSpaceText(freeSpace, freeSpaceText);

  const boardId = nanoid(12);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO boards (id, user_id, title, free_space, free_space_text) VALUES ($1, $2, $3, $4, $5)`,
      [boardId, req.user.id, title.trim(), freeSpace !== false, normalizedFreeSpaceText]
    );

    for (let i = 0; i < normalizedItems.length; i++) {
      await client.query(
        `INSERT INTO board_items (board_id, text, sort_order) VALUES ($1, $2, $3)`,
        [boardId, normalizedItems[i], i]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: boardId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating board:', err);
    res.status(500).json({ error: 'Failed to create board' });
  } finally {
    client.release();
  }
});

// Get board details (for editing / viewing metadata)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const boardResult = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
  if (boardResult.rows.length === 0) {
    return res.status(404).json({ error: 'Board not found' });
  }

  const board = boardResult.rows[0];
  const itemsResult = await pool.query(
    'SELECT id, text, sort_order FROM board_items WHERE board_id = $1 ORDER BY sort_order',
    [id]
  );

  // Check if the requester is the owner
  const isOwner = req.session?.user?.id === board.user_id;

  res.json({
    board: {
      id: board.id,
      title: board.title,
      freeSpace: board.free_space,
      freeSpaceText: board.free_space_text || DEFAULT_FREE_SPACE_TEXT,
      itemCount: itemsResult.rows.length,
      createdAt: board.created_at,
      updatedAt: board.updated_at,
      isOwner,
    },
    // Only send full item list to owner (viewers don't need the raw pool)
    items: isOwner ? itemsResult.rows.map((r) => r.text) : undefined,
  });
});

// Update a board
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, items, freeSpace, freeSpaceText } = req.body;
  const validationError = validateBoardPayload(title, items, freeSpace, freeSpaceText);

  // Verify ownership
  const boardResult = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
  if (boardResult.rows.length === 0) {
    return res.status(404).json({ error: 'Board not found' });
  }
  if (boardResult.rows[0].user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to edit this board' });
  }

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const normalizedItems = normalizeItems(items);
  const normalizedFreeSpaceText = normalizeFreeSpaceText(freeSpace, freeSpaceText);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE boards SET title = $1, free_space = $2, free_space_text = $3, updated_at = NOW() WHERE id = $4`,
      [title.trim(), freeSpace !== false, normalizedFreeSpaceText, id]
    );

    // Replace all items
    await client.query('DELETE FROM board_items WHERE board_id = $1', [id]);

    for (let i = 0; i < normalizedItems.length; i++) {
      await client.query(
        `INSERT INTO board_items (board_id, text, sort_order) VALUES ($1, $2, $3)`,
        [id, normalizedItems[i], i]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating board:', err);
    res.status(500).json({ error: 'Failed to update board' });
  } finally {
    client.release();
  }
});

// Delete a board
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  const boardResult = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
  if (boardResult.rows.length === 0) {
    return res.status(404).json({ error: 'Board not found' });
  }
  if (boardResult.rows[0].user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this board' });
  }

  await pool.query('DELETE FROM boards WHERE id = $1', [id]);
  res.json({ ok: true });
});

// Get shuffled board for a visitor
router.get('/:id/play', async (req, res) => {
  const { id } = req.params;
  const { visitor } = req.query;

  if (!visitor) {
    return res.status(400).json({ error: 'Visitor ID is required' });
  }

  const boardResult = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
  if (boardResult.rows.length === 0) {
    return res.status(404).json({ error: 'Board not found' });
  }

  const board = boardResult.rows[0];
  const itemsResult = await pool.query(
    'SELECT text FROM board_items WHERE board_id = $1 ORDER BY sort_order',
    [id]
  );

  const items = itemsResult.rows.map((r) => r.text);
  const grid = generateGrid(board, items, visitor);

  res.json({
    board: {
      id: board.id,
      title: board.title,
      freeSpace: board.free_space,
      freeSpaceText: board.free_space_text || DEFAULT_FREE_SPACE_TEXT,
    },
    grid,
  });
});

export default router;
