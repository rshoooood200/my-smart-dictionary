'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Upload, FileJson, FileText, FileSpreadsheet,
  Image, File, Check, X, AlertCircle, Loader2,
  Trash2, Archive, RefreshCw, Copy, Share2,
  Database, Shield, Clock, HardDrive, FileDown,
  FileUp, Eye, ChevronDown, ChevronUp, Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useVocabStore, type Word } from '@/store/vocab-store'

// أنواع الملفات
type ImportType = 'json' | 'csv' | 'pdf' | 'image'
type ExportType = 'json' | 'csv' | 'pdf' | 'txt'

// حالة الاستيراد
interface ImportStatus {
  type: ImportType
  status: 'idle' | 'processing' | 'success' | 'error'
  progress: number
  message: string
  data?: any
  preview?: Word[]
}

// سجل النسخ الاحتياطي
interface BackupRecord {
  id: string
  date: Date
  wordCount: number
  categoryCount: number
  size: string
}

export function ImportExport() {
  const { words, categories, notes, stats, exportData, importData, loadWords, loadCategories, loadStats } = useVocabStore()
  
  // State
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    type: 'json',
    status: 'idle',
    progress: 0,
    message: ''
  })
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<Word[]>([])
  const [exportFormat, setExportFormat] = useState<ExportType>('json')
  const [isExporting, setIsExporting] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    includeWords: true,
    includeCategories: true,
    includeNotes: true,
    includeStats: true,
    selectedCategories: [] as string[]
  })
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [activeTab, setActiveTab] = useState('import')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // معالجة استيراد الملفات
  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    
    setImportStatus({
      type: extension as ImportType || 'json',
      status: 'processing',
      progress: 0,
      message: 'جاري قراءة الملف...'
    })

    try {
      if (extension === 'json') {
        await handleJsonImport(file)
      } else if (extension === 'csv') {
        await handleCsvImport(file)
      } else if (extension === 'pdf') {
        await handlePdfImport(file)
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(extension || '')) {
        await handleImageImport(file)
      } else {
        throw new Error('نوع الملف غير مدعوم')
      }
    } catch (error) {
      setImportStatus(prev => ({
        ...prev,
        status: 'error',
        message: error instanceof Error ? error.message : 'فشل في استيراد الملف'
      }))
      toast.error('فشل في استيراد الملف')
    }
    
    // Reset input
    event.target.value = ''
  }, [])

  // استيراد JSON
  const handleJsonImport = async (file: File) => {
    const reader = new FileReader()
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setImportStatus(prev => ({
          ...prev,
          progress: Math.round((e.loaded / e.total) * 50)
        }))
      }
    }
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        setImportStatus(prev => ({
          ...prev,
          progress: 75,
          message: 'جاري تحليل البيانات...'
        }))

        // معاينة البيانات
        if (data.words && Array.isArray(data.words)) {
          setPreviewData(data.words.slice(0, 10))
          setImportStatus(prev => ({
            ...prev,
            status: 'success',
            progress: 100,
            message: `تم العثور على ${data.words.length} كلمة`,
            data
          }))
          setShowPreview(true)
        } else {
          throw new Error('تنسيق الملف غير صالح')
        }
      } catch (error) {
        throw new Error('فشل في قراءة ملف JSON')
      }
    }
    
    reader.readAsText(file)
  }

  // استيراد CSV
  const handleCsvImport = async (file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          throw new Error('الملف فارغ أو لا يحتوي بيانات')
        }

        // تحليل CSV
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const wordIndex = headers.findIndex(h => h.includes('word') || h.includes('كلمة'))
        const translationIndex = headers.findIndex(h => h.includes('translation') || h.includes('ترجمة'))
        
        if (wordIndex === -1 || translationIndex === -1) {
          throw new Error('يجب أن يحتوي الملف على أعمدة للكلمات والترجمات')
        }

        const parsedWords: Word[] = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          if (values[wordIndex] && values[translationIndex]) {
            parsedWords.push({
              id: `import-${Date.now()}-${i}`,
              word: values[wordIndex],
              translation: values[translationIndex],
              pronunciation: values[headers.findIndex(h => h.includes('pronunciation'))] || '',
              definition: values[headers.findIndex(h => h.includes('definition'))] || '',
              partOfSpeech: values[headers.findIndex(h => h.includes('part') || h.includes('نوع'))] || 'noun',
              level: values[headers.findIndex(h => h.includes('level') || h.includes('مستوى'))] || 'beginner',
              isLearned: false,
              isFavorite: false,
              reviewCount: 0,
              correctCount: 0,
              categoryId: '',
              sentences: [],
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        }

        setPreviewData(parsedWords.slice(0, 10))
        setImportStatus(prev => ({
          ...prev,
          status: 'success',
          progress: 100,
          message: `تم العثور على ${parsedWords.length} كلمة`,
          data: { words: parsedWords }
        }))
        setShowPreview(true)
      } catch (error) {
        throw error
      }
    }
    
    reader.readAsText(file)
  }

  // استيراد PDF
  const handlePdfImport = async (file: File) => {
    setImportStatus(prev => ({
      ...prev,
      progress: 30,
      message: 'جاري إرسال الملف للتحليل...'
    }))

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/import-pdf', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('فشل في تحليل PDF')

      const data = await response.json()
      
      if (data.words && data.words.length > 0) {
        setPreviewData(data.words.slice(0, 10))
        setImportStatus(prev => ({
          ...prev,
          status: 'success',
          progress: 100,
          message: `تم العثور على ${data.words.length} كلمة`,
          data: { words: data.words }
        }))
        setShowPreview(true)
      } else {
        throw new Error('لم يتم العثور على كلمات في الملف')
      }
    } catch (error) {
      throw new Error('فشل في استيراد PDF')
    }
  }

  // استيراد من صورة
  const handleImageImport = async (file: File) => {
    setImportStatus(prev => ({
      ...prev,
      progress: 30,
      message: 'جاري تحليل الصورة...'
    }))

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/import-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('فشل في تحليل الصورة')

      const data = await response.json()
      
      if (data.words && data.words.length > 0) {
        setPreviewData(data.words.slice(0, 10))
        setImportStatus(prev => ({
          ...prev,
          status: 'success',
          progress: 100,
          message: `تم العثور على ${data.words.length} كلمة`,
          data: { words: data.words }
        }))
        setShowPreview(true)
      } else {
        throw new Error('لم يتم العثور على كلمات في الصورة')
      }
    } catch (error) {
      throw new Error('فشل في استيراد الصورة')
    }
  }

  // تأكيد الاستيراد
  const confirmImport = () => {
    if (importStatus.data) {
      importData(importStatus.data)
      loadWords()
      loadCategories()
      loadStats()
      
      toast.success(`تم استيراد ${importStatus.data.words?.length || 0} كلمة بنجاح`)
      setShowPreview(false)
      setImportStatus({
        type: 'json',
        status: 'idle',
        progress: 0,
        message: ''
      })
    }
  }

  // تصدير البيانات
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    
    try {
      const data = exportData()
      
      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        downloadBlob(blob, `vocabulary_${new Date().toISOString().split('T')[0]}.json`)
        toast.success('تم تصدير البيانات بنجاح')
      } else if (exportFormat === 'csv') {
        const csv = convertToCSV(data.words)
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
        downloadBlob(blob, `vocabulary_${new Date().toISOString().split('T')[0]}.csv`)
        toast.success('تم تصدير البيانات بنجاح')
      } else if (exportFormat === 'txt') {
        const txt = convertToTxt(data.words)
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
        downloadBlob(blob, `vocabulary_${new Date().toISOString().split('T')[0]}.txt`)
        toast.success('تم تصدير البيانات بنجاح')
      } else if (exportFormat === 'pdf') {
        // تصدير PDF عبر API
        const response = await fetch('/api/export-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            words: data.words,
            categories: data.categories,
            userName: 'المستخدم',
            exportType: 'all'
          })
        })
        
        if (!response.ok) throw new Error('فشل في تصدير PDF')
        
        const blob = await response.blob()
        downloadBlob(blob, `vocabulary_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success('تم تصدير PDF بنجاح')
      }
      
      setShowExportDialog(false)
    } catch (error) {
      toast.error('فشل في تصدير البيانات')
    } finally {
      setIsExporting(false)
    }
  }, [exportData, exportFormat])

  // تحويل إلى CSV
  const convertToCSV = (wordList: Word[]): string => {
    const headers = ['Word', 'Translation', 'Pronunciation', 'Part of Speech', 'Level', 'Definition']
    const rows = wordList.map(w => [
      w.word,
      w.translation,
      w.pronunciation || '',
      w.partOfSpeech || '',
      w.level || '',
      w.definition || ''
    ])
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
  }

  // تحويل إلى نص
  const convertToTxt = (wordList: Word[]): string => {
    return wordList.map(w => 
      `${w.word} - ${w.translation}\n` +
      (w.pronunciation ? `النطق: ${w.pronunciation}\n` : '') +
      (w.definition ? `التعريف: ${w.definition}\n` : '') +
      '---'
    ).join('\n\n')
  }

  // تحميل الملف
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // إنشاء نسخة احتياطية
  const createBackup = () => {
    const data = exportData()
    const backup: BackupRecord = {
      id: Date.now().toString(),
      date: new Date(),
      wordCount: data.words?.length || 0,
      categoryCount: data.categories?.length || 0,
      size: `${JSON.stringify(data).length / 1024} KB`
    }
    
    // حفظ في localStorage
    const backupsStr = localStorage.getItem('vocab-backups') || '[]'
    const backupsArr = JSON.parse(backupsStr)
    backupsArr.unshift(backup)
    localStorage.setItem('vocab-backups', JSON.stringify(backupsArr.slice(0, 10)))
    
    setBackups(backupsArr.slice(0, 10))
    toast.success('تم إنشاء نسخة احتياطية')
  }

  // حساب حجم البيانات
  const dataSize = new Blob([JSON.stringify({ words, categories, notes, stats })]).size
  const dataSizeKB = (dataSize / 1024).toFixed(2)

  return (
    <div className="space-y-4">
      {/* ملخص البيانات */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-2 bg-gradient-to-l from-emerald-500 to-teal-600" />
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <Database className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">إدارة البيانات</h3>
              <p className="text-sm text-gray-500">استيراد وتصدير ونسخ احتياطي</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-violet-600">{words.length}</div>
              <div className="text-xs text-gray-500">كلمة</div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-emerald-600">{categories.length}</div>
              <div className="text-xs text-gray-500">تصنيف</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-amber-600">{notes.length}</div>
              <div className="text-xs text-gray-500">ملاحظة</div>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-center">
              <div className="text-2xl font-bold text-rose-600">{dataSizeKB}</div>
              <div className="text-xs text-gray-500">كيلوبايت</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">
            <Upload className="w-4 h-4 mr-1" />
            استيراد
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="w-4 h-4 mr-1" />
            تصدير
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Shield className="w-4 h-4 mr-1" />
            نسخ احتياطي
          </TabsTrigger>
        </TabsList>

        {/* تبويب الاستيراد */}
        <TabsContent value="import" className="space-y-4 mt-4">
          {/* أنواع الملفات المدعومة */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: 'json', icon: FileJson, label: 'JSON', desc: 'ملف بيانات' },
              { type: 'csv', icon: FileSpreadsheet, label: 'CSV', desc: 'جدول بيانات' },
              { type: 'pdf', icon: FileText, label: 'PDF', desc: 'مستند' },
              { type: 'image', icon: Image, label: 'صورة', desc: 'PNG, JPG' }
            ].map((item) => (
              <Card
                key={item.type}
                className={cn(
                  "border-0 shadow-md cursor-pointer transition-all",
                  importStatus.type === item.type && "ring-2 ring-emerald-500"
                )}
                onClick={() => setImportStatus(prev => ({ ...prev, type: item.type as ImportType }))}
              >
                <CardContent className="p-3 text-center">
                  <item.icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* منطقة رفع الملف */}
          <Card className="border-0 shadow-md border-dashed border-2 border-gray-300 dark:border-gray-600">
            <CardContent className="p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  importStatus.type === 'json' ? '.json' :
                  importStatus.type === 'csv' ? '.csv' :
                  importStatus.type === 'pdf' ? '.pdf' :
                  '.png,.jpg,.jpeg,.webp'
                }
                onChange={handleFileImport}
                className="hidden"
              />
              
              {importStatus.status === 'processing' ? (
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-emerald-500" />
                  <p>{importStatus.message}</p>
                  <Progress value={importStatus.progress} className="h-2" />
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">اسحب الملف هنا أو</p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    اختر ملف {importStatus.type.toUpperCase()}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* حالة الاستيراد */}
          {importStatus.status !== 'idle' && importStatus.status !== 'processing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={cn(
                "border-0 shadow-md",
                importStatus.status === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {importStatus.status === 'success' ? (
                      <Check className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{importStatus.message}</p>
                    </div>
                    {importStatus.status === 'success' && (
                      <Button size="sm" onClick={() => setShowPreview(true)}>
                        معاينة
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* تبويب التصدير */}
        <TabsContent value="export" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">اختر تنسيق التصدير</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { type: 'json', icon: FileJson, label: 'JSON', desc: 'للاستيراد لاحقاً' },
                { type: 'csv', icon: FileSpreadsheet, label: 'CSV', desc: 'لـ Excel و Google Sheets' },
                { type: 'txt', icon: FileText, label: 'نص عادي', desc: 'للطباعة والمشاركة' },
                { type: 'pdf', icon: FileDown, label: 'PDF', desc: 'مستند للطباعة' }
              ].map((item) => (
                <div
                  key={item.type}
                  onClick={() => setExportFormat(item.type as ExportType)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                    exportFormat === item.type
                      ? "bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className={cn(
                    "w-6 h-6",
                    exportFormat === item.type ? "text-emerald-600" : "text-gray-500"
                  )} />
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  {exportFormat === item.type && (
                    <Check className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            size="lg"
            onClick={handleExport}
            disabled={isExporting || words.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                تصدير البيانات
              </>
            )}
          </Button>
        </TabsContent>

        {/* تبويب النسخ الاحتياطي */}
        <TabsContent value="backup" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <HardDrive className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">النسخ الاحتياطي المحلي</p>
                    <p className="text-xs text-gray-500">يتم حفظها في المتصفح</p>
                  </div>
                </div>
                <Button onClick={createBackup}>
                  <Archive className="w-4 h-4 mr-2" />
                  إنشاء نسخة
                </Button>
              </div>

              {backups.length > 0 ? (
                <div className="space-y-2">
                  {backups.map((backup, index) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(backup.date).toLocaleDateString('ar-SA')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {backup.wordCount} كلمة • {backup.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">لا توجد نسخ احتياطية</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* معلومات */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">نصيحة</h4>
                  <p className="text-white/90 text-sm">
                    قم بإنشاء نسخة احتياطية بشكل منتظم لحماية بياناتك. يمكنك تصدير البيانات كملف JSON لحفظها على جهازك.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نافذة المعاينة */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة البيانات المستوردة</DialogTitle>
            <DialogDescription>
              تم العثور على {previewData.length} كلمة (عرض أول 10 كلمات)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {previewData.map((word, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{word.word}</p>
                  <p className="text-sm text-gray-500">{word.translation}</p>
                </div>
                {word.level && (
                  <Badge>{word.level}</Badge>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              إلغاء
            </Button>
            <Button onClick={confirmImport}>
              <Check className="w-4 h-4 mr-2" />
              تأكيد الاستيراد
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
