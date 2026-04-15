import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'overview'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'overview') {
      // Get last 30 days analytics
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const dailyAnalytics = await db.dailyAnalytics.findMany({
        where: {
          userId,
          date: { gte: thirtyDaysAgo }
        },
        orderBy: { date: 'asc' }
      })

      // Calculate totals
      const totals = dailyAnalytics.reduce((acc, day) => ({
        totalStudyTime: acc.totalStudyTime + day.totalStudyTime,
        wordsReviewed: acc.wordsReviewed + day.wordsReviewed,
        wordsLearned: acc.wordsLearned + day.wordsLearned,
        correctAnswers: acc.correctAnswers + day.correctAnswers,
        wrongAnswers: acc.wrongAnswers + day.wrongAnswers,
        xpEarned: acc.xpEarned + day.xpEarned,
      }), {
        totalStudyTime: 0,
        wordsReviewed: 0,
        wordsLearned: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        xpEarned: 0
      })

      const averageAccuracy = totals.correctAnswers + totals.wrongAnswers > 0
        ? (totals.correctAnswers / (totals.correctAnswers + totals.wrongAnswers)) * 100
        : 0

      // Get category strengths
      const categoryStrengths = await db.categoryStrength.findMany({
        where: { userId },
        include: {
          user: {
            include: {
              categories: {
                include: {
                  words: { select: { id: true } }
                }
              }
            }
          }
        }
      })

      // Get recent learning sessions
      const recentSessions = await db.learningSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: 10
      })

      // Calculate best learning time
      const hourlyActivity: Record<number, number> = {}
      dailyAnalytics.forEach(day => {
        if (day.peakHour !== null) {
          hourlyActivity[day.peakHour] = (hourlyActivity[day.peakHour] || 0) + day.totalStudyTime
        }
      })
      const bestHour = Object.entries(hourlyActivity)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null

      return NextResponse.json({
        dailyAnalytics,
        totals,
        averageAccuracy,
        categoryStrengths,
        recentSessions,
        bestHour: bestHour ? parseInt(bestHour) : null,
        activeDays: dailyAnalytics.length
      })
    }

    if (type === 'category-analysis') {
      const categoryStrengths = await db.categoryStrength.findMany({
        where: { userId },
        orderBy: { strengthScore: 'desc' }
      })

      // Get categories with word counts
      const categories = await db.category.findMany({
        where: { userId },
        include: {
          words: {
            select: {
              id: true,
              isLearned: true,
              correctCount: true,
              reviewCount: true
            }
          }
        }
      })

      const categoryAnalysis = categories.map(cat => {
        const words = cat.words
        const mastered = words.filter(w => w.isLearned && (w.correctCount / Math.max(w.reviewCount, 1)) >= 0.8).length
        const learning = words.filter(w => !w.isLearned || (w.correctCount / Math.max(w.reviewCount, 1)) < 0.8).length
        
        return {
          id: cat.id,
          name: cat.name,
          nameAr: cat.nameAr,
          color: cat.color,
          totalWords: words.length,
          masteredWords: mastered,
          learningWords: learning,
          strength: words.length > 0 ? (mastered / words.length) * 100 : 0
        }
      })

      return NextResponse.json({ categories: categoryAnalysis })
    }

    if (type === 'weekly-comparison') {
      // Get this week's data
      const thisWeekStart = new Date()
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
      thisWeekStart.setHours(0, 0, 0, 0)

      const lastWeekStart = new Date(thisWeekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)

      const thisWeekEnd = new Date(thisWeekStart)
      thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)

      const [thisWeek, lastWeek] = await Promise.all([
        db.dailyAnalytics.findMany({
          where: { userId, date: { gte: thisWeekStart, lt: thisWeekEnd } }
        }),
        db.dailyAnalytics.findMany({
          where: { userId, date: { gte: lastWeekStart, lt: thisWeekStart } }
        })
      ])

      const calcTotals = (data: typeof thisWeek) => data.reduce((acc, d) => ({
        wordsLearned: acc.wordsLearned + d.wordsLearned,
        wordsReviewed: acc.wordsReviewed + d.wordsReviewed,
        xpEarned: acc.xpEarned + d.xpEarned,
        studyTime: acc.studyTime + d.totalStudyTime
      }), { wordsLearned: 0, wordsReviewed: 0, xpEarned: 0, studyTime: 0 })

      return NextResponse.json({
        thisWeek: calcTotals(thisWeek),
        lastWeek: calcTotals(lastWeek),
        improvement: {
          wordsLearned: calcTotals(thisWeek).wordsLearned - calcTotals(lastWeek).wordsLearned,
          wordsReviewed: calcTotals(thisWeek).wordsReviewed - calcTotals(lastWeek).wordsReviewed,
          xpEarned: calcTotals(thisWeek).xpEarned - calcTotals(lastWeek).xpEarned,
          studyTime: calcTotals(thisWeek).studyTime - calcTotals(lastWeek).studyTime
        }
      })
    }

    if (type === 'retention-analysis') {
      // Get words with review history
      const words = await db.word.findMany({
        where: { userId },
        select: {
          id: true,
          word: true,
          reviewCount: true,
          correctCount: true,
          easeFactor: true,
          interval: true,
          lastReviewedAt: true,
          nextReviewAt: true,
          isLearned: true
        }
      })

      const retentionBuckets = {
        day1: { total: 0, remembered: 0 },
        day3: { total: 0, remembered: 0 },
        day7: { total: 0, remembered: 0 },
        day14: { total: 0, remembered: 0 },
        day30: { total: 0, remembered: 0 }
      }

      const now = new Date()
      words.forEach(w => {
        if (w.lastReviewedAt) {
          const daysSinceReview = Math.floor((now.getTime() - new Date(w.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24))
          const successRate = w.reviewCount > 0 ? w.correctCount / w.reviewCount : 0

          if (daysSinceReview <= 1) {
            retentionBuckets.day1.total++
            if (successRate >= 0.7) retentionBuckets.day1.remembered++
          }
          if (daysSinceReview <= 3) {
            retentionBuckets.day3.total++
            if (successRate >= 0.7) retentionBuckets.day3.remembered++
          }
          if (daysSinceReview <= 7) {
            retentionBuckets.day7.total++
            if (successRate >= 0.7) retentionBuckets.day7.remembered++
          }
          if (daysSinceReview <= 14) {
            retentionBuckets.day14.total++
            if (successRate >= 0.7) retentionBuckets.day14.remembered++
          }
          if (daysSinceReview <= 30) {
            retentionBuckets.day30.total++
            if (successRate >= 0.7) retentionBuckets.day30.remembered++
          }
        }
      })

      return NextResponse.json({ retentionBuckets, totalWords: words.length })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Record analytics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, data } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'record-session') {
      const { sessionType, duration, wordsStudied, correctCount, wrongCount, xpEarned, device, source } = data

      // Create learning session
      const session = await db.learningSession.create({
        data: {
          userId,
          sessionType: sessionType || 'review',
          duration: duration || 0,
          wordsStudied: wordsStudied || 0,
          correctCount: correctCount || 0,
          wrongCount: wrongCount || 0,
          xpEarned: xpEarned || 0,
          focusScore: wordsStudied > 0 ? (correctCount / wordsStudied) * 100 : 0,
          device,
          source,
          endedAt: new Date()
        }
      })

      // Update daily analytics
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await db.dailyAnalytics.upsert({
        where: { userId_date: { userId, date: today } },
        create: {
          userId,
          date: today,
          totalStudyTime: Math.floor((duration || 0) / 60),
          wordsReviewed: wordsStudied || 0,
          correctAnswers: correctCount || 0,
          wrongAnswers: wrongCount || 0,
          accuracy: wordsStudied > 0 ? (correctCount / wordsStudied) * 100 : 0,
          xpEarned: xpEarned || 0,
          peakHour: new Date().getHours()
        },
        update: {
          totalStudyTime: { increment: Math.floor((duration || 0) / 60) },
          wordsReviewed: { increment: wordsStudied || 0 },
          correctAnswers: { increment: correctCount || 0 },
          wrongAnswers: { increment: wrongCount || 0 },
          xpEarned: { increment: xpEarned || 0 }
        }
      })

      return NextResponse.json({ session, success: true })
    }

    if (type === 'update-category-strength') {
      const { categoryId } = data

      // Get category words with stats
      const words = await db.word.findMany({
        where: { userId, categoryId }
      })

      const totalWords = words.length
      const masteredWords = words.filter(w => w.isLearned && (w.correctCount / Math.max(w.reviewCount, 1)) >= 0.8).length
      const learningWords = totalWords - masteredWords
      const avgAccuracy = words.reduce((sum, w) => sum + (w.reviewCount > 0 ? w.correctCount / w.reviewCount : 0), 0) / Math.max(totalWords, 1)
      const strengthScore = (masteredWords / Math.max(totalWords, 1)) * 100

      const strength = await db.categoryStrength.upsert({
        where: { userId_categoryId: { userId, categoryId } },
        create: {
          userId,
          categoryId,
          totalWords,
          masteredWords,
          learningWords,
          averageAccuracy: avgAccuracy * 100,
          strengthScore,
          lastPracticed: new Date()
        },
        update: {
          totalWords,
          masteredWords,
          learningWords,
          averageAccuracy: avgAccuracy * 100,
          strengthScore,
          lastPracticed: new Date()
        }
      })

      return NextResponse.json({ strength, success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Analytics POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
