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

    // Check if user has a Gemini API key stored
    let userApiKey: string | undefined;
    if (userId) {
      try {
        const config = await db.geminiConfig.findUnique({
          where: { userId }
        });
        if (config?.apiKey) {
          userApiKey = config.apiKey;
          console.log('[Word-Info] Using user\'s Gemini API key');
        }
      } catch (dbError) {
        console.log('[Word-Info] Could not fetch user API key, using server key');
      }
    }

    // Enhanced prompt with STRICT instructions for Arabic translation
    const prompt = `Analyze the English word: "${wordText}"

FIRST: Check if "${wordText}" is spelled correctly.
- If MISSPELLED: set "isCorrect": false, provide "correctWord" and "suggestions"
- If CORRECT: set "isCorrect": true, provide full analysis

Return a VALID JSON object with this EXACT structure:
{
  "isCorrect": true/false,
  "correctWord": "correct spelling if misspelled",
  "suggestions": ["alternative1", "alternative2"],
  "translation": "الترجمة العربية",
  "pronunciation": "/IPA/",
  "definition": "English definition",
  "partOfSpeech": "noun|verb|adjective|adverb|preposition|conjunction|pronoun|interjection",
  "level": "beginner|intermediate|advanced",
  "synonyms": ["syn1", "syn2", "syn3"],
  "antonyms": ["ant1", "ant2"],
  "examples": [
    {"en": "English sentence 1 using the word ${wordText}", "ar": "الترجمة العربية الدقيقة للجملة الأولى"},
    {"en": "English sentence 2 using the word ${wordText}", "ar": "الترجمة العربية الدقيقة للجملة الثانية"},
    {"en": "English sentence 3 using the word ${wordText}", "ar": "الترجمة العربية الدقيقة للجملة الثالثة"}
  ],
  "usageNotes": "Brief usage note",
  "verbForms": {
    "past": "past tense form",
    "pastParticiple": "past participle form",
    "present": "present/base form",
    "gerund": "ing form",
    "thirdPerson": "third person singular form"
  },
  "nounForms": {
    "singular": "singular form",
    "plural": "plural form",
    "countable": true/false
  },
  "adjectiveForms": {
    "comparative": "comparative form",
    "superlative": "superlative form",
    "adverb": "adverb form"
  },
  "arabicMeaning": "شرح مفصل بالعربي"
}

CRITICAL RULES:
1. You MUST generate EXACTLY 3 examples.
2. The "ar" field in examples MUST contain the ACCURATE ARABIC TRANSLATION of the "en" field. 
3. NEVER leave the "ar" field empty, and NEVER put English text in the "ar" field. It must be pure Arabic.
4. Only include verbForms if partOfSpeech is "verb"
5. Only include nounForms if partOfSpeech is "noun"
6. Only include adjectiveForms if partOfSpeech is "adjective"
7. Return ONLY the JSON object, no other text.

Word: "${wordText}"
JSON:`;

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
    
    // عملية تنظيف وتجهيز الجمل لتكون متوافقة 100% مع الواجهة
    let validSentences: { sentence: string; translation: string }[] = [];
    if (Array.isArray(wordData.examples) && wordData.examples.length > 0) {
      validSentences = wordData.examples
        // الفلتر: نتأكد أن الجملة موجودة، وأن الترجمة تحتوي على حروف عربية حقيقية
        .filter(s => s.en && s.ar && /[\u0600-\u06FF]/.test(s.ar)) 
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
