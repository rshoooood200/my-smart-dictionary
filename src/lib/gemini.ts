// Gemini AI Helper Functions
// Uses Google Generative AI REST API directly
// Supports multiple API keys with automatic fallback

import fs from 'fs';
import path from 'path';

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  error?: {
    message?: string;
    code?: number;
  };
}

// قراءة المفاتيح مباشرة من ملف .env
function readApiKeysFromFile(): string[] {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    const keys: string[] = [];
    
    // البحث عن GEMINI_API_KEYS
    const keysMatch = envContent.match(/GEMINI_API_KEYS\s*=\s*(.+)/);
    if (keysMatch) {
      const parsedKeys = keysMatch[1]
        .split(',')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0 && k.startsWith('AIza'));
      keys.push(...parsedKeys);
    }
    
    // البحث عن مفاتيح منفصلة
    if (keys.length === 0) {
      const keyRegex = /GEMINI_API_KEY(?:_(\d+))?\s*=\s*(AIza[a-zA-Z0-9_-]+)/g;
      let match;
      while ((match = keyRegex.exec(envContent)) !== null) {
        if (!keys.includes(match[2])) {
          keys.push(match[2]);
        }
      }
    }
    
    return keys;
  } catch (error) {
    console.error('[Gemini] Error reading .env file:', error);
    return [];
  }
}

// الحصول على جميع مفاتيح API المتاحة
function getApiKeys(): string[] {
  // الأولوية: قراءة من ملف .env مباشرة
  const keysFromFile = readApiKeysFromFile();
  if (keysFromFile.length > 0) {
    console.log(`[Gemini] Found ${keysFromFile.length} API key(s) from file: ${keysFromFile.map((k: string) => k.slice(0,4)+'...'+k.slice(-4)).join(', ')}`);
    return keysFromFile;
  }
  
  const keys: string[] = [];
  
  // الأولوية: قراءة المفاتيح من متغير واحد مفصول بفواصل
  const keysString = process.env.GEMINI_API_KEYS;
  if (keysString && keysString.trim().length > 0) {
    const parsedKeys = keysString.split(',').map(k => k.trim()).filter(k => k.length > 0);
    keys.push(...parsedKeys);
  }
  
  // إذا لم توجد مفاتيح، جرب قراءتها من متغيرات منفصلة
  if (keys.length === 0) {
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`GEMINI_API_KEY_${i}`];
      if (key && key.trim().length > 0) {
        keys.push(key.trim());
      }
    }
    
    // للحصول على مفتاح واحد قديم (توافق عكسي)
    const legacyKey = process.env.GEMINI_API_KEY;
    if (legacyKey && legacyKey.trim().length > 0 && !keys.includes(legacyKey.trim())) {
      keys.unshift(legacyKey.trim());
    }
  }
  
  // طباعة عدد المفاتيح المتاحة للتشخيص
  if (keys.length > 0) {
    console.log(`[Gemini] Found ${keys.length} API key(s): ${keys.map(k => k.slice(0,4)+'...'+k.slice(-4)).join(', ')}`);
  }
  
  return keys;
}

// تخزين حالة المفاتيح (أي واحد وصل للحد)
const keyStatus = new Map<string, { exhausted: boolean; resetTime: number }>();

// إعادة تعيين حالة جميع المفاتيح (للاستخدام في حالات الطوارئ)
export function resetAllKeysStatus() {
  keyStatus.clear();
  console.log('[Gemini] All keys status reset');
}

// التحقق من صلاحية مفتاح قبل استخدامه
async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'test' }] }],
        generationConfig: { maxOutputTokens: 1 }
      })
    });
    
    // إذا لم يكن 429، فالمفتاح يعمل
    return response.status !== 429;
  } catch {
    return false;
  }
}

// التحقق من جميع المفاتيح وإعادة تعيين الصالحة منها
export async function validateAndResetKeys() {
  const keys = getApiKeys();
  let resetCount = 0;
  
  for (const key of keys) {
    const status = keyStatus.get(key);
    if (status?.exhausted) {
      const isValid = await testApiKey(key);
      if (isValid) {
        keyStatus.delete(key);
        resetCount++;
        console.log(`[Gemini] Key ${keys.indexOf(key) + 1} is valid again, reset status`);
      }
    }
  }
  
  return resetCount;
}

// الحصول على مفتاح متاح
function getAvailableKey(): string | null {
  const keys = getApiKeys();
  const now = Date.now();
  
  for (const key of keys) {
    const status = keyStatus.get(key);
    
    // إذا لم يكن له حالة أو انتهى وقت الحظر
    if (!status || (status.exhausted && now > status.resetTime)) {
      keyStatus.delete(key); // إزالة الحالة المنتهية
      return key;
    }
    
    // إذا لم يكن مستنفذ
    if (!status.exhausted) {
      return key;
    }
  }
  
  return null;
}

// تحديد مفتاح كمستنفذ
function markKeyExhausted(key: string) {
  // حظر لمدة ساعة أو حتى منتصف الليل (أيهما أقرب)
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0); // منتصف الليل UTC
  
  const resetTime = Math.min(
    Date.now() + 3600000, // ساعة من الآن
    midnight.getTime() // أو منتصف الليل
  );
  
  keyStatus.set(key, { exhausted: true, resetTime });
  console.log(`[Gemini] API Key exhausted, will retry at ${new Date(resetTime).toLocaleTimeString('ar-SA')}`);
}

