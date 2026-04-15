import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get notification settings for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

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
    const { userId, ...updates } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

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
