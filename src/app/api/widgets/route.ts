import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب ودجات المستخدم
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const position = searchParams.get('position')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (position) {
      where.position = position
    }

    const widgets = await db.userWidget.findMany({
      where,
      orderBy: { order: 'asc' }
    })

    const preference = await db.widgetPreference.findUnique({
      where: { userId }
    })

    return NextResponse.json({ widgets, preference })
  } catch (error) {
    console.error('Error fetching widgets:', error)
    return NextResponse.json({ error: 'Failed to fetch widgets' }, { status: 500 })
  }
}

// POST - إنشاء أو تحديث ودجة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, position, size, settings, refreshInterval, order } = body

    if (!userId || !type || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const widget = await db.userWidget.upsert({
      where: {
        userId_type_position: {
          userId,
          type,
          position
        }
      },
      create: {
        userId,
        type,
        position,
        size: size || 'medium',
        settings: JSON.stringify(settings || {}),
        refreshInterval: refreshInterval || 60,
        order: order || 0
      },
      update: {
        size: size || 'medium',
        settings: JSON.stringify(settings || {}),
        refreshInterval: refreshInterval || 60,
        order: order || 0
      }
    })

    return NextResponse.json({ widget })
  } catch (error) {
    console.error('Error creating/updating widget:', error)
    return NextResponse.json({ error: 'Failed to create/update widget' }, { status: 500 })
  }
}

// PUT - تحديث إعدادات الودجات
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, preference } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const widgetPreference = await db.widgetPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...preference
      },
      update: {
        ...preference
      }
    })

    return NextResponse.json({ preference: widgetPreference })
  } catch (error) {
    console.error('Error updating widget preferences:', error)
    return NextResponse.json({ error: 'Failed to update widget preferences' }, { status: 500 })
  }
}

// PATCH - تحديث جزئي للودجات
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, widgetIds, orders } = body

    if (action === 'reorder' && userId && orders) {
      // إعادة ترتيب الودجات
      for (const { id, order } of orders) {
        await db.userWidget.update({
          where: { id },
          data: { order }
        })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'toggle' && userId && widgetIds) {
      // تفعيل/تعطيل ودجات
      for (const id of widgetIds) {
        const widget = await db.userWidget.findUnique({ where: { id } })
        if (widget) {
          await db.userWidget.update({
            where: { id },
            data: { isEnabled: !widget.isEnabled }
          })
        }
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'reset' && userId) {
      // إعادة تعيين الودجات للوضع الافتراضي
      await db.userWidget.deleteMany({ where: { userId } })
      
      const defaultWidgets = [
        { type: 'daily_word', position: 'home', order: 0, size: 'medium' },
        { type: 'progress', position: 'home', order: 1, size: 'medium' },
        { type: 'streak', position: 'home', order: 2, size: 'small' },
        { type: 'quick_review', position: 'home', order: 3, size: 'large' }
      ]

      for (const widget of defaultWidgets) {
        await db.userWidget.create({
          data: {
            userId,
            ...widget,
            settings: '{}',
            refreshInterval: 60
          }
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in widget action:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}

// DELETE - حذف ودجة
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Widget ID is required' }, { status: 400 })
    }

    await db.userWidget.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting widget:', error)
    return NextResponse.json({ error: 'Failed to delete widget' }, { status: 500 })
  }
}
