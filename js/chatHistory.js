/* ============================================
   AskOli — Chat History & Session Management
   Persists conversations to localStorage
   ============================================ */

const ChatHistory = (() => {
  const SESSIONS_KEY = 'askoli_sessions';
  const CURRENT_SESSION_KEY = 'askoli_current_session_id';

  function _uid() {
    return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function _loadSessions() {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error loading chat history:', e);
      return [];
    }
  }

  function _saveSessions(sessions) {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  }

  function getAllSessions() {
    const sessions = _loadSessions();
    // Sort by updatedAt descending
    return sessions.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }

  function getSession(id) {
    if (!id) return null;
    const sessions = _loadSessions();
    return sessions.find(s => s.id === id) || null;
  }

  function createSession(initialTitle = 'New Conversation') {
    const sessions = _loadSessions();
    const newSession = {
      id: _uid(),
      title: initialTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    sessions.unshift(newSession);
    _saveSessions(sessions);
    setCurrentSessionId(newSession.id);
    return newSession;
  }

  function updateSession(id, updates) {
    const sessions = _loadSessions();
    const idx = sessions.findIndex(s => s.id === id);
    if (idx === -1) return null;

    sessions[idx] = {
      ...sessions[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    _saveSessions(sessions);
    return sessions[idx];
  }

  function addMessageToSession(id, message) {
    const sessions = _loadSessions();
    let session = sessions.find(s => s.id === id);
    
    if (!session) {
      session = {
        id: id || _uid(),
        title: message.content ? message.content.slice(0, 32) + '...' : 'Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };
      sessions.unshift(session);
    }

    const msgObj = {
      id: 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      role: message.role || 'user',
      content: message.content || '',
      html: message.html || null,
      source: message.source || null,
      modelUsed: message.modelUsed || null,
      timestamp: new Date().toISOString()
    };

    session.messages.push(msgObj);
    session.updatedAt = new Date().toISOString();

    // Auto-update title if it's the default and user sent first message
    if (session.messages.length <= 2 && message.role === 'user' && (!session.title || session.title === 'New Conversation')) {
      const cleanTitle = message.content.replace(/[^\w\s]/gi, '').trim();
      session.title = cleanTitle.length > 36 ? cleanTitle.slice(0, 36) + '...' : cleanTitle || 'Conversation';
    }

    _saveSessions(sessions);
    return msgObj;
  }

  function deleteSession(id) {
    let sessions = _loadSessions();
    const filtered = sessions.filter(s => s.id !== id);
    _saveSessions(filtered);

    if (getCurrentSessionId() === id) {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
    return filtered;
  }

  function clearAllSessions() {
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }

  function getCurrentSessionId() {
    return localStorage.getItem(CURRENT_SESSION_KEY) || null;
  }

  function setCurrentSessionId(id) {
    if (id) {
      localStorage.setItem(CURRENT_SESSION_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  }

  function searchSessions(query) {
    if (!query || !query.trim()) return getAllSessions();
    const q = query.toLowerCase().trim();
    const sessions = getAllSessions();

    return sessions.filter(s => {
      if (s.title && s.title.toLowerCase().includes(q)) return true;
      return s.messages && s.messages.some(m => m.content && m.content.toLowerCase().includes(q));
    });
  }

  return {
    getAllSessions,
    getSession,
    createSession,
    updateSession,
    addMessageToSession,
    deleteSession,
    clearAllSessions,
    getCurrentSessionId,
    setCurrentSessionId,
    searchSessions
  };
})();
