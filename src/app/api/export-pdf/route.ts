import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, writeFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  let tempJsonPath: string | null = null
  let tempPdfPath: string | null = null

  try {
    const body = await request.json()
    const { words, categories, userName, exportType, selectedCategory } = body

    if (!words || !Array.isArray(words)) {
      return NextResponse.json(
        { error: 'Words array is required' },
        { status: 400 }
      )
    }

    // Create temporary files
    const tempDir = os.tmpdir()
    const uniqueId = Date.now()
    tempJsonPath = path.join(tempDir, `vocab_input_${uniqueId}.json`)
    tempPdfPath = path.join(tempDir, `vocab_output_${uniqueId}.pdf`)

    // Prepare data
    const data = {
      words,
      categories: categories || [],
      userName: userName || 'المستخدم',
      selectedCategory: selectedCategory || null
    }

    // Write input JSON
    await writeFile(tempJsonPath, JSON.stringify(data, null, 2), 'utf-8')

    // Get the script path - using the new HTML-based script
    const scriptPath = path.join(process.cwd(), 'scripts', 'export_vocabulary_html.py')

    // Build command arguments
    const args = [
      `"${scriptPath}"`,
      `"${tempJsonPath}"`,
      `"${tempPdfPath}"`,
      exportType || 'all'
    ]

    if (selectedCategory && exportType === 'category') {
      args.push(selectedCategory)
    }

    // Execute Python script with WeasyPrint using venv Python
    const pythonPath = '/home/z/.venv/bin/python3'
    const { stdout, stderr } = await execAsync(`${pythonPath} ${args.join(' ')}`, {
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    })

    if (stderr && !stderr.includes('PDF generated')) {
      console.error('Python stderr:', stderr)
    }

    // Read the generated PDF
    const pdfBuffer = await readFile(tempPdfPath)

    // Clean up temp files
    try {
      if (tempJsonPath) await unlink(tempJsonPath)
      if (tempPdfPath) await unlink(tempPdfPath)
      // Also clean up temp HTML file
      const tempHtmlPath = tempJsonPath.replace('.json', '.html')
      try { await unlink(tempHtmlPath) } catch { /* ignore */ }
    } catch {
      // Ignore cleanup errors
    }

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="vocabulary_${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('PDF export error:', error)

    // Clean up temp files on error
    try {
      if (tempJsonPath) await unlink(tempJsonPath)
      if (tempPdfPath) await unlink(tempPdfPath)
      if (tempJsonPath) {
        const tempHtmlPath = tempJsonPath.replace('.json', '.html')
        try { await unlink(tempHtmlPath) } catch { /* ignore */ }
      }
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
