import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع السمات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // all, public, mine, purchased

    let themes = []

    if (type === 'mine' && userId) {
      // السمات التي يملكها المستخدم
      themes = await db.customTheme.findMany({
        where: {
          userThemes: {
            some: { userId }
          }
        },
        include: {
          userThemes: {
            where: { userId },
            select: { id: true, isActive: true, customizations: true, purchasedAt: true }
          }
        }
      })
    } else if (type === 'purchased' && userId) {
      // السمات المشتراة
      themes = await db.customTheme.findMany({
        where: {
          userThemes: {
            some: { userId }
          }
        }
      })
    } else {
      // السمات العامة والرسمية
      themes = await db.customTheme.findMany({
        where: {
          OR: [
            { isPublic: true },
            { isOfficial: true }
          ]
        },
        orderBy: [
          { isOfficial: 'desc' },
          { downloads: 'desc' }
        ]
      })
    }

    return NextResponse.json({ themes })
  } catch (error) {
    console.error('Error fetching themes:', error)
    return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 })
  }
}

// POST - إنشاء سمة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      name,
      nameAr,
      description,
      descriptionAr,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      surfaceColor,
      textColor,
      textSecondary,
      successColor,
      warningColor,
      errorColor,
      infoColor,
      fontFamily,
      fontSizeBase,
      fontSizeSm,
      fontSizeLg,
      fontSizeXl,
      borderRadius,
      shadowIntensity,
      backgroundType,
      backgroundGradient,
      backgroundImage,
      backgroundBlur,
      animationSpeed,
      reducedMotion,
      darkMode,
      darkPrimaryColor,
      darkSecondaryColor,
      darkAccentColor,
      darkBackgroundColor,
      darkSurfaceColor,
      darkTextColor,
      darkTextSecondary,
      tags,
      isPublic
    } = body

    const theme = await db.customTheme.create({
      data: {
        userId: userId || null,
        name,
        nameAr,
        description,
        descriptionAr,
        primaryColor: primaryColor || '#10B981',
        secondaryColor: secondaryColor || '#14B8A6',
        accentColor: accentColor || '#F59E0B',
        backgroundColor: backgroundColor || '#FFFFFF',
        surfaceColor: surfaceColor || '#F3F4F6',
        textColor: textColor || '#1F2937',
        textSecondary: textSecondary || '#6B7280',
        successColor: successColor || '#10B981',
        warningColor: warningColor || '#F59E0B',
        errorColor: errorColor || '#EF4444',
        infoColor: infoColor || '#3B82F6',
        fontFamily: fontFamily || 'Inter',
        fontSizeBase: fontSizeBase || '16',
        fontSizeSm: fontSizeSm || '14',
        fontSizeLg: fontSizeLg || '18',
        fontSizeXl: fontSizeXl || '24',
        borderRadius: borderRadius || '8',
        shadowIntensity: shadowIntensity || 'medium',
        backgroundType: backgroundType || 'solid',
        backgroundGradient,
        backgroundImage,
        backgroundBlur: backgroundBlur || false,
        animationSpeed: animationSpeed || 'normal',
        reducedMotion: reducedMotion || false,
        darkMode: darkMode || 'auto',
        darkPrimaryColor: darkPrimaryColor || '#10B981',
        darkSecondaryColor: darkSecondaryColor || '#14B8A6',
        darkAccentColor: darkAccentColor || '#F59E0B',
        darkBackgroundColor: darkBackgroundColor || '#111827',
        darkSurfaceColor: darkSurfaceColor || '#1F2937',
        darkTextColor: darkTextColor || '#F9FAFB',
        darkTextSecondary: darkTextSecondary || '#9CA3AF',
        tags: JSON.stringify(tags || []),
        isPublic: isPublic || false
      }
    })

    // إذا كان المستخدم ينشئ سمة لنفسه، نربطها به تلقائياً
    if (userId) {
      await db.userTheme.create({
        data: {
          userId,
          themeId: theme.id,
          isActive: true
        }
      })
    }

    return NextResponse.json({ theme })
  } catch (error) {
    console.error('Error creating theme:', error)
    return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 })
  }
}
