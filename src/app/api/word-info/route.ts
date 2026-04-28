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

    // Enhanced prompt with word forms
    const prompt = `Analyze: "${wordText}"

FIRST: Check if "${wordText}" is spelled correctly.
- If MISSPELLED: set "isCorrect": false, provide "correctWord" and "suggestions"
- If CORRECT: set "isCorrect": true, provide full analysis

Return JSON:
{
  "isCorrect": true/false,
  "correctWord": "correct spelling if misspelled",
  "suggestions": ["alternative1", "alternative2"],
  "translation": "الترجمة العربية",
  "pronunciation": "/IPA/",
  "definition": "English definition",
  "partOfSpeech": "noun|verb|adjective|adverb|preposition|conjunction|pronoun|interjection",
  "level": "beginner|intermediate|advanced",
  "synonyms": ["syn1", "syn2", "syn3", "syn4", "syn5"],
  "antonyms": ["ant1", "ant2", "ant3"],
  "examples": [
    {"en": "Sentence with word", "ar": "الترجمة"},
    {"en": "Sentence 2", "ar": "الترجمة"}
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

IMPORTANT: 
- Only include verbForms if partOfSpeech is "verb"
- Only include nounForms if partOfSpeech is "noun"
- Only include adjectiveForms if partOfSpeech is "adjective"
- All forms should be empty strings "" if not applicable

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
      verbForms?: {
        past?: string;
        pastParticiple?: string;
        present?: string;
        gerund?: string;
        thirdPerson?: string;
      };
      nounForms?: {
        singular?: string;
        plural?: string;
        countable?: boolean;
      };
      adjectiveForms?: {
        comparative?: string;
        superlative?: string;
        adverb?: string;
      };
      arabicMeaning?: string;
    }>(prompt, undefined, userApiKey);

    const validPartsOfSpeech = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection', 'phrasal_verb', 'idiom'];
    
    const isCorrect = wordData.isCorrect !== false;
    const correctWord = isCorrect ? wordText : (wordData.correctWord || wordText);
    
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
      antonyms: Array.isArray(wordData.antonyms) ? wordData.antonyms.slice(0, 5) : [],
      examples: Array.isArray(wordData.examples)
        ? wordData.examples.slice(0, 5).map(s => s.en || '')
        : [],
      sentences: Array.isArray(wordData.examples)
        ? wordData.examples.slice(0, 5).map(s => ({
            sentence: s.en || '',
            translation: s.ar || '',
          }))
        : [],
      usageNotes: wordData.usageNotes || '',
      arabicMeaning: wordData.arabicMeaning || '',
      // تراكيب الفعل
      verbForms: wordData.verbForms || {},
      // تراكيب الاسم
      nounForms: wordData.nounForms || {},
      // تراكيب الصفة
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
