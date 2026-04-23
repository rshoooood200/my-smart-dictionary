import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-client'

// API لتحديث قاعدة البيانات بإضافة أعمدة PDF المفقودة
export async function POST(request: NextRequest) {
  try {
    console.log('Starting database migration for PDF columns...')
    
    const results: string[] = []
    
    // التحقق من وجود الأعمدة وإضافتها إذا لم تكن موجودة
    const columnsToAdd = [
      { name: 'pdfUrl', type: 'TEXT', default: 'NULL' },
      { name: 'pdfTitle', type: 'TEXT', default: 'NULL' },
      { name: 'pdfTitleAr', type: 'TEXT', default: 'NULL' },
      { name: 'pdfPages', type: 'INTEGER', default: '0' },
      { name: 'isPdfLesson', type: 'BOOLEAN', default: 'false' }
    ]
    
    for (const column of columnsToAdd) {
      try {
        // التحقق إذا كان العمود موجوداً
        const checkColumn = await prisma.$queryRaw`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'AdminLesson' 
          AND column_name = ${column.name}
        `
        
        if (Array.isArray(checkColumn) && checkColumn.length === 0) {
          // العمود غير موجود، نقوم بإضافته
          console.log(`Adding column ${column.name}...`)
          
          if (column.type === 'TEXT') {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "AdminLesson" ADD COLUMN "${column.name}" TEXT DEFAULT ${column.default}
            `)
          } else if (column.type === 'INTEGER') {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "AdminLesson" ADD COLUMN "${column.name}" INTEGER DEFAULT ${column.default}
            `)
          } else if (column.type === 'BOOLEAN') {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "AdminLesson" ADD COLUMN "${column.name}" BOOLEAN DEFAULT ${column.default}
            `)
          }
          
          results.push(`✅ Added column: ${column.name}`)
        } else {
          results.push(`⏭️ Column already exists: ${column.name}`)
        }
      } catch (columnError: any) {
        console.error(`Error with column ${column.name}:`, columnError)
        results.push(`❌ Error with ${column.name}: ${columnError.message}`)
      }
    }
    
    // التحقق النهائي من هيكل الجدول
    const finalStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'AdminLesson'
      ORDER BY ordinal_position
    `
    
    console.log('Migration completed. Results:', results)
    
    return NextResponse.json({
      success: true,
      message: 'تم تحديث قاعدة البيانات بنجاح',
      results,
      tableStructure: finalStructure
    })
    
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ في تحديث قاعدة البيانات',
      details: error.message
    }, { status: 500 })
  }
}

// GET للتحقق من هيكل الجدول الحالي
export async function GET() {
  try {
    const tableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'AdminLesson'
      ORDER BY ordinal_position
    `
    
    return NextResponse.json({
      table: 'AdminLesson',
      structure: tableStructure
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'حدث خطأ في جلب هيكل الجدول',
      details: error.message
    }, { status: 500 })
  }
}
