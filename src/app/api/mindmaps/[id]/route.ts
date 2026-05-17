import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';

// PATCH - تحديث جزئي (مثل toggle favorite)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const { id } = await params;
    const body = await request.json();
    const { isFavorite } = body;

    // Verify ownership
    const existing = await db.savedMindMap.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'الخريطة غير موجودة' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const mindMap = await db.savedMindMap.update({
      where: { id },
      data: updateData
    });

    const parsedMap = {
      ...mindMap,
      treeData: JSON.parse(mindMap.treeData)
    };

    return NextResponse.json({ success: true, data: parsedMap });
  } catch (error) {
    console.error('Error updating mind map:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update mind map' },
      { status: 500 }
    );
  }
}

// PUT - تحديث خريطة كاملة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const { id } = await params;
    const body = await request.json();
    const { treeData, wordCount } = body;

    // Verify ownership
    const existing = await db.savedMindMap.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'الخريطة غير موجودة' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (treeData) updateData.treeData = JSON.stringify(treeData);
    if (wordCount !== undefined) updateData.wordCount = wordCount;

    const mindMap = await db.savedMindMap.update({
      where: { id },
      data: updateData
    });

    const parsedMap = {
      ...mindMap,
      treeData: JSON.parse(mindMap.treeData)
    };

    return NextResponse.json({ success: true, data: parsedMap });
  } catch (error) {
    console.error('Error updating mind map:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update mind map' },
      { status: 500 }
    );
  }
}

// DELETE - حذف خريطة ذهنية
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const { id } = await params;

    // Verify ownership
    const existing = await db.savedMindMap.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'الخريطة غير موجودة' },
        { status: 404 }
      );
    }

    await db.savedMindMap.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف الخريطة بنجاح' 
    });
  } catch (error) {
    console.error('Error deleting mind map:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete mind map' },
      { status: 500 }
    );
  }
}
