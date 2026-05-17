import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// GET - جلب جميع الخرائط الذهنية المحفوظة للمستخدم
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const mindMaps = await db.savedMindMap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Parse treeData from JSON string for each map
    const parsedMaps = mindMaps.map(map => ({
      ...map,
      treeData: JSON.parse(map.treeData)
    }));

    return NextResponse.json({ success: true, data: parsedMaps });
  } catch (error) {
    console.error('Error fetching mind maps:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mind maps' },
      { status: 500 }
    );
  }
}

// POST - حفظ خريطة ذهنية جديدة
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const body = await request.json();
    const { word, treeData, wordCount } = body;

    if (!word || !treeData) {
      return NextResponse.json(
        { success: false, error: 'الكلمة وبيانات الشجرة مطلوبة' },
        { status: 400 }
      );
    }

    // Use upsert: if the word already exists for this user, update it; otherwise create new
    const mindMap = await db.savedMindMap.upsert({
      where: {
        userId_word: { userId, word: word.toLowerCase() }
      },
      update: {
        treeData: JSON.stringify(treeData),
        wordCount: wordCount || 0,
        updatedAt: new Date()
      },
      create: {
        userId,
        word: word.toLowerCase(),
        treeData: JSON.stringify(treeData),
        wordCount: wordCount || 0,
        isFavorite: false
      }
    });

    const parsedMap = {
      ...mindMap,
      treeData: JSON.parse(mindMap.treeData)
    };

    return NextResponse.json({ success: true, data: parsedMap });
  } catch (error) {
    console.error('Error saving mind map:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save mind map' },
      { status: 500 }
    );
  }
}
