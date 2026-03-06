import { Router } from 'express';
import { nanoid } from 'nanoid';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { generateGrid } from '../lib/shuffle.js';

const router = Router();

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
  const { title, items, freeSpace } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items are required' });
  }

  const slotsNeeded = freeSpace !== false ? 24 : 25;
  if (items.length < slotsNeeded) {
    return res.status(400).json({
      error: `Need at least ${slotsNeeded} items for a 5×5 board${freeSpace !== false ? ' (with free space)' : ''}`,
    });
  }

  const boardId = nanoid(12);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO boards (id, user_id, title, free_space) VALUES ($1, $2, $3, $4)`,
      [boardId, req.user.id, title.trim(), freeSpace !== false]
    );

    for (let i = 0; i < items.length; i++) {
      const text = items[i].trim();
      if (text) {
        await client.query(
          `INSERT INTO board_items (board_id, text, sort_order) VALUES ($1, $2, $3)`,
          [boardId, text, i]
        );
      }
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
  const { title, items, freeSpace } = req.body;

  // Verify ownership
  const boardResult = await pool.query('SELECT * FROM boards WHERE id = $1', [id]);
  if (boardResult.rows.length === 0) {
    return res.status(404).json({ error: 'Board not found' });
  }
  if (boardResult.rows[0].user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to edit this board' });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items are required' });
  }

  const slotsNeeded = freeSpace !== false ? 24 : 25;
  if (items.length < slotsNeeded) {
    return res.status(400).json({
      error: `Need at least ${slotsNeeded} items for a 5×5 board${freeSpace !== false ? ' (with free space)' : ''}`,
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE boards SET title = $1, free_space = $2, updated_at = NOW() WHERE id = $3`,
      [title.trim(), freeSpace !== false, id]
    );

    // Replace all items
    await client.query('DELETE FROM board_items WHERE board_id = $1', [id]);

    for (let i = 0; i < items.length; i++) {
      const text = items[i].trim();
      if (text) {
        await client.query(
          `INSERT INTO board_items (board_id, text, sort_order) VALUES ($1, $2, $3)`,
          [id, text, i]
        );
      }
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
    },
    grid,
  });
});

export default router;
