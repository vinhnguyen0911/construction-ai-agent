const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch wrapper with auth header.
 */
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res;
}

/**
 * POST /api/auth/login
 */
export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Login failed');
  }

  const data = await res.json();
  localStorage.setItem('token', data.token);
  return data;
}

/**
 * GET /api/conversations
 */
export async function getConversations() {
  const res = await apiFetch('/api/conversations');
  return res.json();
}

/**
 * GET /api/conversations/:id/messages
 */
export async function getMessages(conversationId) {
  const res = await apiFetch(`/api/conversations/${conversationId}/messages`);
  return res.json();
}

/**
 * DELETE /api/conversations/:id
 */
export async function deleteConversation(id) {
  await apiFetch(`/api/conversations/${id}`, { method: 'DELETE' });
}

/**
 * POST /api/chat — SSE streaming.
 * Returns ReadableStream, calls onEvent for each SSE event.
 */
export async function sendMessage(message, conversationId, onEvent) {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ message, conversationId }),
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent(data);
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}

/**
 * GET /api/reports
 */
export async function getReports(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiFetch(`/api/reports${query ? '?' + query : ''}`);
  return res.json();
}

/**
 * DELETE /api/reports/:id
 */
export async function deleteReport(id) {
  const res = await apiFetch(`/api/reports/${id}`, { method: 'DELETE' });
  return res.json();
}

/**
 * POST /api/reports/run
 */
export async function runReports(locations) {
  const res = await apiFetch('/api/reports/run', {
    method: 'POST',
    body: JSON.stringify(locations ? { locations } : {}),
  });
  return res.json();
}
