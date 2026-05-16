import { NextResponse } from 'next/server'
import { db } from './db'

/**
 * التحقق من ملكية المستخدم لكلمة معينة
 * يرفض userId الفارغ أو غير المحدد لمنع تجاوز الملكية
 */
export async function verifyWordOwnership(wordId: string, userId: string | null | undefined) {
  if (!userId) return null
  const word = await db.word.findFirst({
    where: { id: wordId, userId }
  })
  return word
}

/**
 * التحقق من ملكية المستخدم لتصنيف معين
 */
export async function verifyCategoryOwnership(categoryId: string, userId: string | null | undefined) {
  if (!userId) return null
  const category = await db.category.findFirst({
    where: { id: categoryId, userId }
  })
  return category
}

/**
 * التحقق من ملكية المستخدم لملاحظة معينة
 */
export async function verifyNoteOwnership(noteId: string, userId: string | null | undefined) {
  if (!userId) return null
  const note = await db.note.findFirst({
    where: { id: noteId, userId }
  })
  return note
}

/**
 * التحقق من ملكية المستخدم لقصة معينة
 */
export async function verifyStoryOwnership(storyId: string, userId: string | null | undefined) {
  if (!userId) return null
  const story = await db.story.findFirst({
    where: { id: storyId, userId }
  })
  return story
}

/**
 * التحقق من وجود userId وإرجاع خطأ إذا لم يكن موجوداً
 */
export function validateUserId(userId: string | null) {
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'userId مطلوب' },
      { status: 400 }
    )
  }
  return null
}

/**
 * التحقق من صلاحية المستخدم وإرجاع خطأ إذا لم يكن مصرحاً
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'غير مصرح لك بالوصول إلى هذا المورد' },
    { status: 403 }
  )
}

/**
 * التحقق من صحة التاريخ
 */
export function isValidDate(dateString: string | Date | null | undefined): boolean {
  if (!dateString) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * تنظيف النص من أي HTML أو كود خطير
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}
