/* ============================================
   AskOli — Main Chat UI & Session Controller
   Wires Chat, History Sidebar, and External AI API
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ── DOM References: Chat Core ──
  const welcomeScreen = document.getElementById('welcome-screen');
  const chatConversation = document.getElementById('chat-conversation');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const newChatBtn = document.getElementById('new-chat-btn');
  const typingIndicator = document.getElementById('typing-indicator');
  const suggestionCards = document.querySelectorAll('.suggestion-card');
  const chatToast = document.getElementById('chat-toast');

  // ── DOM References: Sidebar & History ──
  const sidebar = document.getElementById('chat-sidebar');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarNewBtn = document.getElementById('sidebar-new-btn');
  const historyList = document.getElementById('history-list');
  const historySearchInput = document.getElementById('history-search-input');
  const sessionCountLabel = document.getElementById('session-count-label');
  const clearHistoryBtn = document.getElementById('clear-history-btn');


  // ── DOM References: Voice & Speech Settings ──
  const voiceQuickToggle = document.getElementById('voice-quick-toggle');


  // ── State ──
  let isProcessing = false;
  let currentSessionId = ChatHistory.getCurrentSessionId();
  let toastTimer = null;

  // ── Initialize Particle Background ──
  if (typeof Particles !== 'undefined') {
    Particles.init('particles-canvas');
  }

  // ── Initialize UI State ──
  _updateVoiceBadge();
  _loadInitialSession();
  _renderHistoryList();
  // ── Auto-resize Chat Textarea ──
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  // ── Enter key to send ──
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      _handleSendMessage();
    }
  });

  // ── Send button click ──
  sendBtn.addEventListener('click', _handleSendMessage);

  // ── New Chat Buttons ──
  newChatBtn.addEventListener('click', _startNewChat);
  sidebarNewBtn.addEventListener('click', _startNewChat);

  // ── Suggestion cards ──
  suggestionCards.forEach(card => {
    card.addEventListener('click', () => {
      const question = card.getAttribute('data-question');
      if (question) {
        chatInput.value = question;
        _handleSendMessage();
      }
    });
  });

  // ── Sidebar Controls ──
  sidebarToggleBtn.addEventListener('click', _toggleSidebar);
  sidebarOverlay.addEventListener('click', _closeMobileSidebar);

  historySearchInput.addEventListener('input', () => {
    _renderHistoryList(historySearchInput.value.trim());
  });

  clearHistoryBtn.addEventListener('click', () => {
    const count = ChatHistory.getAllSessions().length;
    if (count === 0) {
      _showToast('No chat history to clear.');
      return;
    }
    if (confirm('Are you sure you want to delete all conversation history? This cannot be undone.')) {
      ChatHistory.clearAllSessions();
      currentSessionId = null;
      _startNewChat();
      _renderHistoryList();
      _showToast('All conversation history cleared.');
    }
  });



  // ── Voice & Speech Controls Listeners ──
  if (voiceQuickToggle) {
    voiceQuickToggle.addEventListener('click', () => {
      if (typeof VoiceEngine === 'undefined') return;
      const v = VoiceEngine.getSettings();
      const newEnabled = !v.enabled;
      VoiceEngine.saveSettings({ enabled: newEnabled });
      _updateVoiceBadge();
      _showToast(newEnabled ? '🔊 Voice speech enabled' : '🔇 Voice speech muted');
      if (!newEnabled) VoiceEngine.stop();
    });
  }



  // ============================================
  // Message Handling & Session Flow
  // ============================================

  async function _handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text || isProcessing) return;

    // Ensure we have an active session
    if (!currentSessionId) {
      const session = ChatHistory.createSession(text.slice(0, 32));
      currentSessionId = session.id;
    }

    _showConversation();

    // Append User Message to UI and Storage
    _appendMessage('user', text);
    ChatHistory.addMessageToSession(currentSessionId, {
      role: 'user',
      content: text
    });

    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Show AI typing animation
    _showTyping();
    isProcessing = true;

    // Update history list in real time (titles might change)
    _renderHistoryList();

    try {
      // Process with Hybrid Chat Engine (External AI or Local RAG Match)
      const response = await ChatEngine.processMessage(text);

      _hideTyping();

      // Render Bot response
      const botMsgEl = _appendMessage('bot', response.html, true, response.modelUsed, response.source);

      // Auto-read response if enabled
      if (typeof VoiceEngine !== 'undefined') {
        const v = VoiceEngine.getSettings();
        if (v.enabled && v.autoRead) {
          const speakerBtn = botMsgEl ? botMsgEl.querySelector('.msg-speaker-btn') : null;
          if (speakerBtn) {
            VoiceEngine.toggleSpeakMessage(response.raw || response.html, speakerBtn);
          }
        }
      }

      // Save Bot Message to Session History
      ChatHistory.addMessageToSession(currentSessionId, {
        role: 'bot',
        content: response.raw || response.html,
        html: response.html,
        source: response.source || null,
        modelUsed: response.modelUsed || null
      });

      _renderHistoryList();
    } catch (err) {
      _hideTyping();
      const errMsg = "I encountered a processing error. Please check your AI API connection or try again.";
      _appendMessage('bot', `<p class="text-error" style="color:var(--status-error);">${errMsg}</p>`, true);
      console.error('Chat processing error:', err);
    } finally {
      isProcessing = false;
      chatInput.focus();
    }
  }

  function _appendMessage(role, content, isHtml = false, modelUsed = null, source = null) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    if (role === 'bot') {
      const modelBadgeHtml = modelUsed ? `<span class="msg-model-badge">${_escapeHtml(modelUsed)}</span>` : '';
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      messageEl.innerHTML = `
        <div class="message-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
            <path d="M16 14H8a4 4 0 0 0-4 4v2h16v-2a4 4 0 0 0-4-4z"/>
            <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        <div class="message-bubble">
          <div class="message-meta">
            <div class="message-meta-left">
              ${modelBadgeHtml}
              <span style="color:var(--text-muted); font-size:10px;">${timeStr}</span>
            </div>
            <div class="message-meta-right">
              <button class="msg-speaker-btn" title="Read answer aloud (Text to Speech)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="message-content">${isHtml ? content : _escapeHtml(content)}</div>
        </div>
      `;

      const speakerBtn = messageEl.querySelector('.msg-speaker-btn');
      if (speakerBtn && typeof VoiceEngine !== 'undefined') {
        speakerBtn.addEventListener('click', () => {
          VoiceEngine.toggleSpeakMessage(content, speakerBtn);
        });
      }
    } else {
      messageEl.innerHTML = `
        <div class="message-bubble">
          <div class="message-content">${_escapeHtml(content)}</div>
        </div>
      `;
    }

    chatMessages.appendChild(messageEl);
    _scrollToBottom();
    return messageEl;
  }

  function _showConversation() {
    welcomeScreen.classList.add('hidden');
    chatConversation.classList.add('active');
  }

  function _startNewChat() {
    ChatEngine.resetContext();
    currentSessionId = null;
    ChatHistory.setCurrentSessionId(null);
    chatMessages.innerHTML = '';
    chatConversation.classList.remove('active');
    welcomeScreen.classList.remove('hidden');
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.focus();
    _renderHistoryList();
    _closeMobileSidebar();
  }

  function _loadInitialSession() {
    if (currentSessionId) {
      const session = ChatHistory.getSession(currentSessionId);
      if (session && session.messages && session.messages.length > 0) {
        _loadSession(session);
        return;
      }
    }
    // Start fresh welcome screen
    _startNewChat();
  }

  function _loadSession(session) {
    if (!session) return;
    currentSessionId = session.id;
    ChatHistory.setCurrentSessionId(session.id);

    // Populate engine context
    const engineHistory = session.messages.map(m => ({
      role: m.role,
      text: m.content || ''
    }));
    ChatEngine.setHistory(engineHistory);

    chatMessages.innerHTML = '';
    _showConversation();

    session.messages.forEach(msg => {
      _appendMessage(
        msg.role,
        msg.html || msg.content,
        Boolean(msg.html),
        msg.modelUsed,
        msg.source
      );
    });

    _renderHistoryList();
    _closeMobileSidebar();
  }

  function _showTyping() {
    typingIndicator.classList.add('active');
    _scrollToBottom();
  }

  function _hideTyping() {
    typingIndicator.classList.remove('active');
  }

  function _scrollToBottom() {
    requestAnimationFrame(() => {
      chatConversation.scrollTop = chatConversation.scrollHeight;
    });
  }

  // ============================================
  // History Sidebar UI
  // ============================================

  function _toggleSidebar() {
    if (window.innerWidth <= 900) {
      const isActive = sidebar.classList.contains('active-mobile');
      sidebar.classList.toggle('active-mobile', !isActive);
      sidebarOverlay.classList.toggle('active', !isActive);
    } else {
      sidebar.classList.toggle('collapsed');
    }
  }

  function _closeMobileSidebar() {
    sidebar.classList.remove('active-mobile');
    sidebarOverlay.classList.remove('active');
  }

  function _renderHistoryList(searchQuery = '') {
    const sessions = searchQuery ? ChatHistory.searchSessions(searchQuery) : ChatHistory.getAllSessions();
    sessionCountLabel.textContent = `${sessions.length} conversation${sessions.length === 1 ? '' : 's'}`;

    if (sessions.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>${searchQuery ? 'No matching chats found' : 'No previous chats yet'}</span>
        </div>
      `;
      return;
    }

    historyList.innerHTML = sessions.map(session => {
      const isActive = session.id === currentSessionId;
      const formattedDate = _formatTimeAgo(session.updatedAt || session.createdAt);

      return `
        <div class="history-item ${isActive ? 'active' : ''}" data-id="${session.id}">
          <div class="history-item-content">
            <span class="history-item-title">${_escapeHtml(session.title || 'Conversation')}</span>
            <span class="history-item-time">${formattedDate}</span>
          </div>
          <button class="history-item-delete" data-delete-id="${session.id}" title="Delete chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-2 14H7L5 6"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    // Attach click handlers
    historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.history-item-delete')) return;
        const id = item.dataset.id;
        const session = ChatHistory.getSession(id);
        if (session) _loadSession(session);
      });
    });

    historyList.querySelectorAll('.history-item-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        ChatHistory.deleteSession(id);
        if (currentSessionId === id) {
          _startNewChat();
        }
        _renderHistoryList(historySearchInput.value.trim());
        _showToast('Conversation deleted.');
      });
    });
  }


  function _updateVoiceBadge() {
    if (!voiceQuickToggle || typeof VoiceEngine === 'undefined') return;
    const v = VoiceEngine.getSettings();
    if (v.enabled) {
      voiceQuickToggle.classList.remove('muted');
      voiceQuickToggle.classList.add('active');
      voiceQuickToggle.title = 'Voice Output Active — Click to Mute';
      const wave = voiceQuickToggle.querySelector('#voice-icon-waves');
      if (wave) wave.style.display = 'block';
    } else {
      voiceQuickToggle.classList.remove('active');
      voiceQuickToggle.classList.add('muted');
      voiceQuickToggle.title = 'Voice Output Muted — Click to Unmute';
      const wave = voiceQuickToggle.querySelector('#voice-icon-waves');
      if (wave) wave.style.display = 'none';
    }
  }


  // ============================================
  // Helpers
  // ============================================

  function _showToast(msg) {
    chatToast.textContent = msg;
    chatToast.className = 'toast visible';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      chatToast.classList.remove('visible');
    }, 3000);
  }

  function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function _formatTimeAgo(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
});
