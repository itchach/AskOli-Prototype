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

  // ── DOM References: AI Settings Modal ──
  const openAiSettingsBtn = document.getElementById('open-ai-settings-btn');
  const settingsActiveDot = document.getElementById('settings-active-dot');
  const aiSettingsModal = document.getElementById('ai-settings-modal');
  const aiModalClose = document.getElementById('ai-modal-close');
  const aiModalCancel = document.getElementById('ai-modal-cancel');
  const aiSettingsForm = document.getElementById('ai-settings-form');
  const aiEnableToggle = document.getElementById('ai-enable-toggle');
  const aiProviderSelect = document.getElementById('ai-provider-select');
  const aiModeSelect = document.getElementById('ai-mode-select');
  const aiApiKey = document.getElementById('ai-api-key');
  const toggleKeyVisibility = document.getElementById('toggle-key-visibility');
  const aiModelInput = document.getElementById('ai-model-input');
  const aiModelPresets = document.getElementById('ai-model-presets');
  const customUrlGroup = document.getElementById('custom-url-group');
  const aiCustomUrl = document.getElementById('ai-custom-url');
  const testAiConnBtn = document.getElementById('test-ai-conn-btn');
  const testSpinner = document.getElementById('test-spinner');
  const testResultStatus = document.getElementById('test-result-status');

  // ── DOM References: Voice & Speech Settings ──
  const voiceQuickToggle = document.getElementById('voice-quick-toggle');
  const voiceSelect = document.getElementById('voice-select');
  const voiceAutoreadToggle = document.getElementById('voice-autoread-toggle');
  const voiceRateSlider = document.getElementById('voice-rate-slider');
  const voiceRateVal = document.getElementById('voice-rate-val');
  const voicePitchSlider = document.getElementById('voice-pitch-slider');
  const voicePitchVal = document.getElementById('voice-pitch-val');
  const testVoiceBtn = document.getElementById('test-voice-btn');

  // ── State ──
  let isProcessing = false;
  let currentSessionId = ChatHistory.getCurrentSessionId();
  let toastTimer = null;

  // ── Initialize Particle Background ──
  if (typeof Particles !== 'undefined') {
    Particles.init('particles-canvas');
  }

  // ── Initialize UI State ──
  _updateEngineBadge();
  _updateVoiceBadge();
  _loadInitialSession();
  _renderHistoryList();

  if (typeof VoiceEngine !== 'undefined') {
    VoiceEngine.onVoicesReady(_populateVoiceSelect);
  }

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

  // ── AI Settings Modal Controls ──
  if (openAiSettingsBtn) openAiSettingsBtn.addEventListener('click', _openAiSettings);
  if (aiModalClose) aiModalClose.addEventListener('click', _closeAiSettings);
  if (aiModalCancel) aiModalCancel.addEventListener('click', _closeAiSettings);
  if (aiSettingsModal) {
    aiSettingsModal.addEventListener('click', (e) => {
      if (e.target === aiSettingsModal) _closeAiSettings();
    });
  }

  aiProviderSelect.addEventListener('change', _onProviderChange);
  aiModelPresets.addEventListener('change', () => {
    if (aiModelPresets.value) {
      aiModelInput.value = aiModelPresets.value;
    }
  });

  toggleKeyVisibility.addEventListener('click', () => {
    const isPass = aiApiKey.type === 'password';
    aiApiKey.type = isPass ? 'text' : 'password';
    toggleKeyVisibility.style.color = isPass ? 'var(--accent-cyan)' : 'var(--text-muted)';
  });

  testAiConnBtn.addEventListener('click', _runConnectionTest);
  aiSettingsForm.addEventListener('submit', _handleSaveAiSettings);

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

  if (voiceRateSlider && voiceRateVal) {
    voiceRateSlider.addEventListener('input', () => {
      voiceRateVal.textContent = parseFloat(voiceRateSlider.value).toFixed(1) + 'x';
    });
  }

  if (voicePitchSlider && voicePitchVal) {
    voicePitchSlider.addEventListener('input', () => {
      const val = parseFloat(voicePitchSlider.value);
      voicePitchVal.textContent = val < 0.9 ? 'Deep' : val > 1.1 ? 'High' : 'Normal';
    });
  }

  if (testVoiceBtn) {
    testVoiceBtn.addEventListener('click', () => {
      if (typeof VoiceEngine === 'undefined') return;
      const tempVoiceURI = voiceSelect ? voiceSelect.value : '';
      const tempRate = voiceRateSlider ? parseFloat(voiceRateSlider.value) : 1.0;
      const tempPitch = voicePitchSlider ? parseFloat(voicePitchSlider.value) : 1.0;
      VoiceEngine.speak("Hello! I am AskOli, your voice information assistant for Olivarez College.", {
        force: true,
        rate: tempRate,
        pitch: tempPitch,
        voiceURI: tempVoiceURI
      });
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

  // ============================================
  // AI Settings Modal & Integration
  // ============================================

  function _openAiSettings() {
    const s = AiApi.getSettings();
    aiEnableToggle.checked = Boolean(s.enabled);
    aiProviderSelect.value = s.provider || 'gemini';
    aiModeSelect.value = s.mode || 'hybrid_rag';
    aiApiKey.value = s.apiKey || '';
    aiModelInput.value = s.model || 'gemini-3.6-flash';
    aiCustomUrl.value = s.customBaseUrl || 'http://localhost:11434/v1';

    // Populate Voice Settings
    if (typeof VoiceEngine !== 'undefined') {
      const v = VoiceEngine.getSettings();
      if (voiceAutoreadToggle) voiceAutoreadToggle.checked = Boolean(v.autoRead);
      if (voiceRateSlider) {
        voiceRateSlider.value = v.rate || 1.0;
        if (voiceRateVal) voiceRateVal.textContent = parseFloat(v.rate || 1.0).toFixed(1) + 'x';
      }
      if (voicePitchSlider) {
        voicePitchSlider.value = v.pitch || 1.0;
        if (voicePitchVal) {
          const p = v.pitch || 1.0;
          voicePitchVal.textContent = p < 0.9 ? 'Deep' : p > 1.1 ? 'High' : 'Normal';
        }
      }
      _populateVoiceSelect();
    }

    _onProviderChange();
    testResultStatus.textContent = 'Ready to test connection.';
    testResultStatus.className = 'test-result-status';

    aiSettingsModal.classList.add('active');
  }

  function _closeAiSettings() {
    aiSettingsModal.classList.remove('active');
  }

  function _onProviderChange() {
    const prov = aiProviderSelect.value;
    const presets = AiApi.PROVIDER_PRESETS[prov];

    customUrlGroup.style.display = prov === 'custom' ? 'block' : 'none';

    // Populate model presets
    aiModelPresets.innerHTML = '<option value="">Model Presets</option>';
    if (presets && presets.models) {
      presets.models.forEach(m => {
        aiModelPresets.innerHTML += `<option value="${m}">${m}</option>`;
      });
    }

    if (!aiModelInput.value || (presets && !presets.models.includes(aiModelInput.value))) {
      aiModelInput.value = presets?.defaultModel || '';
    }
  }

  async function _runConnectionTest() {
    testSpinner.style.display = 'inline';
    testResultStatus.textContent = 'Testing connection to AI Provider...';
    testResultStatus.className = 'test-result-status';

    const tempSettings = {
      enabled: aiEnableToggle.checked,
      provider: aiProviderSelect.value,
      mode: aiModeSelect.value,
      apiKey: aiApiKey.value.trim(),
      model: aiModelInput.value.trim(),
      customBaseUrl: aiCustomUrl.value.trim()
    };

    const res = await AiApi.testConnection(tempSettings);
    testSpinner.style.display = 'none';

    testResultStatus.textContent = res.message;
    testResultStatus.className = `test-result-status ${res.success ? 'success' : 'error'}`;
  }

  function _handleSaveAiSettings(e) {
    e.preventDefault();

    const saved = AiApi.saveSettings({
      enabled: aiEnableToggle.checked,
      provider: aiProviderSelect.value,
      mode: aiModeSelect.value,
      apiKey: aiApiKey.value.trim(),
      model: aiModelInput.value.trim(),
      customBaseUrl: aiCustomUrl.value.trim()
    });

    if (typeof VoiceEngine !== 'undefined') {
      VoiceEngine.saveSettings({
        autoRead: voiceAutoreadToggle ? voiceAutoreadToggle.checked : false,
        voiceURI: voiceSelect ? voiceSelect.value : '',
        rate: voiceRateSlider ? parseFloat(voiceRateSlider.value) : 1.0,
        pitch: voicePitchSlider ? parseFloat(voicePitchSlider.value) : 1.0
      });
      _updateVoiceBadge();
    }

    _updateEngineBadge();
    _closeAiSettings();
    _showToast('System & Voice Settings updated successfully!');
  }

  function _populateVoiceSelect() {
    if (!voiceSelect || typeof VoiceEngine === 'undefined') return;
    const voices = VoiceEngine.getVoices();
    const currentSettings = VoiceEngine.getSettings();

    if (voices.length === 0) {
      voiceSelect.innerHTML = '<option value="">Default Browser Voice</option>';
      return;
    }

    let html = '';
    const currentURI = currentSettings.voiceURI;

    // Group into English, Tagalog/Filipino, and Other
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    const tlVoices = voices.filter(v => v.lang.startsWith('fil') || v.lang.startsWith('tl'));
    const otherVoices = voices.filter(v => !v.lang.startsWith('en') && !v.lang.startsWith('fil') && !v.lang.startsWith('tl'));

    if (tlVoices.length > 0) {
      html += '<optgroup label="Filipino / Tagalog">';
      tlVoices.forEach(v => {
        const isSel = (v.voiceURI === currentURI || v.name === currentURI) ? 'selected' : '';
        html += `<option value="${v.voiceURI}" ${isSel}>${v.name} (${v.lang})</option>`;
      });
      html += '</optgroup>';
    }

    if (enVoices.length > 0) {
      html += '<optgroup label="English Voices">';
      enVoices.forEach(v => {
        const isSel = (v.voiceURI === currentURI || v.name === currentURI) ? 'selected' : '';
        html += `<option value="${v.voiceURI}" ${isSel}>${v.name} (${v.lang})</option>`;
      });
      html += '</optgroup>';
    }

    if (otherVoices.length > 0) {
      html += '<optgroup label="Other Installed Voices">';
      otherVoices.forEach(v => {
        const isSel = (v.voiceURI === currentURI || v.name === currentURI) ? 'selected' : '';
        html += `<option value="${v.voiceURI}" ${isSel}>${v.name} (${v.lang})</option>`;
      });
      html += '</optgroup>';
    }

    voiceSelect.innerHTML = html;
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

  function _updateEngineBadge() {
    const s = AiApi.getSettings();
    const isExternalActive = Boolean(s.enabled && s.apiKey && s.mode !== 'local_only');

    if (settingsActiveDot) {
      settingsActiveDot.style.display = isExternalActive ? 'block' : 'none';
    }

    if (openAiSettingsBtn) {
      if (isExternalActive) {
        const provName = s.provider === 'gemini' ? 'Gemini' : s.provider.toUpperCase();
        openAiSettingsBtn.title = `AI Settings — Active: ${provName} (${s.model || 'Default'})`;
        openAiSettingsBtn.style.borderColor = 'var(--border-accent)';
        openAiSettingsBtn.style.color = 'var(--accent-cyan)';
      } else {
        openAiSettingsBtn.title = 'AI & System Settings (Local Engine Active)';
        openAiSettingsBtn.style.borderColor = 'var(--border-subtle)';
        openAiSettingsBtn.style.color = 'var(--text-secondary)';
      }
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