// استدعاء Gemini API بمفتاح محدد
async function callGeminiWithKey(
  apiKey: string, 
  prompt: string, 
  systemPrompt?: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\n---\n\n${prompt}`
    : prompt;

  const requestBody = {
    contents: [{
      parts: [{ text: fullPrompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    // تحقق من خطأ استنفاد الحصة
    if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('Quota exceeded')) {
      markKeyExhausted(apiKey);
      throw new Error('QUOTA_EXCEEDED');
    }
    
    if (response.status === 400) {
      throw new Error('طلب غير صالح');
    } else if (response.status === 403) {
      throw new Error('مفتاح API غير صالح');
    }
    
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'Unknown Gemini error');
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No response from Gemini');
  }

  return text;
}

// استدعاء Gemini مع محاولة مفاتيح متعددة
export async function callGemini(
  apiKeyOrPrompt: string, 
  promptOrSystem?: string, 
  systemPrompt?: string
): Promise<string> {
  // تحديد المعاملات الصحيحة
  let actualPrompt: string;
  let actualSystemPrompt: string | undefined;
  
  // إذا المعامل الأول يبدأ بـ AIza فهو مفتاح
  if (apiKeyOrPrompt.startsWith('AIza')) {
    actualPrompt = promptOrSystem || '';
    actualSystemPrompt = systemPrompt;
    
    // استخدام المفتاح المقدم مباشرة
    return callGeminiWithKey(apiKeyOrPrompt, actualPrompt, actualSystemPrompt);
  } else {
    // المعامل الأول هو prompt
    actualPrompt = apiKeyOrPrompt;
    actualSystemPrompt = promptOrSystem;
  }
  
  // الحصول على مفتاح متاح
  const availableKeys = getApiKeys();
  
  if (availableKeys.length === 0) {
    throw new Error('NO_API_KEY');
  }
  
  // محاولة كل مفتاح بالترتيب
  const now = Date.now();
  
  for (const key of availableKeys) {
    const status = keyStatus.get(key);
    const keyIndex = availableKeys.indexOf(key) + 1;
    
    // تخطي المفتاح إذا كان مستنفذ ولم ينتهي وقت الحظر
    if (status?.exhausted && now < status.resetTime) {
      console.log(`[Gemini] Key ${keyIndex} is exhausted, skipping...`);
      continue;
    }
    
    // إذا انتهى وقت الحظر، احذف الحالة
    if (status?.exhausted && now >= status.resetTime) {
      keyStatus.delete(key);
      console.log(`[Gemini] Key ${keyIndex} reset time passed, retrying...`);
    }
    
    try {
      console.log(`[Gemini] Trying API Key ${keyIndex}...`);
      return await callGeminiWithKey(key, actualPrompt, actualSystemPrompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      if (message === 'QUOTA_EXCEEDED') {
        console.log(`[Gemini] Key ${keyIndex} quota exceeded, trying next...`);
        continue; // جرب المفتاح التالي
      }
      
      // أخطاء أخرى لا نعيد المحاولة
      throw error;
    }
  }
  
  // جميع المفاتيح مستنفذة
  throw new Error('ALL_KEYS_EXHAUSTED');
}

// استدعاء Gemini مع JSON output
export async function callGeminiJSON<T>(
  apiKeyOrPrompt: string, 
  promptOrSystem?: string, 
  systemPrompt?: string
): Promise<T> {
  let actualPrompt: string;
  let actualSystemPrompt: string | undefined;
  
  if (apiKeyOrPrompt.startsWith('AIza')) {
    actualPrompt = promptOrSystem || '';
    actualSystemPrompt = systemPrompt;
  } else {
    actualPrompt = apiKeyOrPrompt;
    actualSystemPrompt = promptOrSystem;
  }
  
  const enhancedPrompt = `${actualPrompt}\n\nIMPORTANT: Return ONLY valid JSON, no additional text, no markdown code blocks, no explanations. Just the JSON object.`;
  
  const response = await callGemini(
    apiKeyOrPrompt.startsWith('AIza') ? apiKeyOrPrompt : enhancedPrompt,
    apiKeyOrPrompt.startsWith('AIza') ? enhancedPrompt : actualSystemPrompt,
    apiKeyOrPrompt.startsWith('AIza') ? actualSystemPrompt : undefined
  );
  
  // Clean up the response
  let cleanedResponse = response.trim();
  
  cleanedResponse = cleanedResponse
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  
  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      console.error('Failed to parse JSON from response:', jsonMatch[0]);
      throw new Error('فشل في تحليل رد Gemini كـ JSON');
    }
  }
  
  try {
    return JSON.parse(cleanedResponse) as T;
  } catch {
    console.error('Failed to parse response as JSON:', cleanedResponse);
    throw new Error('فشل في تحليل رد Gemini كـ JSON');
  }
}

// للحصول على حالة المفاتيح (للـ UI)
export function getKeysStatus() {
  const keys = getApiKeys();
  const now = Date.now();
  
  return keys.map((key, index) => {
    const status = keyStatus.get(key);
    const isExhausted = status?.exhausted && now < status.resetTime;
    
    return {
      index: index + 1,
      preview: `${key.slice(0, 4)}...${key.slice(-4)}`,
      available: !isExhausted,
      resetTime: status?.resetTime
    };
  });
}
