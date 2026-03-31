const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'cyberchain_auth_token';

const request = async (path, { method = 'GET', token, body } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
};

export const authStorage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export const api = {
  login(credentials) {
    return request('/auth/login', { method: 'POST', body: credentials });
  },
  register(payload) {
    return request('/auth/register', { method: 'POST', body: payload });
  },
  state(token) {
    return request('/state', { token });
  },
  sendMoney(token, payload) {
    return request('/transactions/send', { method: 'POST', token, body: payload });
  },
  credit(token, payload) {
    return request('/admin/credit', { method: 'POST', token, body: payload });
  },
  triggerAttack(token, payload) {
    return request('/attacks/trigger', { method: 'POST', token, body: payload });
  },
  setSystemMode(token, mode) {
    return request('/system/mode', { method: 'POST', token, body: { mode } });
  },
  recoverBlockchain(token, method = 'pbft') {
    return request('/blockchain/recover', { method: 'POST', token, body: { method } });
  },
  updateBlock(token, blockId, payload) {
    return request(`/blockchain/${blockId}`, { method: 'PATCH', token, body: payload });
  },
  resetSystem(token) {
    return request('/system/reset', { method: 'POST', token });
  },
};
