// AI Helper Functions - Supports OpenRouter and Gemini

// ============== TYPES ==============

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    total_tokens: number;
  };
  error?: {
    message: string;
    code: number;
  };
}

interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[];
    };
  }[];
  error?: {
    message: string;
  };
}

// ============== CONFIGURATION ==============

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const API_TIMEOUT = 60000; // 60 seconds

// ============== OPENROUTER (Server-side) ==============

function getOpenRouterKey(): string | null {
  return process.env.OPENROUTER_API_KEY || null;
}

async function callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\n---\n\n${prompt}`
    : prompt;

  console.log('[AI] Calling OpenRouter (Qwen 2.5 72B)...');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vocabulary-app.com',
        'X-Title': 'Vocabulary Learning App',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.3,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] OpenRouter error:', response.status, errorText);
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty OpenRouter response');
    }

    console.log('[AI] OpenRouter success! Tokens:', data.usage?.total_tokens || 'unknown');
    return content;

  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============== GEMINI (User's API Key) ==============

async function callGeminiAPI(apiKey: string, prompt: string, systemPrompt?: string): Promise<string> {
  const fullPrompt = systemPrompt 
    ? `System: ${systemPrompt}\n\nUser: ${prompt}`
    : prompt;

  console.log('[AI] Calling Gemini API...');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] Gemini error:', response.status, errorText);
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('Empty Gemini response');
    }

    console.log('[AI] Gemini success!');
    return content;

  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============== MAIN FUNCTIONS ==============

/**
 * Call AI with optional user's Gemini API key
 * Falls back to server's OpenRouter key if no user key provided
 */
export async function callGemini(
  prompt: string,
  systemPrompt?: string,
  userApiKey?: string
): Promise<string> {
  // If user has a Gemini key, use it
  if (userApiKey) {
    return callGeminiAPI(userApiKey, prompt, systemPrompt);
  }

  // Fall back to OpenRouter (server key)
  return callOpenRouter(prompt, systemPrompt);
}

/**
 * Call AI and parse JSON response
 */
export async function callGeminiJSON<T>(
  prompt: string,
  systemPrompt?: string,
  userApiKey?: string
): Promise<T> {
  const enhancedPrompt = `${prompt}\n\nReturn ONLY valid JSON. No markdown. Start with { end with }`;

  const response = await callGemini(enhancedPrompt, systemPrompt, userApiKey);

  console.log('[AI] Raw response length:', response.length);

  // Clean response
  let cleaned = response.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;

  // Try to parse
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    console.error('[AI] Failed to parse JSON, attempting repair...');
    
    try {
      // Fix common JSON issues
      let fixed = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/(?<!\\)'/g, '"');
      return JSON.parse(fixed) as T;
    } catch {
      console.error('[AI] Repair failed. Raw:', jsonStr.substring(0, 500));
      throw new Error('Failed to parse AI response');
    }
  }
}

// ============== STATUS FUNCTIONS ==============

export function resetAllKeysStatus() {
  console.log('[AI] Status reset');
}

export async function validateAndResetKeys() {
  return 0;
}

export function getKeysStatus() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  return [
    {
      name: 'OpenRouter (Qwen 2.5 72B)',
      preview: openRouterKey ? `${openRouterKey.slice(0, 7)}...${openRouterKey.slice(-4)}` : 'Not set',
      available: !!openRouterKey,
    },
  ];
}
