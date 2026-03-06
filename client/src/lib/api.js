const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  getMe: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  // Boards
  createBoard: (data) =>
    request('/api/boards', { method: 'POST', body: JSON.stringify(data) }),
  getBoard: (id) => request(`/api/boards/${encodeURIComponent(id)}`),
  updateBoard: (id, data) =>
    request(`/api/boards/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBoard: (id) =>
    request(`/api/boards/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Play
  getPlayBoard: (id, visitorId) =>
    request(
      `/api/boards/${encodeURIComponent(id)}/play?visitor=${encodeURIComponent(visitorId)}`
    ),
};
