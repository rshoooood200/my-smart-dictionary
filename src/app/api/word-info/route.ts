import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/ai';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, userId } = body;

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ success: false, error: 'Word is required' }, { status: 400 });
    }

    const wordText = word.toLowerCase().trim();

    // Check if user has an API key stored
    let userApiKey: string | undefined;
    if (userId) {
      try {
        const config = await db.geminiConfig.findUnique({
          where: { userId }
        });
        if (config?.apiKey) {
          userApiKey = config.apiKey;
          console.log('[Word-Info] Using user API key');
        }
      } catch (dbError) {
        console.log('[Word-Info] Could not fetch user API key, using server key');
      }
    }

    // Prompt مُحسّن خصيصاً لنماذج Qwen عبر OpenRouter
    const prompt = `You are an expert English-Arabic linguist and dictionary.
Analyze the English word: "${wordText}"

Return a VALID JSON object. Do not add any text before or after the JSON.

{
  "isCorrect": true,
  "correctWord": null,
  "suggestions": [],
  "translation": "الترجمة العربية للكلمة",
  "pronunciation": "/IPA/",
  "definition": "English definition",
  "partOfSpeech": "noun",
  "level": "beginner",
  "synonyms": ["syn1", "syn2", "syn3"],
  "antonyms": ["ant1", "ant2"],
  "examples": [
    {"en": "English sentence 1 using ${wordText}.", "ar": "الترجمة العربية الدقيقة للجملة الأولى فقط"},
    {"en": "English sentence 2 using ${wordText}.", "ar": "الترجمة العربية الدقيقة للجملة الثانية فقط"},
    {"en": "English sentence 3 using ${wordText}.", "ar": "الترجمة العربية الدقيقة للجملة الثالثة فقط"}
  ],
  "usageNotes": "Brief usage note in English",
  "verbForms": {},
  "nounForms": {},
  "adjectiveForms": {},
  "arabicMeaning": "شرح مفصل باللغة العربية"
}

CRITICAL RULES FOR QWEN:
1. The "examples" array MUST contain EXACTLY 3 items.
2. The "ar" field in the examples MUST contain the ARABIC TRANSLATION of the "en" field.
3. NEVER write English words in the "ar" field. The "ar" field must be 100% Arabic text.
4. If the word is misspelled, set "isCorrect": false, provide "correctWord", and fill the "suggestions" array.
5. Only include verbForms if partOfSpeech is "verb", nounForms if "noun", adjectiveForms if "adjective". Otherwise leave them as empty objects {}.
6. Output ONLY valid JSON.

Word: "${wordText}"`;

    const wordData = await callGeminiJSON<{
      isCorrect: boolean;
      correctWord?: string;
      suggestions?: string[];
      translation: string;
      pronunciation: string;
      definition: string;
      partOfSpeech: string;
      level: string;
      synonyms: string[];
      antonyms: string[];
      examples: { en: string; ar: string }[];
      usageNotes: string;
      verbForms?: any;
      nounForms?: any;
      adjectiveForms?: any;
      arabicMeaning?: string;
    }>(prompt, undefined, userApiKey);

    const validPartsOfSpeech = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection', 'phrasal_verb', 'idiom'];
    
    const isCorrect = wordData.isCorrect !== false;
    const correctWord = isCorrect ? wordText : (wordData.correctWord || wordText);
    
    // عملية تنظيف وتجهيز الجمل مع فلتر صارم للتأكد من وجود حروف عربية
    let validSentences: { sentence: string; translation: string }[] = [];
    if (Array.isArray(wordData.examples) && wordData.examples.length > 0) {
      validSentences = wordData.examples
        .filter(s => s.en && s.ar && /[\u0600-\u06FF]/.test(s.ar)) // يتأكد أن حقل ar يحتوي على حروف عربية حقيقية
        .slice(0, 3)
        .map(s => ({
          sentence: s.en.trim(),
          translation: s.ar.trim(),
        }));
    }

    const validatedData = {
      isCorrect,
      originalWord: wordText,
      correctWord,
      suggestions: wordData.suggestions || [],
      translation: wordData.translation || '',
      pronunciation: wordData.pronunciation || '',
      definition: wordData.definition || '',
      partOfSpeech: validPartsOfSpeech.includes(wordData.partOfSpeech) ? wordData.partOfSpeech : '',
      level: ['beginner', 'intermediate', 'advanced'].includes(wordData.level) ? wordData.level : 'beginner',
      synonyms: Array.isArray(wordData.synonyms) ? wordData.synonyms.slice(0, 8) : [],
      antonyms: Array.isArray(wordData.antonyms) ? wordData.antonyms.slice(0, 3) : [],
      sentences: validSentences, 
      usageNotes: wordData.usageNotes || '',
      arabicMeaning: wordData.arabicMeaning || '',
      verbForms: wordData.verbForms || {},
      nounForms: wordData.nounForms || {},
      adjectiveForms: wordData.adjectiveForms || {},
    };

    return NextResponse.json({ success: true, data: validatedData });
  } catch (error: any) {
    console.error('Error getting word info:', error);
    
    if (error.message?.includes('API_KEY') || error.message?.includes('not configured')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ميزة الذكاء الاصطناعي غير مفعّلة. يرجى إضافة مفتاح API في الإعدادات.',
          needsApiKey: true
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'فشل في الحصول على معلومات الكلمة' },
      { status: 500 }
    );
  }
}
