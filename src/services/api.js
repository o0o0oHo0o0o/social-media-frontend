import { CONFIG } from '../config/constants';

const API_BASE = `${CONFIG.API_BASE_URL || ''}${CONFIG.API_PREFIX || ''}`;

const api = {
  // Refresh access token using refresh token cookie
  refresh: async () => {
    const url = `${API_BASE}/auth/refresh`;
    try { console.log('[API] POST', url, 'with credentials'); } catch (e) { }
    const resp = await fetch(url, {
      method: 'POST',
      credentials: 'include'
    });
    try { console.log('[API] refresh status', resp.status); } catch (e) { }
    return resp.ok;
  },
  // Conversations list
  getConversations: async (page = 1, size = 20, inboxType = 'ALL') => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      inboxType: String(inboxType || 'ALL')
    });
    const url = `${API_BASE}/api/chat/conversations?${params.toString()}`;
    try {
      const allCookies = document.cookie;
      console.log('[API] getConversations - Browser cookies:', allCookies);
      console.log('[API] Cookie count:', allCookies.split(';').length);
    } catch (e) { }

    let response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    if (response.status === 401) {
      console.log('[API] Got 401, attempting refresh and retry...');
      const ok = await api.refresh();
      if (ok) {
        // Wait for browser to store cookie
        await new Promise(resolve => setTimeout(resolve, 150));
        // Verify auth by calling /me
        const meData = await api.me();
        console.log('[API] After refresh - Browser cookies:', document.cookie);
        if (meData) {
          try { console.log('[API] Auth verified, retrying GET', url); } catch (e) { }
          response = await fetch(url, { method: 'GET', credentials: 'include' });
        } else {
          throw new Error('Auth verification failed after refresh');
        }
      }
    }
    try { console.log('[API] conversations response status', response.status, 'OK=', response.ok); } catch (e) { }
    if (!response.ok) throw new Error(`Fetch conversations failed (HTTP ${response.status})`);
    return response.json();
  },

  // Messages by conversation (with pagination)
  // Backend uses page (1-based) not offset
  getMessages: async (conversationId, limit = 50, page = 1) => {
    const url = `${API_BASE}/api/chat/conversations/${conversationId}/messages?size=${limit}&page=${page}`;
    try { console.log('[API] GET', url, 'with credentials'); } catch (e) { }
    let response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    if (response.status === 401) {
      const ok = await api.refresh();
      if (ok) {
        // Wait for browser to store cookie
        await new Promise(resolve => setTimeout(resolve, 150));
        // Verify auth
        const meData = await api.me();
        if (meData) {
          try { console.log('[API] Auth verified, retrying GET', url); } catch (e) { }
          response = await fetch(url, { method: 'GET', credentials: 'include' });
        }
      }
    }
    try { console.log('[API] messages status', response.status); } catch (e) { }
    if (!response.ok) throw new Error(`Fetch messages failed (HTTP ${response.status})`);
    return response.json();
  },
  me: async () => {
    try {
      let url = `${API_BASE}/auth/me`;
      try { console.log('[API] GET', url, 'with credentials'); } catch (e) { }
      let response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      if (response.status === 401) {
        const ok = await api.refresh();
        if (ok) {
          try { console.log('[API] Retrying GET', url); } catch (e) { }
          response = await fetch(url, { method: 'GET', credentials: 'include' });
        }
      }
      try { console.log('[API] me status', response.status); } catch (e) { }
      if (!response.ok) return null;
      return response.json();
    } catch (e) { void e; return null; }
  },
  register: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        let message = 'Registration failed';
        try {
          const error = await response.json();
          message = error.message || message;
        } catch (e) {
          void e; try {
            const text = await response.text();
            if (text) message = text;
          } catch (e2) { void e2; }
        }
        const err = new Error(`${message} (HTTP ${response.status})`);
        try { console.error('[API /auth/register] Error:', response.status, message); } catch (e3) { void e3; }
        throw err;
      }
      return response.json();
    } catch (err) {
      // Network/CORS errors will land here
      if (err?.message === 'Failed to fetch') {
        throw new Error('Không thể kết nối máy chủ. Kiểm tra API_BASE_URL, CORS và server backend.');
      }
      throw err;
    }
  },

  login: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        let message = 'Login failed';
        try {
          const error = await response.json();
          message = error.message || message;
        } catch (e) {
          void e; try {
            const text = await response.text();
            if (text) message = text;
          } catch (e2) { void e2; }
        }
        const err = new Error(`${message} (HTTP ${response.status})`);
        try { console.error('[API /auth/login] Error:', response.status, message); } catch (e3) { void e3; }
        throw err;
      }
      return response.json();
    } catch (err) {
      if (err?.message === 'Failed to fetch') {
        throw new Error('Không thể kết nối máy chủ. Kiểm tra API_BASE_URL, CORS và server backend.');
      }
      throw err;
    }
  },

  verifyOTP: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/verification/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        let message = 'OTP verification failed';
        try {
          const error = await response.json();
          message = error.message || message;
        } catch (e) {
          void e; try {
            const text = await response.text();
            if (text) message = text;
          } catch (e2) { void e2; }
        }
        const err = new Error(`${message} (HTTP ${response.status})`);
        try { console.error('[API /verification/otp] Error:', response.status, message); } catch (e3) { void e3; }
        throw err;
      }
      return response.json();
    } catch (err) {
      if (err?.message === 'Failed to fetch') {
        throw new Error('Không thể kết nối máy chủ. Kiểm tra API_BASE_URL, CORS và server backend.');
      }
      throw err;
    }
  },

  resendOTP: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/verification/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        let message = 'Resend OTP failed';
        try {
          const error = await response.json();
          message = error.message || message;
        } catch (e) {
          void e; try {
            const text = await response.text();
            if (text) message = text;
          } catch (e2) { void e2; }
        }
        const err = new Error(`${message} (HTTP ${response.status})`);
        try { console.error('[API /verification/resend-otp] Error:', response.status, message); } catch (e3) { void e3; }
        throw err;
      }
      return response.json();
    } catch (err) {
      if (err?.message === 'Failed to fetch') {
        throw new Error('Không thể kết nối máy chủ. Kiểm tra API_BASE_URL, CORS và server backend.');
      }
      throw err;
    }
  }
  ,
  // Chat APIs
  sendChatMessage: async ({ jsonData, files }) => {
    console.log('[SendMessage] Starting with files:', files?.length || 0);
    // Helper: read cookie by name
    const getCookie = (name) => {
      try {
        const pairs = document.cookie.split(';').map(s => s.trim());
        const found = pairs.find(s => s.startsWith(name + '='));
        if (!found) return null;
        return decodeURIComponent(found.split('=').slice(1).join('='));
      } catch (e) { return null; }
    };
    // CSRF token helper (common Spring setup uses 'XSRF-TOKEN')
    const getXsrfToken = () => getCookie('XSRF-TOKEN') || getCookie('X-XSRF-TOKEN');
    const form = new FormData();
    form.append('data', jsonData);

    // Append files - Spring @RequestPart expects multiple parts with same name
    if (Array.isArray(files) && files.length > 0) {
      console.log('[SendMessage] Appending files to FormData:');
      files.forEach((f, idx) => {
        console.log(`  [${idx}] ${f.name} - ${f.size} bytes, type: ${f.type}`);
        form.append('files', f);
      });
    }

    console.log('[SendMessage] FormData created, sending POST to', `${API_BASE}/api/chat/send`);
    // Build headers: include XSRF token (if cookie present) and Authorization Bearer (if access_token cookie present)
    const xsrf = getXsrfToken();
    const accessToken = getCookie('access_token') || getCookie('ACCESS_TOKEN') || null;
    const headers = {};
    if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    // If headers is empty, set to undefined so fetch doesn't send empty object
    const fetchHeaders = Object.keys(headers).length ? headers : undefined;
    let response = await fetch(`${API_BASE}/api/chat/send`, {
      method: 'POST',
      body: form,
      credentials: 'include',
      headers: fetchHeaders
      // Don't set Content-Type - let browser auto-set Content-Type with boundary
    });

    console.log('[SendMessage] Response status:', response.status);

    if (response.status === 401) {
      console.log('[SendMessage] Got 401, attempting refresh...');
      const ok = await api.refresh();
      if (ok) {
        console.log('[SendMessage] Refresh successful, retrying...');
        await new Promise(resolve => setTimeout(resolve, 150));
        const meData = await api.me();
        if (meData) {
          console.log('[SendMessage] Got me data, rebuilding FormData for retry');
          // Rebuild FormData for retry and include XSRF header
          const formRetry = new FormData();
          formRetry.append('data', jsonData);
          if (Array.isArray(files) && files.length > 0) {
            files.forEach(f => formRetry.append('files', f));
          }
          const xsrfRetry = getXsrfToken();
          const accessTokenRetry = getCookie('access_token') || getCookie('ACCESS_TOKEN') || null;
          const retryHdrs = {};
          if (xsrfRetry) retryHdrs['X-XSRF-TOKEN'] = xsrfRetry;
          if (accessTokenRetry) retryHdrs['Authorization'] = `Bearer ${accessTokenRetry}`;
          const retryHeadersFinal = Object.keys(retryHdrs).length ? retryHdrs : undefined;
          response = await fetch(`${API_BASE}/api/chat/send`, {
            method: 'POST',
            body: formRetry,
            credentials: 'include',
            headers: retryHeadersFinal
            // Don't set Content-Type - let browser auto-set Content-Type with boundary
          });
          console.log('[SendMessage] Retry response status:', response.status);
        }
      }
    }
    if (!response.ok) {
      console.log('[SendMessage] Response not OK, trying to get error message');
      let message = 'Send message failed';
      let errorBody = '';
      try {
        const text = await response.text();
        console.log('[SendMessage] Response body:', text);
        const e = JSON.parse(text);
        message = e.message || message;
      } catch (e2) {
        console.log('[SendMessage] Error parsing response:', e2);
      }
      throw new Error(`${message} (HTTP ${response.status})`);
    }
    console.log('[SendMessage] Success!');
    return response.json();
  },

  markChatRead: async (payload) => {
    let response = await fetch(`${API_BASE}/api/chat/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    if (response.status === 401) {
      const ok = await api.refresh();
      if (ok) {
        await new Promise(resolve => setTimeout(resolve, 150));
        const meData = await api.me();
        if (meData) {
          response = await fetch(`${API_BASE}/api/chat/read`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include'
          });
        }
      }
    }
    if (!response.ok) {
      let message = 'Mark-as-read failed';
      try { const e = await response.json(); message = e.message || message; } catch (e2) { void e2; }
      throw new Error(`${message} (HTTP ${response.status})`);
    }
    return { ok: true };
  },

  // WS token for STOMP connect
  getWebSocketToken: async () => {
    let response = await fetch(`${API_BASE}/api/chat/ws-token`, {
      method: 'POST',
      credentials: 'include'
    });
    if (response.status === 401) {
      const ok = await api.refresh();
      if (ok) {
        await new Promise(resolve => setTimeout(resolve, 150));
        const meData = await api.me();
        if (meData) {
          response = await fetch(`${API_BASE}/api/chat/ws-token`, { method: 'POST', credentials: 'include' });
        }
      }
    }
    if (!response.ok) throw new Error(`WS token failed (HTTP ${response.status})`);
    return response.json();
  }
  ,
  // Create or get private conversation with a target user
  createPrivateChat: async (payload) => {
    const url = `${API_BASE}/api/chat/private`;
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    if (response.status === 401) {
      const ok = await api.refresh();
      if (ok) {
        await new Promise(resolve => setTimeout(resolve, 150));
        const meData = await api.me();
        if (meData) {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
          });
        }
      }
    }
    if (!response.ok) {
      let message = `Create private chat failed (HTTP ${response.status})`;
      try { const j = await response.json(); if (j?.message) message = j.message; } catch (e) { void e; }
      throw new Error(message);
    }
    return response.json();
  },
  // Create conversation via /api/chat/conversations endpoint
  createConversation: async (payload) => {
    const url = `${API_BASE}/api/chat/conversations`;
    const requestBody = JSON.stringify(payload);
    let response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
        credentials: 'include'
      });
    } catch (err) {
      console.error('[API] createConversation network error', {
        url,
        payload,
        error: err
      });
      throw err;
    }

    if (response.status === 401) {
      const ok = await api.refresh();
      if (ok) {
        await new Promise(resolve => setTimeout(resolve, 150));
        const meData = await api.me();
        if (meData) {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
            credentials: 'include'
          });
        }
      }
    }

    const rawBody = await response.text();
    let parsedBody = null;
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch (err) {
        console.warn('[API] createConversation response is not valid JSON', {
          url,
          status: response.status,
          rawBody
        });
      }
    }

    if (!response.ok) {
      const message = parsedBody?.message || rawBody || `Create conversation failed (HTTP ${response.status})`;
      console.error('[API] createConversation failed', {
        url,
        status: response.status,
        statusText: response.statusText,
        payload,
        responseBody: rawBody,
        parsedBody
      });
      throw new Error(`${message} (HTTP ${response.status})`);
    }

    if (!parsedBody) {
      console.error('[API] createConversation success but empty body', {
        url,
        status: response.status,
        payload
      });
      throw new Error('Create conversation succeeded but response body is empty');
    }

    return parsedBody;
  },
  // Update conversation avatar (multipart upload)
  updateConversationAvatar: async (conversationId, file) => {
    const url = `${API_BASE}/api/chat/conversations/${conversationId}/avatar`;
    const form = new FormData();
    form.append('file', file);
    try {
      let response = await fetch(url, {
        method: 'PUT',
        body: form,
        credentials: 'include'
      });
      if (response.status === 401) {
        const ok = await api.refresh();
        if (ok) {
          await new Promise(resolve => setTimeout(resolve, 150));
          const meData = await api.me();
          if (meData) {
            response = await fetch(url, { method: 'PUT', body: form, credentials: 'include' });
          }
        }
      }
      if (!response.ok) {
        let message = `Upload avatar failed (HTTP ${response.status})`;
        try { const j = await response.json(); if (j?.message) message = j.message; } catch (e) { void e; }
        throw new Error(message);
      }
      return response.json();
    } catch (err) {
      if (err?.message === 'Failed to fetch') throw new Error('Không thể kết nối tới backend.');
      throw err;
    }
  },

  // Update current user's avatar (multipart upload)
  updateMyAvatar: async (file) => {
    const url = `${API_BASE}/api/users/avatar`;
    const form = new FormData();
    form.append('file', file);

    try {
      let response = await fetch(url, {
        method: 'POST',
        body: form,
        credentials: 'include'
      });

      if (response.status === 401) {
        const ok = await api.refresh();
        if (ok) {
          await new Promise(resolve => setTimeout(resolve, 150));
          const meData = await api.me();
          if (meData) {
            response = await fetch(url, { method: 'POST', body: form, credentials: 'include' });
          }
        }
      }

      if (!response.ok) {
        let message = `Update avatar failed (HTTP ${response.status})`;
        try {
          const j = await response.json();
          if (j?.message) message = j.message;
        } catch (e) { void e; }
        throw new Error(message);
      }

      return response.json();
    } catch (err) {
      if (err?.message === 'Failed to fetch') throw new Error('Không thể kết nối tới backend.');
      throw err;
    }
  },

  // React to a message (toggle/add/update/remove)
  reactToMessage: async ({ messageId, reactionType }) => {
    // Backend expects /api/chat/reactions as defined in controller
    const url = `${API_BASE}/api/chat/reactions`;
    const body = JSON.stringify({
      targetId: messageId,
      reactionType,
      targetType: 'MESSAGE',
    });
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      credentials: 'include'
    });
    if (response.status === 401) {
      const ok = await api.refresh();
      if (ok) {
        await new Promise(resolve => setTimeout(resolve, 150));
        response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, credentials: 'include' });
      }
    }
    if (!response.ok) {
      let message = 'React failed';
      try { const e = await response.json(); message = e.message || message; } catch (e) { void e; }
      throw new Error(message + ` (HTTP ${response.status})`);
    }
    return response.json();
  },

  // Get detailed list of reactions for a message (lazy)
  getMessageReactions: async (messageId) => {
    const url = `${API_BASE}/api/chat/messages/${messageId}/reactions`;
    let response = await fetch(url, { method: 'GET', credentials: 'include' });
    if (response.status === 401) {
      const ok = await api.refresh();
      if (ok) {
        await new Promise(resolve => setTimeout(resolve, 150));
        response = await fetch(url, { method: 'GET', credentials: 'include' });
      }
    }
    if (!response.ok) {
      let message = 'Get reactions failed';
      try { const e = await response.json(); message = e.message || message; } catch (e) { void e; }
      throw new Error(message + ` (HTTP ${response.status})`);
    }
    return response.json();
  },
  // Logout: call backend to clear cookies
  logout: async () => {
    try {
      const resp = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      return resp.ok;
    } catch (e) { return false; }
  },

  // Generic PUT method for API calls
  put: async (endpoint, data) => {
    const url = `${API_BASE}${endpoint}`;
    try { console.log('[API] PUT', url); } catch (e) { }

    let response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });

    if (response.status === 401) {
      const ok = await api.refresh();
      if (ok) {
        await new Promise(resolve => setTimeout(resolve, 150));
        const meData = await api.me();
        if (meData) {
          response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
          });
        }
      }
    }

    if (!response.ok) {
      let message = 'PUT request failed';
      try { const e = await response.json(); message = e.message || message; } catch (e2) { void e2; }
      throw new Error(`${message} (HTTP ${response.status})`);
    }
    return response.json();
  }
};

export default api;