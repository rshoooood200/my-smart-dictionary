import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// GET - جلب جميع الخرائط الذهنية المحفوظة
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    console.log('[mindmaps GET] userId:', userId)

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

    console.log('[mindmaps GET] Found', data.length, 'maps')
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[mindmaps GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saved mind maps', details: String(error) },
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

    console.log('[mindmaps POST] userId:', userId)

    const body = await request.json()
    const { word, treeData, wordCount } = body

    console.log('[mindmaps POST] word:', word, 'wordCount:', wordCount, 'hasTreeData:', !!treeData)

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
    }).catch(err => {
      console.error('[mindmaps POST] findUnique error:', err)
      return null
    })

    if (existing) {
      console.log('[mindmaps POST] Updating existing map:', existing.id)
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
    console.log('[mindmaps POST] Creating new map for word:', word.toLowerCase())
    const saved = await db.savedMindMap.create({
      data: {
        userId,
        word: word.toLowerCase(),
        treeData: JSON.stringify(treeData),
        wordCount: wordCount || 0
      }
    })

    console.log('[mindmaps POST] Created map:', saved.id)
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
    console.error('[mindmaps POST] Error saving mind map:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save mind map', details: String(error) },
      { status: 500 }
    )
  }
}
