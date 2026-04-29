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

    // Enhanced prompt with STRICT instructions for 3 sentences
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
    {"en": "English sentence 1 using the word ${wordText}", "ar": "الترجمة العربية للجملة الأولى"},
    {"en": "English sentence 2 using the word ${wordText}", "ar": "الترجمة العربية للجملة الثانية"},
    {"en": "English sentence 3 using the word ${wordText}", "ar": "الترجمة العربية للجملة الثالثة"}
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
1. You MUST generate EXACTLY 3 examples. Not 2, not 4. Exactly 3.
2. Every example MUST have both "en" (English) and "ar" (Arabic translation).
3. Only include verbForms if partOfSpeech is "verb"
4. Only include nounForms if partOfSpeech is "noun"
5. Only include adjectiveForms if partOfSpeech is "adjective"
6. Return ONLY the JSON object, no other text.

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
        .filter(s => s.en && s.ar) // التأكد من وجود الجملة والترجمة
        .slice(0, 3) // أخذ 3 جمل فقط
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
      // دمج examples و sentences في مصفوفة واحدة نظيفة للواجهة
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
