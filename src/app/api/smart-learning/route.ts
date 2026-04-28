import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب البيانات الذكية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // recommendations, plans, analysis, patterns, all

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'recommendations' || type === 'all') {
      const recommendations = await db.learningRecommendation.findMany({
        where: { userId, isShown: false },
        orderBy: [
          { priority: 'desc' },
          { score: 'desc' }
        ],
        take: 10
      })

      if (type === 'recommendations') {
        return NextResponse.json({ recommendations })
      }

      const plans = await db.studyPlan.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' }
      })

      const analysis = await db.weakAreaAnalysis.findMany({
        where: { userId },
        orderBy: { severity: 'desc' }
      })

      let pattern = await db.learningPattern.findUnique({
        where: { userId }
      })

      // إنشاء نمط تعلم جديد إذا لم يكن موجوداً
      if (!pattern) {
        pattern = await db.learningPattern.create({
          data: { userId }
        })
      }

      return NextResponse.json({
        recommendations,
        plans,
        analysis,
        pattern
      })
    }

    if (type === 'plans') {
      const plans = await db.studyPlan.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ plans })
    }

    if (type === 'analysis') {
      const analysis = await db.weakAreaAnalysis.findMany({
        where: { userId },
        orderBy: { severity: 'desc' }
      })
      return NextResponse.json({ analysis })
    }

    if (type === 'patterns') {
      let pattern = await db.learningPattern.findUnique({
        where: { userId }
      })

      if (!pattern) {
        pattern = await db.learningPattern.create({
          data: { userId }
        })
      }

      return NextResponse.json({ pattern })
    }

    if (type === 'reminders') {
      const reminders = await db.smartReminder.findMany({
        where: { userId, isSent: false },
        orderBy: { scheduledFor: 'asc' },
        take: 10
      })
      return NextResponse.json({ reminders })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching smart learning data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

// POST - إنشاء توصيات أو خطط جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, data } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'generate_recommendations') {
      // توليد توصيات ذكية
      const recommendations = []

      // توصية مراجعة الكلمات المستحقة
      recommendations.push({
        userId,
        type: 'review',
        priority: 'high',
        title: 'Review Due Words',
        titleAr: 'مراجعة الكلمات المستحقة',
        description: 'You have words that need review',
        descriptionAr: 'لديك كلمات تحتاج مراجعة',
        reason: 'Spaced repetition algorithm',
        reasonAr: 'خوارزمية التكرار المتباعد',
        score: 0.95
      })

      // توصية تحسين نقاط الضعف
      recommendations.push({
        userId,
        type: 'category',
        priority: 'medium',
        title: 'Focus on Weak Areas',
        titleAr: 'ركز على نقاط الضعف',
        description: 'Improve your weak categories',
        descriptionAr: 'حسّن تصنيفاتك الضعيفة',
        reason: 'Performance analysis',
        reasonAr: 'تحليل الأداء',
        score: 0.85
      })

      // توصية لعب ألعاب
      recommendations.push({
        userId,
        type: 'game',
        priority: 'low',
        title: 'Play Learning Games',
        titleAr: 'العب ألعاب التعلم',
        description: 'Fun way to practice vocabulary',
        descriptionAr: 'طريقة ممتعة لممارسة المفردات',
        reason: 'Engagement optimization',
        reasonAr: 'تحسين المشاركة',
        score: 0.75
      })

      const created = await db.learningRecommendation.createMany({
        data: recommendations,
        skipDuplicates: true
      })

      return NextResponse.json({ created })
    }

    if (action === 'create_plan') {
      const plan = await db.studyPlan.create({
        data: {
          userId,
          title: data.title,
          titleAr: data.titleAr,
          description: data.description,
          descriptionAr: data.descriptionAr,
          goalType: data.goalType || 'daily',
          goalValue: data.goalValue || 10,
          preferredTime: data.preferredTime,
          duration: data.duration || 15,
          frequency: data.frequency || 1,
          difficulty: data.difficulty || 'adaptive',
          aiGenerated: data.aiGenerated || false,
          endDate: data.endDate ? new Date(data.endDate) : null
        }
      })

      return NextResponse.json({ plan })
    }

    if (action === 'analyze_weakness') {
      // تحليل نقاط الضعف
      const analysis = await db.weakAreaAnalysis.create({
        data: {
          userId,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          weaknessType: data.weaknessType || 'accuracy',
          severity: data.severity || 'moderate',
          affectedWords: data.affectedWords || 0,
          totalWords: data.totalWords || 0,
          averageScore: data.averageScore || 0,
          rootCause: data.rootCause,
          rootCauseAr: data.rootCauseAr,
          suggestions: JSON.stringify(data.suggestions || []),
          suggestedActions: JSON.stringify(data.suggestedActions || [])
        }
      })

      return NextResponse.json({ analysis })
    }

    if (action === 'update_pattern') {
      const pattern = await db.learningPattern.upsert({
        where: { userId },
        create: {
          userId,
          ...data
        },
        update: {
          ...data,
          lastUpdated: new Date()
        }
      })

      return NextResponse.json({ pattern })
    }

    if (action === 'create_reminder') {
      const reminder = await db.smartReminder.create({
        data: {
          userId,
          type: data.type || 'review',
          title: data.title,
          titleAr: data.titleAr,
          message: data.message,
          messageAr: data.messageAr,
          scheduledFor: new Date(data.scheduledFor),
          priority: data.priority || 'normal',
          frequency: data.frequency || 'once',
          context: JSON.stringify(data.context || {})
        }
      })

      return NextResponse.json({ reminder })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in smart learning action:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}

