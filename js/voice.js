/* ============================================
   AskOli — Voice & Text-to-Speech Engine
   Changeable Voices, Pitch, Speed & Auto-read
   ============================================ */

const VoiceEngine = (() => {
  const SETTINGS_KEY = 'askoli_voice_settings';

  const DEFAULT_SETTINGS = {
    enabled: true,
    autoRead: false,
    voiceURI: '',
    rate: 1.0, // 0.6 to 1.8
    pitch: 1.0, // 0.6 to 1.5
    volume: 1.0
  };

  let _voices = [];
  let _currentUtterance = null;
  let _activeSpeakerBtn = null;
  let _onVoicesChangedCallbacks = [];

  const isSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  // Initialize Voice Loading
  if (isSupported) {
    _loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        _loadVoices();
        _notifyVoiceListeners();
      };
    }
  }

  function _loadVoices() {
    if (!isSupported) return;
    _voices = window.speechSynthesis.getVoices() || [];
  }

  function _notifyVoiceListeners() {
    _onVoicesChangedCallbacks.forEach(cb => {
      try { cb(_voices); } catch (e) { console.error(e); }
    });
  }

  function onVoicesReady(callback) {
    if (typeof callback !== 'function') return;
    _onVoicesChangedCallbacks.push(callback);
    if (_voices.length > 0) {
      callback(_voices);
    }
  }

  function getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(newSettings) {
    try {
      const current = getSettings();
      const updated = { ...current, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error saving voice settings:', e);
      return getSettings();
    }
  }

  function getVoices() {
    if (_voices.length === 0 && isSupported) {
      _voices = window.speechSynthesis.getVoices() || [];
    }
    return _voices;
  }

  /**
   * Cleans HTML / Markdown markup into clean conversational plain text for speech synthesis.
   */
  function cleanTextForSpeech(textOrHtml) {
    if (!textOrHtml) return '';
    let text = textOrHtml;

    // Convert HTML elements if given HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    text = tempDiv.textContent || tempDiv.innerText || '';

    // Clean markdown elements
    text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, ''); // remove images
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); // links to anchor text
    text = text.replace(/```[\s\S]*?```/g, 'Code block omitted.'); // code blocks
    text = text.replace(/`([^`]+)`/g, '$1'); // inline code
    text = text.replace(/[#*_\->~]/g, ' '); // markdown headers, bold, bullets
    text = text.replace(/•/g, ', '); // bullet points to pauses
    text = text.replace(/\s+/g, ' ').trim(); // normalize whitespace

    return text;
  }

  /**
   * Speak text out loud with currently selected voice settings.
   */
  function speak(textOrHtml, options = {}) {
    if (!isSupported) {
      if (options.onError) options.onError(new Error('Speech Synthesis not supported in this browser.'));
      return false;
    }

    const settings = getSettings();
    if (!settings.enabled && !options.force) {
      return false;
    }

    // Stop any ongoing speech
    stop();

    const plainText = cleanTextForSpeech(textOrHtml);
    if (!plainText) return false;

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = options.rate !== undefined ? options.rate : (settings.rate || 1.0);
    utterance.pitch = options.pitch !== undefined ? options.pitch : (settings.pitch || 1.0);
    utterance.volume = options.volume !== undefined ? options.volume : (settings.volume || 1.0);

    // Pick selected voice or suitable default
    const voices = getVoices();
    if (voices.length > 0) {
      let selectedVoice = null;

      if (settings.voiceURI) {
        selectedVoice = voices.find(v => v.voiceURI === settings.voiceURI || v.name === settings.voiceURI);
      }

      if (!selectedVoice) {
        // Look for English or Natural/Online voices first
        selectedVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google')) && v.lang.startsWith('en'))
          || voices.find(v => v.lang.startsWith('en'))
          || voices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }
    }

    utterance.onstart = () => {
      _currentUtterance = utterance;
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      _currentUtterance = null;
      if (_activeSpeakerBtn) {
        _setSpeakerBtnState(_activeSpeakerBtn, false);
        _activeSpeakerBtn = null;
      }
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      _currentUtterance = null;
      if (_activeSpeakerBtn) {
        _setSpeakerBtnState(_activeSpeakerBtn, false);
        _activeSpeakerBtn = null;
      }
      if (options.onError) options.onError(e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  function stop() {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    _currentUtterance = null;
    if (_activeSpeakerBtn) {
      _setSpeakerBtnState(_activeSpeakerBtn, false);
      _activeSpeakerBtn = null;
    }
  }

  function isSpeaking() {
    if (!isSupported) return false;
    return window.speechSynthesis.speaking;
  }

  function toggleSpeakMessage(text, buttonEl) {
    if (isSpeaking() && _activeSpeakerBtn === buttonEl) {
      stop();
      return false;
    }

    stop();
    _activeSpeakerBtn = buttonEl;
    _setSpeakerBtnState(buttonEl, true);

    const success = speak(text, {
      force: true, // User explicitly clicked speaker button
      onStart: () => {
        _setSpeakerBtnState(buttonEl, true);
      },
      onEnd: () => {
        _setSpeakerBtnState(buttonEl, false);
        _activeSpeakerBtn = null;
      },
      onError: () => {
        _setSpeakerBtnState(buttonEl, false);
        _activeSpeakerBtn = null;
      }
    });

    if (!success) {
      _setSpeakerBtnState(buttonEl, false);
      _activeSpeakerBtn = null;
    }
    return success;
  }

  function _setSpeakerBtnState(buttonEl, isSpeaking) {
    if (!buttonEl) return;
    if (isSpeaking) {
      buttonEl.classList.add('speaking');
      buttonEl.setAttribute('title', 'Stop reading aloud');
      buttonEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <rect x="6" y="5" width="4" height="14" rx="1"/>
          <rect x="14" y="5" width="4" height="14" rx="1"/>
        </svg>
        <span class="soundwave-anim">
          <span></span><span></span><span></span>
        </span>
      `;
    } else {
      buttonEl.classList.remove('speaking');
      buttonEl.setAttribute('title', 'Read answer aloud (Text to Speech)');
      buttonEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      `;
    }
  }

  return {
    isSupported,
    getSettings,
    saveSettings,
    getVoices,
    onVoicesReady,
    cleanTextForSpeech,
    speak,
    stop,
    isSpeaking,
    toggleSpeakMessage
  };
})();
