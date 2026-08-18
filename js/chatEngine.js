/* ============================================
   AskOli — Chat Response Engine
   Hybrid RAG (External AI + Local Knowledge Base Fallback)
   ============================================ */

const ChatEngine = (() => {
  // ── Conversation context ──
  let _context = {
    lastCategory: null,
    lastEntryId: null,
    lastTopicKeywords: [],
    history: [] // { role: 'user'|'bot', text: '' }
  };

  // ── Olivarez-related keywords (used to determine if query is in-scope) ──
  const OLIVAREZ_KEYWORDS = [
    'olivarez', 'college', 'school', 'campus', 'university',
    'enroll', 'enrollment', 'enrolment', 'register', 'registration',
    'tuition', 'fee', 'payment', 'cashier', 'pay',
    'registrar', 'record', 'transcript', 'tor', 'diploma', 'certificate',
    'document', 'request', 'form', 'clearance',
    'requirement', 'requirements', 'needed', 'submit',
    'schedule', 'class', 'subject', 'course', 'curriculum', 'program',
    'grade', 'grading', 'gwa', 'exam', 'examination', 'midterm', 'final',
    'teacher', 'professor', 'instructor', 'faculty', 'dean', 'department',
    'student', 'id', 'handbook', 'manual',
    'library', 'lab', 'laboratory', 'computer', 'gymnasium', 'gym', 'chapel',
    'office', 'guidance', 'counseling', 'admissions', 'admission',
    'scholarship', 'financial', 'assistance',
    'uniform', 'dress', 'code', 'attendance', 'absent', 'absence',
    'policy', 'rule', 'regulation', 'violation', 'disciplinary',
    'organization', 'org', 'club', 'society', 'council',
    'portal', 'online', 'account', 'login', 'password',
    'transfer', 'transferee', 'shifting', 'shift',
    'good moral', 'moral', 'character',
    'clinic', 'health', 'nurse', 'medical',
    'calendar', 'academic', 'semester', 'year',
    'facility', 'facilities', 'building', 'room', 'location', 'where',
    'procedure', 'step', 'process', 'how',
    'service', 'services',
    'bsit', 'bsba', 'bscrim', 'bsed', 'beed', 'bshm', 'bstm',
    'senior high', 'shs', 'stem', 'abm', 'humss', 'tvl',
    'contact', 'email', 'phone', 'address',
    'hours', 'open', 'time', 'schedule',
    'apply', 'application', 'admit', 'entrance', 'interview',
    'clearance', 'claim', 'release',
    'intramurals', 'sports', 'pe', 'physical education',
    'mass', 'ministry', 'retreat', 'recollection',
    'sucat', 'parañaque', 'paranaque',
    'replacement', 'lost', 'replace',
    'credit', 'evaluation', 'overload', 'underload',
    'outreach', 'community',
    'refund', 'assessment', 'balance',
    'faq', 'question', 'information', 'info',
    'ask', 'askoli', 'oli'
  ];

  // ── Out-of-scope rejection messages ──
  const REJECTION_MESSAGES = [
    "I'm sorry, but I can only provide information related to **Olivarez College**. If you have any questions about the school's programs, services, procedures, or policies, feel free to ask!",
    "That question falls outside my area of expertise. I'm specifically designed to assist with **Olivarez College** information only. Try asking about enrollment, documents, facilities, or school policies!",
    "I appreciate your curiosity, but I can only answer questions about **Olivarez College**. Please ask me about school procedures, requirements, offices, or other campus-related topics.",
    "I'm AskOli — your AI assistant exclusively for **Olivarez College** information. I can't help with that question, but I'd love to assist you with anything about the school!"
  ];

  // ── No-match messages (in-scope but no KB entry found) ──
  const NO_MATCH_MESSAGES = [
    "I'm sorry, but I don't have enough information in my Olivarez College knowledge base to answer that accurately. Please contact the appropriate school office for further assistance.",
    "That's a great question about Olivarez College, but I don't have the specific information available right now. I recommend visiting the relevant school office or checking the official school website for the most accurate details.",
    "I wasn't able to find specific information about that in my knowledge base. For the most up-to-date and accurate answer, please reach out to the appropriate Olivarez College office directly."
  ];

  // ── Greeting patterns ──
  const GREETING_PATTERNS = [
    /^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|greetings|sup|yo)\b/i,
    /^(what's up|whats up|how are you)\b/i
  ];

  const GREETING_RESPONSES = [
    "Hello! 👋 I'm **AskOli**, your AI-based information assistant for **Olivarez College**.\n\nHow can I help you today? You can ask me about:\n• Document requests and procedures\n• Enrollment requirements\n• School facilities and offices\n• Policies and services\n• Academic information\n\nJust type your question below!",
    "Hi there! 👋 Welcome to **AskOli**!\n\nI'm here to help you with any questions about **Olivarez College**. Whether it's about enrollment, documents, school services, or campus facilities — just ask away!",
    "Good day! 😊 I'm **AskOli**, your dedicated Olivarez College information assistant.\n\nFeel free to ask me anything about the school — from procedures and requirements to facilities and policies. I'm here to help!"
  ];

  // ── Thank-you patterns ──
  const THANKS_PATTERNS = [
    /^(thank|thanks|ty|thank you|salamat|tnx|thx)\b/i
  ];

  const THANKS_RESPONSES = [
    "You're welcome! 😊 If you have more questions about Olivarez College, feel free to ask anytime!",
    "Glad I could help! Don't hesitate to ask if you need anything else about Olivarez College.",
    "You're welcome! I'm always here to help with your Olivarez College questions. 😊"
  ];

  // ── Help/capability patterns ──
  const HELP_PATTERNS = [
    /what can you (do|help|answer|tell)/i,
    /what (are you|do you do)/i,
    /help me/i,
    /how (do|can) (i|you) (use|work)/i
  ];

  const HELP_RESPONSE = "I'm **AskOli**, an AI-based information assistant designed exclusively for **Olivarez College**. Here's what I can help you with:\n\n📄 **Documents** — How to request TOR, Good Moral, Diploma, and other documents\n📋 **Procedures** — Step-by-step guides for enrollment, clearance, transfers, etc.\n📝 **Requirements** — What documents and items you need for various processes\n🏫 **Facilities** — Information about the library, labs, gymnasium, chapel, etc.\n🏢 **Offices** — Locations, services, and hours of school offices\n📜 **Policies** — School rules on uniforms, attendance, academic honesty, etc.\n🎓 **Academic Info** — Programs, grading system, academic calendar\n❓ **FAQs** — Tuition fees, school hours, contact information\n\nJust type your question and I'll do my best to help!";

  function _randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function _tokenize(text) {
    const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'it', 'this', 'that', 'do', 'does', 'how', 'what', 'where', 'when', 'who', 'which', 'can', 'i', 'my', 'me', 'we', 'our', 'you', 'your', 'about', 'with', 'from', 'by', 'be', 'been', 'being', 'have', 'has', 'had', 'please', 'tell']);
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w));
  }

  function _isInScope(query) {
    const lower = query.toLowerCase();

    for (const kw of OLIVAREZ_KEYWORDS) {
      if (lower.includes(kw)) {
        return true;
      }
    }

    // Check if query directly matches any KB title/content
    const kbMatches = KnowledgeBase.searchEntries(query);
    if (kbMatches.length > 0 && kbMatches[0].score >= 8) {
      return true;
    }

    // Only consider in-scope via context if it is a short follow-up query
    if (_context.lastCategory || _context.lastEntryId) {
      const tokens = _tokenize(lower);
      if (tokens.length <= 4 && /^(what|where|how|when|who|and|is|are|can|tell)\b/i.test(lower)) {
        return true;
      }
    }

    return false;
  }

  function _findAnswer(query) {
    const tokens = _tokenize(query);

    // 1. Direct Search FIRST without context pollution
    let results = KnowledgeBase.searchEntries(query);
    if (results.length > 0 && results[0].score >= 10) {
      const best = results[0];
      _context.lastCategory = best.entry.category;
      _context.lastEntryId = best.entry.id;
      _context.lastTopicKeywords = _tokenize(best.entry.title).slice(0, 4);
      return best.entry;
    }

    // 2. Only if direct match is weak and query is a genuine pronoun/follow-up question
    const isFollowUp = /^(what|where|how|when|who|and|tell|explain|is|are|can|how\s+much)\b/i.test(query) && tokens.length <= 4;
    if (isFollowUp && _context.lastTopicKeywords.length > 0) {
      const enhancedQuery = query + ' ' + _context.lastTopicKeywords.join(' ');
      const enhancedResults = KnowledgeBase.searchEntries(enhancedQuery);
      if (enhancedResults.length > 0 && enhancedResults[0].score >= 8) {
        return enhancedResults[0].entry;
      }
    }

    // 3. Fallback to best direct match if score is acceptable
    if (results.length > 0 && results[0].score >= 5) {
      const best = results[0];
      _context.lastCategory = best.entry.category;
      _context.lastEntryId = best.entry.id;
      _context.lastTopicKeywords = _tokenize(best.entry.title).slice(0, 4);
      return best.entry;
    }

    return null;
  }

  function _formatResponse(entry) {
    let html = '';
    const lines = entry.content.split('\n');
    let inList = false;
    let listType = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        if (inList) {
          html += listType === 'ul' ? '</ul>' : '</ol>';
          inList = false;
          listType = null;
        }
        continue;
      }

      if (/^\d+[\.\)]\s/.test(line)) {
        if (!inList || listType !== 'ol') {
          if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
          html += '<ol>';
          inList = true;
          listType = 'ol';
        }
        html += `<li>${_inlineFormat(line.replace(/^\d+[\.\)]\s*/, ''))}</li>`;
        continue;
      }

      if (/^[•\-\*]\s/.test(line)) {
        if (!inList || listType !== 'ul') {
          if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
          html += '<ul>';
          inList = true;
          listType = 'ul';
        }
        html += `<li>${_inlineFormat(line.replace(/^[•\-\*]\s*/, ''))}</li>`;
        continue;
      }

      if (/^\s+[•\-\*—]\s/.test(lines[i]) || /^\s+\d+[\.\)]\s/.test(lines[i])) {
        if (!inList) {
          html += '<ul>';
          inList = true;
          listType = 'ul';
        }
        html += `<li>${_inlineFormat(line.replace(/^[•\-\*—\d\.]+\s*/, ''))}</li>`;
        continue;
      }

      if (inList) {
        html += listType === 'ul' ? '</ul>' : '</ol>';
        inList = false;
        listType = null;
      }

      if (line.endsWith(':')) {
        html += `<p><strong>${_inlineFormat(line)}</strong></p>`;
      } else {
        html += `<p>${_inlineFormat(line)}</p>`;
      }
    }

    if (inList) {
      html += listType === 'ul' ? '</ul>' : '</ol>';
    }

    if (entry.source) {
      html += `<div class="message-source">📎 Source: ${_escapeHtml(entry.source)}</div>`;
    }

    return html;
  }

  function _inlineFormat(text) {
    let result = _escapeHtml(text);
    result = result.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="chat-image" loading="lazy">');
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__(.*?)__/g, '<strong>$1</strong>');
    result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    result = result.replace(/^(Q:)/i, '<strong>$1</strong>');
    result = result.replace(/^(A:)/i, '<strong>$1</strong>');
    return result;
  }

  function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Rich markdown-to-HTML parser for external AI responses and templates
   */
  function formatMarkdown(md) {
    if (!md) return '';
    let text = md.trim();

    // 1. Code blocks
    const codeBlocks = [];
    text = text.replace(/```([\w-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(`<pre class="code-block"><code class="language-${lang}">${_escapeHtml(code.trim())}</code></pre>`);
      return id;
    });

    // 2. Escape standard html safely
    let html = _escapeHtml(text);

    // 3. Images: ![alt](url)
    html = html.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="chat-image" loading="lazy">');

    // 4. Headers: ###, ##, #
    html = html.replace(/^###\s+(.*)$/gm, '<h4 class="msg-subhead">$1</h4>');
    html = html.replace(/^##\s+(.*)$/gm, '<h3 class="msg-head">$1</h3>');
    html = html.replace(/^#\s+(.*)$/gm, '<h2 class="msg-title">$1</h2>');

    // 5. Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // 6. Numbered lists
    html = html.replace(/^(\d+[\.\)])\s+(.*)$/gm, '<li-ol value="$1">$2</li-ol>');
    html = html.replace(/(<li-ol[^>]*>.*<\/li-ol>\n?)+/g, (match) => {
      const items = match.replace(/<li-ol[^>]*>(.*?)<\/li-ol>/g, '<li>$1</li>');
      return `<ol>${items}</ol>`;
    });

    // 7. Bullet lists
    html = html.replace(/^[•\-\*]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      if (match.includes('<ol>')) return match;
      return `<ul>${match}</ul>`;
    });

    // 8. Paragraphs
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<h') || block.startsWith('<pre')) {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    // Restore code blocks
    codeBlocks.forEach((cb, idx) => {
      html = html.replace(`__CODE_BLOCK_${idx}__`, cb);
    });

    return html;
  }

  /**
   * Process a user message and return a response (async).
   */
  async function processMessage(userMessage) {
    const msg = userMessage.trim();
    if (!msg) {
      return { html: '<p>Please type a question about Olivarez College.</p>', raw: '', isError: false };
    }

    // Add to history
    _context.history.push({ role: 'user', text: msg });

    // Check greetings
    for (const pattern of GREETING_PATTERNS) {
      if (pattern.test(msg)) {
        const response = _randomFrom(GREETING_RESPONSES);
        _context.history.push({ role: 'bot', text: response });
        return { html: formatMarkdown(response), raw: response, modelUsed: 'AskOli Core', isError: false };
      }
    }

    // Check thanks
    for (const pattern of THANKS_PATTERNS) {
      if (pattern.test(msg)) {
        const response = _randomFrom(THANKS_RESPONSES);
        _context.history.push({ role: 'bot', text: response });
        return { html: formatMarkdown(response), raw: response, modelUsed: 'AskOli Core', isError: false };
      }
    }

    // Check help
    for (const pattern of HELP_PATTERNS) {
      if (pattern.test(msg)) {
        _context.history.push({ role: 'bot', text: HELP_RESPONSE });
        return { html: formatMarkdown(HELP_RESPONSE), raw: HELP_RESPONSE, modelUsed: 'AskOli Core', isError: false };
      }
    }

    // Check domain scope
    const inScope = _isInScope(msg);
    const aiSettings = AiApi.getSettings();

    // If external AI is enabled & configured
    if (aiSettings.enabled && aiSettings.apiKey && aiSettings.mode !== 'local_only') {
      try {
        // Retrieve relevant KB entries for RAG grounding
        const kbResults = KnowledgeBase.searchEntries(msg);
        
        const aiResponse = await AiApi.generateResponse(msg, _context.history, kbResults);
        if (aiResponse && aiResponse.text) {
          _context.history.push({ role: 'bot', text: aiResponse.text });
          return {
            html: formatMarkdown(aiResponse.text),
            raw: aiResponse.text,
            modelUsed: aiResponse.modelUsed,
            isAiGenerated: true,
            isError: false
          };
        }
      } catch (err) {
        console.warn('External AI failed, fallback to local match:', err);
        // Fall through to local matching
      }
    }

    // Local Matching Fallback
    if (!inScope) {
      const rejection = _randomFrom(REJECTION_MESSAGES);
      _context.history.push({ role: 'bot', text: rejection });
      return { html: formatMarkdown(rejection), raw: rejection, modelUsed: 'Knowledge Filter', isError: false };
    }

    // Search Local KB
    const entry = _findAnswer(msg);
    if (!entry) {
      const noMatch = _randomFrom(NO_MATCH_MESSAGES);
      _context.history.push({ role: 'bot', text: noMatch });
      return { html: formatMarkdown(noMatch), raw: noMatch, modelUsed: 'Knowledge Filter', isError: false };
    }

    // Format local response
    const html = _formatResponse(entry);
    _context.history.push({ role: 'bot', text: entry.title });
    return {
      html,
      raw: entry.content,
      source: entry.source,
      modelUsed: 'Local KB Match',
      isError: false
    };
  }

  function resetContext() {
    _context = {
      lastCategory: null,
      lastEntryId: null,
      lastTopicKeywords: [],
      history: []
    };
  }

  function setHistory(history) {
    _context.history = Array.isArray(history) ? [...history] : [];
  }

  function getHistory() {
    return _context.history;
  }

  return {
    processMessage,
    resetContext,
    setHistory,
    getHistory,
    formatMarkdown
  };
})();