// PUT - تحديث التقدم أو الإجراءات
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, id, data } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'dismiss_recommendation' && id) {
      const recommendation = await db.learningRecommendation.update({
        where: { id },
        data: {
          isShown: true,
          dismissedAt: new Date()
        }
      })
      return NextResponse.json({ recommendation })
    }

    if (action === 'act_recommendation' && id) {
      const recommendation = await db.learningRecommendation.update({
        where: { id },
        data: {
          isShown: true,
          isActed: true,
          actedAt: new Date()
        }
      })
      return NextResponse.json({ recommendation })
    }

    if (action === 'update_plan_progress' && id) {
      const plan = await db.studyPlan.update({
        where: { id },
        data: {
          currentValue: { increment: data.increment || 1 },
          lastActiveDate: new Date()
        }
      })

      // تحقق من إكمال الخطة
      if (plan.currentValue >= plan.goalValue && !plan.isCompleted) {
        await db.studyPlan.update({
          where: { id },
          data: {
            isCompleted: true,
            completedAt: new Date()
          }
        })
      }

      return NextResponse.json({ plan })
    }

    if (action === 'complete_plan' && id) {
      const plan = await db.studyPlan.update({
        where: { id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          isActive: false
        }
      })
      return NextResponse.json({ plan })
    }

    if (action === 'mark_reminder_read' && id) {
      const reminder = await db.smartReminder.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
      return NextResponse.json({ reminder })
    }

    if (action === 'mark_reminder_acted' && id) {
      const reminder = await db.smartReminder.update({
        where: { id },
        data: {
          isActed: true,
          actedAt: new Date()
        }
      })
      return NextResponse.json({ reminder })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating smart learning data:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE - حذف البيانات
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (id) {
      if (type === 'recommendation') {
        await db.learningRecommendation.delete({ where: { id } })
      } else if (type === 'plan') {
        await db.studyPlan.delete({ where: { id } })
      } else if (type === 'reminder') {
        await db.smartReminder.delete({ where: { id } })
      }
      return NextResponse.json({ success: true })
    }

    // حذف جميع البيانات من نوع معين
    if (type === 'recommendations') {
      await db.learningRecommendation.deleteMany({ where: { userId } })
    } else if (type === 'plans') {
      await db.studyPlan.deleteMany({ where: { userId } })
    } else if (type === 'reminders') {
      await db.smartReminder.deleteMany({ where: { userId } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting smart learning data:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
