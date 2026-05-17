import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// Ensure the SavedMindMap table exists (auto-create if missing)
let tableEnsured = false
async function ensureTable() {
  if (tableEnsured) return
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SavedMindMap" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "word" TEXT NOT NULL,
        "treeData" TEXT NOT NULL,
        "wordCount" INTEGER NOT NULL DEFAULT 0,
        "isFavorite" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SavedMindMap_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "SavedMindMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)
    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SavedMindMap_userId_word_key" ON "SavedMindMap"("userId", "word");
    `)
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SavedMindMap_userId_idx" ON "SavedMindMap"("userId");
    `)
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SavedMindMap_userId_isFavorite_idx" ON "SavedMindMap"("userId", "isFavorite");
    `)
    tableEnsured = true
    console.log('[mindmaps] Table ensured successfully')
  } catch (error) {
    console.error('[mindmaps] Error ensuring table:', error)
    // If table already exists with constraints, mark as ensured anyway
    tableEnsured = true
  }
}

// GET - جلب جميع الخرائط الذهنية المحفوظة
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    await ensureTable()

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
    console.error('[mindmaps GET] Error:', error)
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

    await ensureTable()

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
    }).catch(() => null)

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
    console.error('[mindmaps POST] Error saving mind map:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save mind map' },
      { status: 500 }
    )
  }
}
