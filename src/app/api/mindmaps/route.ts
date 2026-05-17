import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// GET - جلب جميع الخرائط الذهنية المحفوظة
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { searchParams } = new URL(request.url)
    const isFavorite = searchParams.get('isFavorite')

    const where: Record<string, unknown> = { userId }

    if (isFavorite !== null && isFavorite !== '') {
      where.isFavorite = isFavorite === 'true'
    }

    const mindMaps = await db.savedMindMap.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse treeData JSON for each map
    const data = mindMaps.map(map => ({
      id: map.id,
      word: map.word,
      treeData: JSON.parse(map.treeData),
      wordCount: map.wordCount,
      isFavorite: map.isFavorite,
      savedAt: map.createdAt.toISOString()
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching saved mind maps:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saved mind maps' },
      { status: 500 }
    )
  }
}

// POST - حفظ خريطة ذهنية جديدة
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await request.json()
    const { word, treeData, wordCount } = body

    if (!word || !treeData) {
      return NextResponse.json(
        { success: false, error: 'الكلمة وبيانات الشجرة مطلوبة' },
        { status: 400 }
      )
    }

    // Check if a mind map for this word already exists for this user
    const existing = await db.savedMindMap.findUnique({
      where: {
        userId_word: { userId, word: word.toLowerCase() }
      }
    })

    if (existing) {
      // Update existing
      const updated = await db.savedMindMap.update({
        where: { id: existing.id },
        data: {
          treeData: JSON.stringify(treeData),
          wordCount: wordCount || 0,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          word: updated.word,
          treeData: JSON.parse(updated.treeData),
          wordCount: updated.wordCount,
          isFavorite: updated.isFavorite,
          savedAt: updated.createdAt.toISOString()
        }
      })
    }

    // Create new
    const saved = await db.savedMindMap.create({
      data: {
        userId,
        word: word.toLowerCase(),
        treeData: JSON.stringify(treeData),
        wordCount: wordCount || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: saved.id,
        word: saved.word,
        treeData: JSON.parse(saved.treeData),
        wordCount: saved.wordCount,
        isFavorite: saved.isFavorite,
        savedAt: saved.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error saving mind map:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save mind map' },
      { status: 500 }
    )
  }
}
