import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب إعدادات إمكانية الوصول واللغة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // accessibility, language, all

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'accessibility' || type === 'all' || !type) {
      const accessibility = await db.accessibilitySettings.findUnique({
        where: { userId }
      })

      if (type === 'accessibility') {
        return NextResponse.json({ accessibility })
      }

      const language = await db.userLanguage.findUnique({
        where: { userId }
      })

      return NextResponse.json({ accessibility, language })
    }

    if (type === 'language') {
      const language = await db.userLanguage.findUnique({
        where: { userId }
      })
      return NextResponse.json({ language })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching accessibility settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST - إنشاء إعدادات جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, settings } = body

    if (!userId || !type || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (type === 'accessibility') {
      const existing = await db.accessibilitySettings.findUnique({
        where: { userId }
      })

      if (existing) {
        return NextResponse.json({ error: 'Settings already exist. Use PUT to update.' }, { status: 400 })
      }

      const accessibility = await db.accessibilitySettings.create({
        data: {
          userId,
          ...settings
        }
      })

      return NextResponse.json({ accessibility })
    }

    if (type === 'language') {
      const existing = await db.userLanguage.findUnique({
        where: { userId }
      })

      if (existing) {
        return NextResponse.json({ error: 'Settings already exist. Use PUT to update.' }, { status: 400 })
      }

      const language = await db.userLanguage.create({
        data: {
          userId,
          ...settings
        }
      })

      return NextResponse.json({ language })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error creating settings:', error)
    return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
  }
}

// PUT - تحديث الإعدادات
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, settings } = body

    if (!userId || !type || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (type === 'accessibility') {
      const accessibility = await db.accessibilitySettings.upsert({
        where: { userId },
        create: {
          userId,
          ...settings
        },
        update: {
          ...settings
        }
      })

      return NextResponse.json({ accessibility })
    }

    if (type === 'language') {
      const language = await db.userLanguage.upsert({
        where: { userId },
        create: {
          userId,
          ...settings
        },
        update: {
          ...settings
        }
      })

      return NextResponse.json({ language })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

// DELETE - إعادة تعيين الإعدادات
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'accessibility') {
      await db.accessibilitySettings.delete({
        where: { userId }
      })
      return NextResponse.json({ success: true })
    }

    if (type === 'language') {
      await db.userLanguage.delete({
        where: { userId }
      })
      return NextResponse.json({ success: true })
    }

    // حذف الكل
    await Promise.all([
      db.accessibilitySettings.deleteMany({ where: { userId } }),
      db.userLanguage.deleteMany({ where: { userId } })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting settings:', error)
    return NextResponse.json({ error: 'Failed to delete settings' }, { status: 500 })
  }
}
