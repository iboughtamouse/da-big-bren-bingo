import seedrandom from 'seedrandom';
import { createHash } from 'crypto';

const DEFAULT_FREE_SPACE_TEXT = 'FREE';

/**
 * Generate a deterministic seed from board ID, visitor ID, and board update time.
 * Including updatedAt ensures edits produce fresh shuffles.
 */
function makeSeed(boardId, visitorId, updatedAt) {
  const raw = `${boardId}:${visitorId}:${updatedAt}`;
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Seeded Fisher-Yates shuffle. Returns a new array.
 */
function seededShuffle(array, rng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Select `count` items from `pool` using seeded randomness, then shuffle.
 * If pool.length === count, all items are used (just shuffled).
 */
function seededSample(pool, count, rng) {
  if (pool.length <= count) {
    return seededShuffle(pool, rng);
  }
  // Seeded Fisher-Yates partial shuffle to pick `count` items
  const arr = [...pool];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

/**
 * Generate a 5x5 bingo grid for a specific visitor.
 *
 * @param {Object} board - Board object with id, updatedAt, freeSpace
 * @param {Array<string>} items - Full item pool (sorted by sort_order)
 * @param {string} visitorId - Visitor's unique ID
 * @returns {Array<Array<string|null>>} 5x5 grid (row-major)
 */
export function generateGrid(board, items, visitorId) {
  const slotsNeeded = board.free_space ? 24 : 25;
  const seed = makeSeed(board.id, visitorId, board.updated_at);
  const rng = seedrandom(seed);

  // Select and shuffle items
  const selected = seededSample(items, slotsNeeded, rng);

  // Build flat 25-cell array
  const cells = [];
  let itemIndex = 0;
  for (let i = 0; i < 25; i++) {
    if (board.free_space && i === 12) {
      cells.push({ text: board.free_space_text || DEFAULT_FREE_SPACE_TEXT, isFreeSpace: true });
    } else {
      cells.push({ text: selected[itemIndex], isFreeSpace: false });
      itemIndex++;
    }
  }

  // Return as 5x5 grid
  const grid = [];
  for (let row = 0; row < 5; row++) {
    grid.push(cells.slice(row * 5, row * 5 + 5));
  }
  return grid;
}
