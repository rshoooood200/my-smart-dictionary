import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب سمة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const theme = await db.customTheme.findUnique({
      where: { id },
      include: {
        userThemes: {
          select: {
            userId: true,
            isActive: true,
            customizations: true
          }
        }
      }
    })

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    return NextResponse.json({ theme })
  } catch (error) {
    console.error('Error fetching theme:', error)
    return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 })
  }
}

// PUT - تحديث سمة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const theme = await db.customTheme.update({
      where: { id },
      data: body
    })

    return NextResponse.json({ theme })
  } catch (error) {
    console.error('Error updating theme:', error)
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 })
  }
}

// DELETE - حذف سمة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.customTheme.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting theme:', error)
    return NextResponse.json({ error: 'Failed to delete theme' }, { status: 500 })
  }
}

// PATCH - تحديث جزئي أو إجراء خاص
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, userId, customizations } = body

    if (action === 'purchase' && userId) {
      // شراء/الحصول على السمة
      const existingUserTheme = await db.userTheme.findUnique({
        where: {
          userId_themeId: {
            userId,
            themeId: id
          }
        }
      })

      if (existingUserTheme) {
        return NextResponse.json({ error: 'Theme already purchased' }, { status: 400 })
      }

      // التحقق من العملة
      const theme = await db.customTheme.findUnique({ where: { id } })
      if (!theme) {
        return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
      }

      if (theme.isPremium && theme.price > 0) {
        const userCurrency = await db.userCurrency.findUnique({ where: { userId } })
        if (!userCurrency) {
          return NextResponse.json({ error: 'User currency not found' }, { status: 400 })
        }

        const currencyField = theme.currency === 'gems' ? 'gems' : 'coins'
        if (userCurrency[currencyField] < theme.price) {
          return NextResponse.json({ error: 'Insufficient currency' }, { status: 400 })
        }

        // خصم العملة
        await db.userCurrency.update({
          where: { userId },
          data: {
            [currencyField]: { decrement: theme.price },
            totalSpent: { increment: theme.price }
          }
        })

        // تسجيل المعاملة
        await db.currencyTransaction.create({
          data: {
            userId,
            type: 'spend',
            currency: theme.currency,
            amount: theme.price,
            reason: 'theme_purchase',
            relatedId: theme.id,
            balanceAfter: userCurrency[currencyField] - theme.price
          }
        })
      }

      // إضافة السمة للمستخدم
      const userTheme = await db.userTheme.create({
        data: {
          userId,
          themeId: id,
          isActive: false
        }
      })

      // تحديث عدد التحميلات
      await db.customTheme.update({
        where: { id },
        data: { downloads: { increment: 1 } }
      })

      return NextResponse.json({ success: true, userTheme })
    }

    if (action === 'activate' && userId) {
      // تفعيل السمة
      await db.userTheme.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      })

      const userTheme = await db.userTheme.update({
        where: {
          userId_themeId: {
            userId,
            themeId: id
          }
        },
        data: { isActive: true }
      })

      return NextResponse.json({ success: true, userTheme })
    }

    if (action === 'customize' && userId && customizations) {
      // تخصيص السمة
      const userTheme = await db.userTheme.update({
        where: {
          userId_themeId: {
            userId,
            themeId: id
          }
        },
        data: { customizations: JSON.stringify(customizations) }
      })

      return NextResponse.json({ success: true, userTheme })
    }

    if (action === 'like') {
      // إضافة إعجاب
      const theme = await db.customTheme.update({
        where: { id },
        data: { likes: { increment: 1 } }
      })
      return NextResponse.json({ success: true, likes: theme.likes })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in theme action:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}
