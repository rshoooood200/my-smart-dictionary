import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get community stats and data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'overview'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'overview') {
      // Get user stats for community
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          xp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
        }
      })

      // Get friends count
      const friendsCount = await db.friendship.count({
        where: {
          OR: [
            { requesterId: userId, status: 'accepted' },
            { addresseeId: userId, status: 'accepted' }
          ]
        }
      })

      // Get pending friend requests
      const pendingRequests = await db.friendship.count({
        where: {
          addresseeId: userId,
          status: 'pending'
        }
      })

      // Get active challenges
      const activeChallenges = await db.challenge.count({
        where: {
          OR: [
            { creatorId: userId },
            { opponentId: userId }
          ],
          status: 'active'
        }
      })

      // Get community lists count
      const communityListsCount = await db.communityList.count({
        where: { isPublic: true }
      })

      return NextResponse.json({
        user,
        friendsCount,
        pendingRequests,
        activeChallenges,
        communityListsCount
      })
    }

    if (type === 'community-lists') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const category = searchParams.get('category')
      const search = searchParams.get('search')

      const where: any = { isPublic: true }
      if (category) where.category = category
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { nameAr: { contains: search } },
          { description: { contains: search } }
        ]
      }

      const lists = await db.communityList.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, level: true }
          },
          _count: {
            select: { words: true, comments: true, ratings: true }
          }
        },
        orderBy: [
          { isOfficial: 'desc' },
          { downloads: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      })

      // Calculate average ratings
      const listsWithRating = await Promise.all(lists.map(async (list) => {
        const ratings = await db.communityRating.findMany({
          where: { listId: list.id },
          select: { rating: true }
        })
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0
        return { ...list, avgRating: Math.round(avgRating * 10) / 10 }
      }))

      return NextResponse.json({ lists: listsWithRating, page, limit })
    }

    if (type === 'list-detail') {
      const listId = searchParams.get('listId')
      if (!listId) {
        return NextResponse.json({ error: 'listId is required' }, { status: 400 })
      }

      const list = await db.communityList.findUnique({
        where: { id: listId },
        include: {
          creator: {
            select: { id: true, name: true, level: true, xp: true }
          },
          words: {
            orderBy: { order: 'asc' }
          },
          comments: {
            include: {
              user: { select: { id: true, name: true, level: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        }
      })

      if (!list) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }

      // Check if user has rated this list
      const userRating = await db.communityRating.findUnique({
        where: { listId_userId: { listId, userId } }
      })

      const ratings = await db.communityRating.findMany({
        where: { listId },
        select: { rating: true }
      })
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0

      return NextResponse.json({ 
        list: { 
          ...list, 
          avgRating: Math.round(avgRating * 10) / 10,
          userRating: userRating?.rating || 0
        } 
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Community API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create community list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, data } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'create-list') {
      const { name, nameAr, description, descriptionAr, category, tags, words, isPublic, difficulty } = data

      const list = await db.communityList.create({
        data: {
          name,
          nameAr,
          description,
          descriptionAr,
          category,
          tags: JSON.stringify(tags || []),
          creatorId: userId,
          isPublic: isPublic ?? true,
          difficulty: difficulty || 'intermediate',
          wordCount: words?.length || 0
        }
      })

      // Add words to the list
      if (words && words.length > 0) {
        await db.communityListWord.createMany({
          data: words.map((w: any, index: number) => ({
            listId: list.id,
            word: w.word,
            translation: w.translation,
            pronunciation: w.pronunciation,
            definition: w.definition,
            example: w.example,
            order: index
          }))
        })
      }

      return NextResponse.json({ list, success: true })
    }

    if (type === 'download-list') {
      const { listId } = data
      
      const list = await db.communityList.findUnique({
        where: { id: listId },
        include: { words: true }
      })

      if (!list) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }

      // Increment download count
      await db.communityList.update({
        where: { id: listId },
        data: { downloads: { increment: 1 } }
      })

      return NextResponse.json({ list, success: true })
    }

    if (type === 'add-comment') {
      const { listId, content } = data

      const comment = await db.communityComment.create({
        data: {
          listId,
          userId,
          content
        },
        include: {
          user: { select: { id: true, name: true, level: true } }
        }
      })

      return NextResponse.json({ comment, success: true })
    }

    if (type === 'add-rating') {
      const { listId, rating } = data

      const existingRating = await db.communityRating.findUnique({
        where: { listId_userId: { listId, userId } }
      })

      if (existingRating) {
        await db.communityRating.update({
          where: { id: existingRating.id },
          data: { rating }
        })
      } else {
        await db.communityRating.create({
          data: { listId, userId, rating }
        })

        // Update likes count
        await db.communityList.update({
          where: { id: listId },
          data: { likes: { increment: 1 } }
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Community POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
