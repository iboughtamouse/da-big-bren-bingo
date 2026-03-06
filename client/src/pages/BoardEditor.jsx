import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { api } from '../lib/api';

export default function BoardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useContext(AuthContext);
  const isEditing = Boolean(id);

  useEffect(() => {
    document.title = isEditing ? 'Edit Board — Da Big Bren Bingo' : 'Create Board — Da Big Bren Bingo';
  }, [isEditing]);

  const [title, setTitle] = useState('');
  const [itemsText, setItemsText] = useState('');
  const [freeSpace, setFreeSpace] = useState(true);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load existing board for editing
  useEffect(() => {
    if (!isEditing) return;
    api
      .getBoard(id)
      .then((data) => {
        if (!data.board.isOwner) {
          navigate(`/board/${id}`);
          return;
        }
        setTitle(data.board.title);
        setFreeSpace(data.board.freeSpace);
        setItemsText(data.items.join('\n'));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEditing, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  const parseItems = (text) =>
    text
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const itemCount = parseItems(itemsText).length;
  const slotsNeeded = freeSpace ? 24 : 25;

  const handleSubmit = async () => {
    if (isEditing && !showEditWarning) {
      setShowEditWarning(true);
      return;
    }

    const items = parseItems(itemsText);
    if (!title.trim()) {
      setError('Give your board a title!');
      return;
    }
    if (items.length < slotsNeeded) {
      setError(`Need at least ${slotsNeeded} items. You have ${items.length}.`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditing) {
        await api.updateBoard(id, { title, items, freeSpace });
        navigate(`/board/${id}`);
      } else {
        const data = await api.createBoard({ title, items, freeSpace });
        navigate(`/board/${data.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setShowEditWarning(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await api.deleteBoard(id);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (authLoading || loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="editor">
      <h1>{isEditing ? 'Edit Board' : 'Create a Board'}</h1>

      {isEditing && (
        <div className="warning-banner">
          ⚠️ Editing this board will shuffle everyone's layouts next time they
          load it. Anyone who already has it open won't be affected until they
          refresh.
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div className="form-group">
        <label htmlFor="title">Board Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Bren's Valorant Stream Bingo"
          maxLength={255}
        />
      </div>

      <div className="form-group">
        <label htmlFor="items">
          Bingo Items{' '}
          <span className="label-hint">
            (one per line, or comma-separated — {itemCount} items,{' '}
            {slotsNeeded} needed)
          </span>
        </label>
        <textarea
          id="items"
          value={itemsText}
          onChange={(e) => setItemsText(e.target.value)}
          placeholder={`Bren rages at Jett\nTeam gets aced\nSomeone says "diff"\nBren blames ping\n...`}
          rows={15}
        />
        <div className="item-count">
          {itemCount >= slotsNeeded ? (
            <span className="count-good">
              ✓ {itemCount} items — {itemCount > slotsNeeded
                ? `each viewer gets a unique board from the pool!`
                : `everyone gets the same items, shuffled`}
            </span>
          ) : (
            <span className="count-bad">
              ✗ {itemCount}/{slotsNeeded} items — need{' '}
              {slotsNeeded - itemCount} more
            </span>
          )}
        </div>
      </div>

      <div className="form-group form-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={freeSpace}
            onChange={(e) => setFreeSpace(e.target.checked)}
          />
          Free center space
        </label>
      </div>

      {showEditWarning && (
        <div className="confirm-banner">
          🚨 Are you sure? This will scramble everyone's boards. Hit save again
          to confirm.
        </div>
      )}

      <div className="editor-actions">
        {isEditing && (
          <Link to={`/board/${id}`} className="btn btn-large btn-ghost">
            👁 View Board
          </Link>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving || deleting || itemCount < slotsNeeded}
          className="btn btn-large"
        >
          {saving
            ? 'Saving...'
            : showEditWarning
              ? 'Yes, Save Changes'
              : isEditing
                ? 'Save Changes'
                : 'Create Board'}
        </button>
      </div>

      {isEditing && (
        <div className="danger-zone">
          {showDeleteConfirm && (
            <div className="confirm-banner">
              🚨 This will permanently delete the board and all its items. Hit delete again to confirm.
            </div>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-small btn-danger"
          >
            {deleting ? 'Deleting...' : showDeleteConfirm ? 'Yes, Delete Forever' : '🗑 Delete Board'}
          </button>
        </div>
      )}
    </div>
  );
}
