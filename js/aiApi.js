/* ============================================
   AskOli — External AI API Integration & RAG Engine
   Supports Google Gemini, OpenAI, Groq, OpenRouter & Custom Endpoints
   ============================================ */

const AiApi = (() => {
  const SETTINGS_KEY = 'askoli_ai_settings';

  const DEFAULT_SETTINGS = {
    enabled: true,
    provider: 'gemini', // 'gemini' | 'openai' | 'groq' | 'openrouter' | 'custom'
    mode: 'hybrid_rag', // 'hybrid_rag' | 'external_only' | 'local_only'
    apiKey: 'AQ.Ab8RN6I_V6EhcCH2eU9tECIH3BSy7lfS9fV9jZmpDCRikPW7bA',
    model: 'gemini-3.6-flash',
    customBaseUrl: 'https://api.openai.com/v1',
    temperature: 0.2,
    maxTokens: 1000
  };

  const PROVIDER_PRESETS = {
    gemini: {
      name: 'Google Gemini',
      defaultModel: 'gemini-3.6-flash',
      models: ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-pro'],
      endpointType: 'gemini'
    },
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
      models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
      endpointType: 'openai'
    },
    groq: {
      name: 'Groq (Ultra-Fast)',
      baseUrl: 'https://api.groq.com/openai/v1',
      defaultModel: 'llama-3.3-70b-versatile',
      models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      endpointType: 'openai'
    },
    openrouter: {
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'google/gemini-flash-1.5',
      models: ['google/gemini-flash-1.5', 'meta-llama/llama-3.1-8b-instruct:free', 'anthropic/claude-3.5-sonnet'],
      endpointType: 'openai'
    },
    custom: {
      name: 'Custom (OpenAI-Compatible / Ollama / LocalAI)',
      baseUrl: 'http://localhost:11434/v1',
      defaultModel: 'llama3',
      models: ['llama3', 'mistral', 'custom'],
      endpointType: 'openai'
    }
  };

  function getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };

      // Auto-migrate deprecated models or empty keys
      let needsSave = false;
      if (merged.provider === 'gemini' && (!merged.model || merged.model.includes('gemini-1.5') || merged.model.includes('gemini-2.0') || merged.model.includes('gemini-2.5'))) {
        merged.model = 'gemini-3.6-flash';
        needsSave = true;
      }
      if (!merged.apiKey && DEFAULT_SETTINGS.apiKey) {
        merged.apiKey = DEFAULT_SETTINGS.apiKey;
        merged.enabled = true;
        needsSave = true;
      }
      if (needsSave) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      }
      return merged;
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
      console.error('Error saving AI settings:', e);
      return getSettings();
    }
  }

  /**
   * Builds the strict Olivarez College system prompt with optional RAG knowledge context.
   */
  function buildSystemPrompt(kbContextText = '') {
    return `You are AskOli, the dedicated, futuristic AI-based information assistant for Olivarez College (located in Parañaque City / Sucat, Metro Manila, Philippines).

CORE MISSION & SCOPE:
- You ONLY provide verified, reliable information regarding Olivarez College (admissions, enrollment procedures, document requests such as TOR/Diploma/Good Moral, school facilities, offices, campus services, grading system, academic policies, uniform policy, student organizations, fees, contact info, schedules, and FAQs).
- If the user asks general questions unrelated to Olivarez College (e.g. weather, cooking, world capitals, general coding, sports, personal advice, unrelated trivia), YOU MUST POLITELY REFUSE and state that you are domain-specific to Olivarez College.
- If the question is about Olivarez College but the information is NOT in the authorized knowledge base or your context, state clearly and politely that the specific information is not currently in the authorized knowledge base and advise them to visit the relevant school office (e.g., Registrar's Office, Admissions, Cashier, Dean's Office). DO NOT INVENT or hallucinate school policies or contact details.

FORMATTING & PERSONA:
- Persona: Futuristic, intelligent, highly respectful, clear, and academic.
- Structure responses clearly with numbered steps, bullet points (•), and bold key terms.
- Support markdown images: ![description](url) if relevant.
- Keep answers concise, factual, and direct.

AUTHORIZED OLIVAREZ COLLEGE KNOWLEDGE BASE CONTEXT:
${kbContextText ? kbContextText : 'Use standard authorized Olivarez College institutional facts and procedures.'}`;
  }

  /**
   * Direct fetch to Google Gemini API
   */
  async function callGeminiApi(apiKey, model, systemPrompt, conversationHistory, userMessage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // Build Gemini contents with proper alternating turns
    const contents = [];

    // Filter out trailing current user message if already present in history
    const priorTurns = conversationHistory.filter(item => item && (item.text || item.content));
    const historyToUse = (priorTurns.length > 0 && priorTurns[priorTurns.length - 1].role === 'user' && (priorTurns[priorTurns.length - 1].text || priorTurns[priorTurns.length - 1].content) === userMessage)
      ? priorTurns.slice(0, -1)
      : priorTurns;

    // Prior history (limit to last 6 turns)
    const recent = historyToUse.slice(-6);
    for (const item of recent) {
      const role = item.role === 'user' ? 'user' : 'model';
      const text = (item.text || item.content || '').trim();
      if (!text) continue;

      // Ensure proper turn alternations
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n${text}`;
      } else {
        contents.push({
          role: role,
          parts: [{ text }]
        });
      }
    }

    // Add current user message
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text = userMessage;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });
    }

    const body = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.error?.message || `Gemini API returned status ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response text received from Gemini model.');
    }

    return text;
  }

  /**
   * Direct fetch to OpenAI / OpenAI-compatible endpoint (Groq, OpenRouter, Custom, etc.)
   */
  async function callOpenAiCompatibleApi(baseUrl, apiKey, model, systemPrompt, conversationHistory, userMessage) {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/chat/completions`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Filter out trailing current user message if already present in history
    const priorTurns = conversationHistory.filter(item => item && (item.text || item.content));
    const historyToUse = (priorTurns.length > 0 && priorTurns[priorTurns.length - 1].role === 'user' && (priorTurns[priorTurns.length - 1].text || priorTurns[priorTurns.length - 1].content) === userMessage)
      ? priorTurns.slice(0, -1)
      : priorTurns;

    // Prior history (last 6 turns)
    const recent = historyToUse.slice(-6);
    for (const item of recent) {
      const role = item.role === 'user' ? 'user' : 'assistant';
      const content = (item.text || item.content || '').trim();
      if (!content) continue;
      messages.push({ role, content });
    }

    messages.push({
      role: 'user',
      content: userMessage
    });

    const headers = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const body = {
      model: model,
      messages: messages,
      temperature: 0.2,
      max_tokens: 1024
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.error?.message || `API request failed with status ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content;

    if (!text) {
      throw new Error('No content returned from AI model.');
    }

    return text;
  }

  /**
   * Tests API configuration with a simple greeting check.
   */
  async function testConnection(customSettings = null) {
    const settings = customSettings || getSettings();

    if (!settings.apiKey && settings.provider !== 'custom') {
      return { success: false, message: 'Please provide an API Key first.' };
    }

    try {
      const testPrompt = "Respond with one short sentence confirming AskOli online status.";
      const systemPrompt = "You are AskOli, AI assistant for Olivarez College. Be very brief.";
      let resultText = '';

      if (settings.provider === 'gemini') {
        resultText = await callGeminiApi(settings.apiKey, settings.model || 'gemini-3.6-flash', systemPrompt, [], testPrompt);
      } else {
        const preset = PROVIDER_PRESETS[settings.provider] || PROVIDER_PRESETS.custom;
        const baseUrl = settings.provider === 'custom' ? settings.customBaseUrl : preset.baseUrl;
        const model = settings.model || preset.defaultModel;
        resultText = await callOpenAiCompatibleApi(baseUrl, settings.apiKey, model, systemPrompt, [], testPrompt);
      }

      return {
        success: true,
        message: `Connected successfully to ${settings.provider.toUpperCase()} (${settings.model})! Response: "${resultText.slice(0, 100)}..."`
      };
    } catch (e) {
      return {
        success: false,
        message: `Connection failed: ${e.message}`
      };
    }
  }

  /**
   * Generates a response using External AI (with RAG context from KnowledgeBase).
   */
  async function generateResponse(userMessage, conversationHistory = [], kbResults = []) {
    const settings = getSettings();

    // Check if external AI should be invoked
    if (!settings.enabled || settings.mode === 'local_only' || !settings.apiKey) {
      return null; // Signals caller to use local matching engine
    }

    // Build KB Context text from search matches
    let kbContextText = '';
    if (kbResults && kbResults.length > 0) {
      kbContextText = kbResults.slice(0, 4).map((r, i) => {
        const e = r.entry || r;
        return `[ENTRY ${i + 1}] Title: ${e.title}\nCategory: ${e.category}\nSource: ${e.source || 'Olivarez College'}\nContent:\n${e.content}\n`;
      }).join('\n---\n');
    }

    const systemPrompt = buildSystemPrompt(kbContextText);

    try {
      let rawText = '';
      if (settings.provider === 'gemini') {
        rawText = await callGeminiApi(
          settings.apiKey,
          settings.model || 'gemini-3.6-flash',
          systemPrompt,
          conversationHistory,
          userMessage
        );
      } else {
        const preset = PROVIDER_PRESETS[settings.provider] || PROVIDER_PRESETS.custom;
        const baseUrl = settings.provider === 'custom' ? settings.customBaseUrl : preset.baseUrl;
        const model = settings.model || preset.defaultModel;

        rawText = await callOpenAiCompatibleApi(
          baseUrl,
          settings.apiKey,
          model,
          systemPrompt,
          conversationHistory,
          userMessage
        );
      }

      return {
        text: rawText,
        modelUsed: `${settings.provider.toUpperCase()} (${settings.model})`,
        isAiGenerated: true
      };
    } catch (error) {
      console.warn('External AI failed, falling back to local KB engine:', error);
      throw error; // Let caller decide whether to fall back
    }
  }

  return {
    getSettings,
    saveSettings,
    PROVIDER_PRESETS,
    testConnection,
    generateResponse,
    buildSystemPrompt
  };
})();
