// AI Helper Functions - OpenRouter with Qwen 2.5 72B
// Fast, cheap, and excellent quality!

// ============== CONFIGURATION ==============

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_TIMEOUT = 60000; // 60 seconds

// Qwen 2.5 72B - Best model for vocabulary learning
const AI_MODEL = 'qwen/qwen-2.5-72b-instruct';

// ============== API KEY ==============

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.error('[AI] OPENROUTER_API_KEY not set in environment');
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  return key;
}

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

// ============== MAIN API ==============

async function callAI(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const apiKey = getApiKey();
  
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\n---\n\n${prompt}`
    : prompt;

  console.log('[AI] Calling Qwen 2.5 72B...');

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
        model: AI_MODEL,
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.3,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();

    if (data.error) {
      console.error('[AI] API returned error:', data.error.message);
      throw new Error(data.error.message);
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[AI] Empty response');
      throw new Error('Empty AI response');
    }

    console.log('[AI] Success! Tokens used:', data.usage?.total_tokens || 'unknown');
    return content;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI request timeout');
    }
    
    throw error;
  }
}

// ============== EXPORTED FUNCTIONS ==============

export async function callGemini(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  return callAI(prompt, systemPrompt);
}

export async function callGeminiJSON<T>(
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  const enhancedPrompt = `${prompt}\n\nReturn ONLY valid JSON. No markdown. Start with { end with }`;

  const response = await callAI(enhancedPrompt, systemPrompt);

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
  const key = process.env.OPENROUTER_API_KEY;
  
  return [
    {
      name: 'Qwen 2.5 72B (OpenRouter)',
      preview: key ? `${key.slice(0, 7)}...${key.slice(-4)}` : 'Not set',
      available: !!key,
    },
  ];
}
