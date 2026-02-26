// Use relative URLs in production (nginx proxies to backend)
// Use localhost:3001 in development
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173';
const API_BASE = isDev ? 'http://localhost:3001/api' : '/api';

async function fetchWithError(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Sentences
  getSentences: async (page = 1, limit = 20, category?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (category) params.append('category', category);
    return fetchWithError(`${API_BASE}/sentences?${params}`);
  },

  getSentence: async (id: number) => {
    return fetchWithError(`${API_BASE}/sentences/${id}`);
  },

  createSentence: async (data: { text: string; category?: string; difficulty?: number }) => {
    return fetchWithError(`${API_BASE}/sentences`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSentence: async (id: number, data: { text?: string; category?: string; difficulty?: number }) => {
    return fetchWithError(`${API_BASE}/sentences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSentence: async (id: number) => {
    return fetchWithError(`${API_BASE}/sentences/${id}`, {
      method: 'DELETE',
    });
  },

  regenerateAudio: async (id: number) => {
    return fetchWithError(`${API_BASE}/sentences/${id}/generate-audio`, {
      method: 'POST',
    });
  },

  getCategories: async () => {
    return fetchWithError(`${API_BASE}/sentences/categories`);
  },

  bulkCreateSentences: async (sentences: { text: string; category?: string; difficulty?: number }[]) => {
    return fetchWithError(`${API_BASE}/sentences/bulk`, {
      method: 'POST',
      body: JSON.stringify({ sentences }),
    });
  },

  // Admin
  login: async (username: string, password: string) => {
    const data = await fetchWithError(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.sessionId) {
      localStorage.setItem('sessionId', data.sessionId);
    }
    return data;
  },

  logout: async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      await fetchWithError(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionId}` },
      });
    }
    localStorage.removeItem('sessionId');
  },

  verifyAuth: async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return { authenticated: false };
    
    try {
      return await fetchWithError(`${API_BASE}/auth/verify`, {
        headers: { Authorization: `Bearer ${sessionId}` },
      });
    } catch {
      return { authenticated: false };
    }
  },

  getStats: async () => {
    const sessionId = localStorage.getItem('sessionId');
    return fetchWithError(`${API_BASE}/stats`, {
      headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : {},
    });
  },

  // Audio
  getAudioUrl: (path: string): string => {
    if (path.startsWith('http')) return path;
    const baseUrl = isDev ? 'http://localhost:3001' : '';
    return `${baseUrl}${path}`;
  },
};
