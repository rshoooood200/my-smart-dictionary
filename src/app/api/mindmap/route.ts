import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/ai'
import { requireAuth } from '@/lib/auth-helpers'

interface MindMapNode {
  word: string
  children: MindMapNode[]
}

interface MindMapResponse {
  root: MindMapNode
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word } = body

    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return NextResponse.json({ error: 'word is required' }, { status: 400 })
    }

    const cleanWord = word.trim().toLowerCase()

    const systemPrompt = `You are an expert English language educator. You create mind maps that help learners understand English words deeply.

IMPORTANT RULES:
1. ALL content must be in English ONLY - no Arabic or any other language
2. The mind map must be centered around the given word
3. Create meaningful connections that help with vocabulary learning
4. Keep each branch concise (1-3 words per node)
5. Return valid JSON only`

    const prompt = `Create a mind map tree for the English word "${cleanWord}".

The tree structure should include these branches:
- Synonyms (words with similar meaning)
- Antonyms (words with opposite meaning)
- Related Words (words often used together with this word)
- Word Forms (different forms of this word: noun, verb, adjective, adverb)
- Examples (short 2-3 word phrases using the word)

Each branch should have 3-5 child nodes.

Return ONLY a JSON object with this exact structure:
{
  "root": {
    "word": "${cleanWord}",
    "children": [
      {
        "word": "Synonyms",
        "children": [
          { "word": "synonym1", "children": [] },
          { "word": "synonym2", "children": [] }
        ]
      },
      {
        "word": "Antonyms",
        "children": [
          { "word": "antonym1", "children": [] },
          { "word": "antonym2", "children": [] }
        ]
      },
      {
        "word": "Related",
        "children": [
          { "word": "related1", "children": [] },
          { "word": "related2", "children": [] }
        ]
      },
      {
        "word": "Forms",
        "children": [
          { "word": "form1", "children": [] },
          { "word": "form2", "children": [] }
        ]
      },
      {
        "word": "Phrases",
        "children": [
          { "word": "phrase1", "children": [] },
          { "word": "phrase2", "children": [] }
        ]
      }
    ]
  }
}

IMPORTANT: Return ONLY valid JSON. No markdown. No explanation. Just the JSON object.`

    const data = await callGeminiJSON<MindMapResponse>(prompt, systemPrompt)

    if (!data?.root) {
      return NextResponse.json({ error: 'Failed to generate mind map' }, { status: 500 })
    }

    return NextResponse.json({ mindMap: data.root })
  } catch (error) {
    console.error('Mind Map API error:', error)
    return NextResponse.json({ error: 'Failed to generate mind map' }, { status: 500 })
  }
}
