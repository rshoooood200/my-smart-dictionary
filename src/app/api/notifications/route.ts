import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (unreadOnly) where.isRead = false
    if (type) where.type = type

    const notifications = await db.notification.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    const unreadCount = await db.notification.count({
      where: { userId, isRead: false }
    })

    return NextResponse.json({ 
      notifications,
      unreadCount,
      total: notifications.length
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, type, title, titleAr, message, messageAr,
      icon, actionType, actionId, priority, scheduledFor, expiresAt
    } = body

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'userId, title, and message are required' }, { status: 400 })
    }

    const notification = await db.notification.create({
      data: {
        userId,
        type: type || 'general',
        title,
        titleAr,
        message,
        messageAr,
        icon,
        actionType,
        actionId,
        priority: priority || 'normal',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        sentAt: !scheduledFor ? new Date() : null
      }
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
