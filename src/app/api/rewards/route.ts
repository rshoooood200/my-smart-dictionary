import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get rewards data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'daily'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'daily') {
      // Get today's reward status
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get user's claimed rewards this week
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())

      const claimedRewards = await db.dailyReward.findMany({
        where: {
          userId,
          claimedAt: { gte: weekStart }
        },
        orderBy: { day: 'asc' }
      })

      // Calculate current day in streak
      const lastClaimedDay = claimedRewards.length > 0 
        ? Math.max(...claimedRewards.map(r => r.day))
        : 0

      // Check if user can claim today
      const todayDayOfWeek = today.getDay() + 1 // 1-7
      const canClaim = !claimedRewards.find(r => {
        const claimDate = new Date(r.claimedAt)
        claimDate.setHours(0, 0, 0, 0)
        return claimDate.getTime() === today.getTime()
      })

      // Check if streak is broken (missed yesterday)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const claimedYesterday = claimedRewards.find(r => {
        const claimDate = new Date(r.claimedAt)
        claimDate.setHours(0, 0, 0, 0)
        return claimDate.getTime() === yesterday.getTime()
      })

      // If streak is broken and didn't claim today, reset to day 1
      const currentStreakDay = canClaim 
        ? (claimedYesterday ? lastClaimedDay + 1 : 1)
        : lastClaimedDay

      // Daily reward values (increasing each day)
      const dailyRewards = [
        { day: 1, coins: 10, gems: 0, xp: 5 },
        { day: 2, coins: 15, gems: 0, xp: 10 },
        { day: 3, coins: 20, gems: 1, xp: 15 },
        { day: 4, coins: 25, gems: 1, xp: 20 },
        { day: 5, coins: 30, gems: 2, xp: 25 },
        { day: 6, coins: 40, gems: 2, xp: 30 },
        { day: 7, coins: 50, gems: 5, xp: 50 } // Bonus day
      ]

      const nextReward = dailyRewards[(currentStreakDay - 1) % 7]

      return NextResponse.json({
        currentStreakDay: ((currentStreakDay - 1) % 7) + 1,
        totalDays: currentStreakDay,
        canClaim,
        nextReward,
        claimedDays: claimedRewards.map(r => r.day),
        dailyRewards
      })
    }

    if (type === 'history') {
      const transactions = await db.currencyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      return NextResponse.json({ transactions })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Rewards API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Claim rewards
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, data } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'claim-daily') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if already claimed today
      const existing = await db.dailyReward.findFirst({
        where: {
          userId,
          claimedAt: { gte: today }
        }
      })

      if (existing) {
        return NextResponse.json({ error: 'Already claimed today' }, { status: 400 })
      }

      // Calculate which day in streak
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())

      const claimedThisWeek = await db.dailyReward.count({
        where: {
          userId,
          claimedAt: { gte: weekStart }
        }
      })

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const claimedYesterday = await db.dailyReward.findFirst({
        where: {
          userId,
          claimedAt: { gte: yesterday, lt: today }
        }
      })

      // If streak broken, start from day 1
      const currentDay = claimedYesterday ? claimedThisWeek + 1 : 1
      const actualDay = ((currentDay - 1) % 7) + 1 // 1-7 cycle

      // Calculate rewards
      const dailyRewards = [
        { coins: 10, gems: 0, xp: 5 },
        { coins: 15, gems: 0, xp: 10 },
        { coins: 20, gems: 1, xp: 15 },
        { coins: 25, gems: 1, xp: 20 },
        { coins: 30, gems: 2, xp: 25 },
        { coins: 40, gems: 2, xp: 30 },
        { coins: 50, gems: 5, xp: 50 }
      ]

      const reward = dailyRewards[actualDay - 1]

      // Get or create user currency
      let userCurrency = await db.userCurrency.findUnique({ where: { userId } })
      if (!userCurrency) {
        userCurrency = await db.userCurrency.create({ data: { userId } })
      }

      // Claim reward
      const [dailyReward, updatedCurrency] = await db.$transaction([
        db.dailyReward.create({
          data: {
            userId,
            day: actualDay,
            coinsReward: reward.coins,
            gemsReward: reward.gems,
            xpReward: reward.xp
          }
        }),
        db.userCurrency.update({
          where: { userId },
          data: {
            coins: { increment: reward.coins },
            gems: { increment: reward.gems },
            totalEarned: { increment: reward.coins + reward.gems * 10 }
          }
        }),
        db.currencyTransaction.create({
          data: {
            userId,
            type: 'earn',
            currency: 'coins',
            amount: reward.coins,
            reason: 'daily_reward',
            balanceAfter: userCurrency.coins + reward.coins
          }
        }),
        db.user.update({
          where: { id: userId },
          data: { xp: { increment: reward.xp } }
        })
      ])

      return NextResponse.json({
        success: true,
        reward,
        currentDay: actualDay,
        newBalance: {
          coins: updatedCurrency.coins,
          gems: updatedCurrency.gems
        }
      })
    }

    if (type === 'earn-currency') {
      const { amount, currency, reason, relatedId } = data

      // Get or create user currency
      let userCurrency = await db.userCurrency.findUnique({ where: { userId } })
      if (!userCurrency) {
        userCurrency = await db.userCurrency.create({ data: { userId } })
      }

      const [updatedCurrency] = await db.$transaction([
        db.userCurrency.update({
          where: { userId },
          data: {
            [currency]: { increment: amount },
            totalEarned: { increment: currency === 'coins' ? amount : amount * 10 }
          }
        }),
        db.currencyTransaction.create({
          data: {
            userId,
            type: 'earn',
            currency,
            amount,
            reason: reason || 'earned',
            relatedId,
            balanceAfter: userCurrency[currency] + amount
          }
        })
      ])

      return NextResponse.json({ success: true, newBalance: updatedCurrency })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Rewards POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
