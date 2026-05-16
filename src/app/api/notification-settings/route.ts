import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

// GET - Get notification settings for a user
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    let settings = await db.notificationSetting.findUnique({
      where: { userId }
    })

    // Create default settings if not exists
    if (!settings) {
      settings = await db.notificationSetting.create({
        data: { userId }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 })
  }
}

// PUT - Update notification settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ...updates } = body

    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    // Remove fields that shouldn't be updated directly
    delete updates.id
    delete updates.createdAt
    delete updates.updatedAt

    const settings = await db.notificationSetting.upsert({
      where: { userId },
      update: updates,
      create: { userId, ...updates }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 })
  }
}
