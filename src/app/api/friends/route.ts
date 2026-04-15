import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get friends and friend requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'friends'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'friends') {
      // Get accepted friends
      const friendships = await db.friendship.findMany({
        where: {
          OR: [
            { requesterId: userId, status: 'accepted' },
            { addresseeId: userId, status: 'accepted' }
          ]
        },
        include: {
          requester: {
            select: { id: true, name: true, level: true, xp: true, currentStreak: true, avatar: true }
          },
          addressee: {
            select: { id: true, name: true, level: true, xp: true, currentStreak: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Transform to get friend data
      const friends = friendships.map(f => {
        const friend = f.requesterId === userId ? f.addressee : f.requester
        return {
          id: friend.id,
          name: friend.name,
          level: friend.level,
          xp: friend.xp,
          currentStreak: friend.currentStreak,
          avatar: friend.avatar,
          friendshipId: f.id,
          friendsSince: f.updatedAt
        }
      })

      return NextResponse.json({ friends })
    }

    if (type === 'requests') {
      // Get pending friend requests
      const requests = await db.friendship.findMany({
        where: {
          addresseeId: userId,
          status: 'pending'
        },
        include: {
          requester: {
            select: { id: true, name: true, level: true, xp: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ requests })
    }

    if (type === 'sent-requests') {
      // Get sent friend requests
      const sentRequests = await db.friendship.findMany({
        where: {
          requesterId: userId,
          status: 'pending'
        },
        include: {
          addressee: {
            select: { id: true, name: true, level: true, xp: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ sentRequests })
    }

    if (type === 'search') {
      const query = searchParams.get('q')
      if (!query || query.length < 2) {
        return NextResponse.json({ users: [] })
      }

      // Search for users
      const users = await db.user.findMany({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                { name: { contains: query } },
                { email: { contains: query } }
              ]
            }
          ]
        },
        select: { id: true, name: true, level: true, xp: true, avatar: true }
      })

      // Check friendship status for each user
      const usersWithStatus = await Promise.all(users.map(async (user) => {
        const friendship = await db.friendship.findFirst({
          where: {
            OR: [
              { requesterId: userId, addresseeId: user.id },
              { requesterId: user.id, addresseeId: userId }
            ]
          }
        })

        return {
          ...user,
          friendshipStatus: friendship?.status || null,
          friendshipId: friendship?.id || null
        }
      }))

      return NextResponse.json({ users: usersWithStatus })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Friends API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Send friend request or respond to request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, data } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'send-request') {
      const { friendId } = data

      if (!friendId || friendId === userId) {
        return NextResponse.json({ error: 'Invalid friend ID' }, { status: 400 })
      }

      // Check if friendship already exists
      const existing = await db.friendship.findFirst({
        where: {
          OR: [
            { requesterId: userId, addresseeId: friendId },
            { requesterId: friendId, addresseeId: userId }
          ]
        }
      })

      if (existing) {
        return NextResponse.json({ error: 'Friendship already exists', status: existing.status }, { status: 400 })
      }

      // Create friend request
      const friendship = await db.friendship.create({
        data: {
          requesterId: userId,
          addresseeId: friendId,
          status: 'pending'
        }
      })

      return NextResponse.json({ friendship, success: true })
    }

    if (type === 'accept-request') {
      const { friendshipId } = data

      const friendship = await db.friendship.findFirst({
        where: {
          id: friendshipId,
          addresseeId: userId,
          status: 'pending'
        }
      })

      if (!friendship) {
        return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
      }

      await db.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' }
      })

      return NextResponse.json({ success: true })
    }

    if (type === 'reject-request') {
      const { friendshipId } = data

      await db.friendship.deleteMany({
        where: {
          id: friendshipId,
          addresseeId: userId,
          status: 'pending'
        }
      })

      return NextResponse.json({ success: true })
    }

    if (type === 'cancel-request') {
      const { friendshipId } = data

      await db.friendship.deleteMany({
        where: {
          id: friendshipId,
          requesterId: userId,
          status: 'pending'
        }
      })

      return NextResponse.json({ success: true })
    }

    if (type === 'remove-friend') {
      const { friendshipId } = data

      await db.friendship.delete({
        where: { id: friendshipId }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Friends POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
