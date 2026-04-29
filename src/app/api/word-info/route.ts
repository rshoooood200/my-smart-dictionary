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

    let userApiKey: string | undefined;
    if (userId) {
      try {
        const config = await db.geminiConfig.findUnique({ where: { userId } });
        if (config?.apiKey) {
          userApiKey = config.apiKey;
          console.log('[Word-Info] Using user API key');
        }
      } catch (dbError) {
        console.log('[Word-Info] Could not fetch user API key');
      }
    }

    // Prompt بأسماء مفاتيح طويلة لإجبار Qwen على فصل اللغات وعدم الكسل
    const prompt = `You are a professional English-Arabic dictionary AI.
Analyze the word: "${wordText}"

Return ONLY a valid JSON object using this exact structure. No markdown, no extra text.
{
  "isCorrect": true,
  "correctWord": null,
  "suggestions": [],
  "translation": "الكلمة بالعربي",
  "pronunciation": "/IPA/",
  "definition": "English definition",
  "partOfSpeech": "noun",
  "level": "beginner",
  "synonyms": ["syn1", "syn2"],
  "antonyms": ["ant1", "ant2"],
  "sentences_array": [
    {
      "english_sentence": "English sentence 1 using ${wordText}",
      "arabic_translation": "الترجمة العربية الدقيقة والكاملة للجملة الأولى فقط"
    },
    {
      "english_sentence": "English sentence 2 using ${wordText}",
      "arabic_translation": "الترجمة العربية الدقيقة والكاملة للجملة الثانية فقط"
    },
    {
      "english_sentence": "English sentence 3 using ${wordText}",
      "arabic_translation": "الترجمة العربية الدقيقة والكاملة للجملة الثالثة فقط"
    }
  ],
  "usageNotes": "Brief English note",
  "verbForms": {"past": "", "pastParticiple": "", "present": "", "gerund": "", "thirdPerson": ""},
  "nounForms": {"singular": "", "plural": "", "countable": true},
  "adjectiveForms": {"comparative": "", "superlative": "", "adverb": ""},
  "arabicMeaning": "شرح عربي مفصل"
}

STRICT RULES FOR QWEN:
1. The "sentences_array" MUST have EXACTLY 3 items.
2. The "arabic_translation" MUST contain Arabic text only. DO NOT leave it empty. DO NOT put English text in it. It must be the exact translation of "english_sentence".
3. For "verbForms", "nounForms", "adjectiveForms": If the word matches the type, fill the strings. If not, leave them empty "".
4. If the word is misspelled, set isCorrect to false, provide correctWord and suggestions.
5. Output ONLY raw valid JSON.

Word: "${wordText}"`;

    const wordData = await callGeminiJSON<any>(prompt, undefined, userApiKey);

    const validPartsOfSpeech = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection', 'phrasal_verb', 'idiom'];
    const isCorrect = wordData.isCorrect !== false;
    const correctWord = isCorrect ? wordText : (wordData.correctWord || wordText);

    // تنظيف الجمل وتحوير أسماء المفاتيح الطويلة التي أرسلناها لـ Qwen إلى الأسماء التي تفهمها الواجهة
    let validSentences: { sentence: string; translation: string }[] = [];
    const rawSentences = wordData.sentences_array || wordData.sentences || wordData.examples || [];
    if (Array.isArray(rawSentences) && rawSentences.length > 0) {
      validSentences = rawSentences
        .map((s: any) => ({
          sentence: (s.english_sentence || s.sentence || s.en || '').trim(),
          translation: (s.arabic_translation || s.translation || s.ar || '').trim()
        }))
        // نتأكد فقط أن الحقلين ليسا فارغين
        .filter(s => s.sentence && s.translation)
        .slice(0, 3);
    }

    // دالة تنظيف التصريفات لضمان عدم انهيار الواجهة
    const cleanForm = (form: any, keys: string[]) => {
      const cleaned: Record<string, any> = {};
      keys.forEach(key => {
        cleaned[key] = (form && form[key] && typeof form[key] === 'string') ? form[key].trim() : "";
      });
      return cleaned;
    };

    const verbForms = cleanForm(wordData.verbForms, ['past', 'pastParticiple', 'present', 'gerund', 'thirdPerson']);
    const nounForms = cleanForm(wordData.nounForms, ['singular', 'plural']);
    const adjectiveForms = cleanForm(wordData.adjectiveForms, ['comparative', 'superlative', 'adverb']);

    if (wordData.nounForms && typeof wordData.nounForms.countable === 'boolean') {
      nounForms.countable = wordData.nounForms.countable;
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
      synonyms: Array.isArray(wordData.synonyms) ? wordData.synonyms.filter(Boolean).slice(0, 8) : [],
      antonyms: Array.isArray(wordData.antonyms) ? wordData.antonyms.filter(Boolean).slice(0, 3) : [],
      sentences: validSentences, 
      usageNotes: wordData.usageNotes || '',
      arabicMeaning: wordData.arabicMeaning || '',
      verbForms,
      nounForms,
      adjectiveForms,
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
