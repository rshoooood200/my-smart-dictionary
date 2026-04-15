'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  School, Users, BookOpen, ClipboardList, BarChart3, Settings,
  Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Copy,
  ChevronRight, ChevronLeft, Check, X, Clock, Calendar,
  GraduationCap, UserPlus, FileText, Award, TrendingUp,
  Bell, Send, Download, Upload, Filter, Grid, List,
  AlertCircle, CheckCircle, XCircle, Loader2, RefreshCw,
  Building, Mail, Phone, Globe, MapPin, UserCheck, UserX
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface Teacher {
  id: string
  userId: string
  schoolId?: string
  employeeId?: string
  department?: string
  subjects: string
  bio?: string
  bioAr?: string
  totalClasses: number
  totalStudents: number
  totalAssignments: number
  averageRating: number
  isActive: boolean
  joinedAt: Date
  createdAt: Date
  school?: School
}

interface School {
  id: string
  name: string
  nameAr?: string
  logo?: string
  type: string
  subscription: string
  totalTeachers: number
  totalStudents: number
  totalClasses: number
}

interface Class {
  id: string
  teacherId: string
  name: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  coverImage?: string
  grade?: string
  subject?: string
  academicYear?: string
  semester?: string
  room?: string
  joinCode: string
  maxStudents: number
  totalStudents: number
  totalAssignments: number
  totalLessons: number
  isPublic: boolean
  requireApproval: boolean
  isActive: boolean
  createdAt: Date
}

interface Assignment {
  id: string
  classId: string
  teacherId: string
  title: string
  titleAr?: string
  description?: string
  type: string
  totalPoints: number
  passingScore: number
  dueAt?: Date
  status: string
  totalSubmissions: number
  averageScore: number
  createdAt: Date
  class?: Class
}

interface Student {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  progress: number
  averageScore: number
  totalWordsLearned: number
  lastActive?: Date
  status: string
}

// Props
interface TeacherPortalProps {
  currentUserId: string
}

// Main Component
export function TeacherPortal({ currentUserId }: TeacherPortalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<Student[]>([])

  // Load teacher data
  useEffect(() => {
    loadTeacherData()
  }, [currentUserId])

  const loadTeacherData = async () => {
    setIsLoading(true)
    try {
      // Check if teacher profile exists
      const teacherRes = await fetch(`/api/teachers?userId=${currentUserId}`)
      const teacherData = await teacherRes.json()

      if (teacherData && !teacherData.error) {
        setTeacher(teacherData)

        // Load classes
        const classesRes = await fetch(`/api/classes?teacherId=${teacherData.id}`)
        const classesData = await classesRes.json()
        setClasses(Array.isArray(classesData) ? classesData : [])

        // Load assignments
        const assignmentsRes = await fetch(`/api/assignments?teacherId=${teacherData.id}`)
        const assignmentsData = await assignmentsRes.json()
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
      }
    } catch (error) {
      console.error('Error loading teacher data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Create teacher profile
  const createTeacherProfile = async () => {
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      })
      const data = await res.json()
      setTeacher(data)
      toast.success('تم إنشاء ملف المعلم بنجاح!')
    } catch (error) {
      toast.error('فشل في إنشاء ملف المعلم')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Show teacher profile creation if not exists
  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">مرحباً بك في بوابة المعلمين</h2>
        <p className="text-gray-500 mb-6 max-w-md">
          أنشئ ملفك كمعلم لتتمكن من إدارة الفصول والطلاب وتوزيع الواجبات ومتابعة تقدم الطلاب
        </p>
        <Button onClick={createTeacherProfile} className="bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="w-4 h-4 ml-2" />
          إنشاء ملف المعلم
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">بوابة المعلم</h1>
            <p className="text-gray-500 text-sm">إدارة الفصول والطلاب والواجبات</p>
          </div>
        </div>
        {teacher.school && (
          <Badge variant="outline" className="gap-2 px-3 py-1">
            <Building className="w-4 h-4" />
            {teacher.school.nameAr || teacher.school.name}
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">الفصول</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{teacher.totalClasses}</p>
              </div>
              <BookOpen className="w-8 h-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">الطلاب</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{teacher.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">الواجبات</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{teacher.totalAssignments}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-200 dark:border-rose-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-600 dark:text-rose-400">التقييم</p>
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{(teacher.averageRating ?? 0).toFixed(1)}</p>
              </div>
              <Award className="w-8 h-8 text-rose-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2 py-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">نظرة عامة</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2 py-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">الفصول</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2 py-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">الطلاب</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2 py-2">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">الواجبات</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 py-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">التحليلات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <TeacherOverview teacher={teacher} classes={classes} assignments={assignments} />
        </TabsContent>
        <TabsContent value="classes" className="mt-4">
          <ClassManagement teacherId={teacher.id} classes={classes} setClasses={setClasses} />
        </TabsContent>
        <TabsContent value="students" className="mt-4">
          <StudentManagement teacherId={teacher.id} classes={classes} />
        </TabsContent>
        <TabsContent value="assignments" className="mt-4">
          <AssignmentManagement teacherId={teacher.id} classes={classes} assignments={assignments} setAssignments={setAssignments} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <TeacherAnalytics teacherId={teacher.id} classes={classes} assignments={assignments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================
// Overview Section
// ============================================
function TeacherOverview({ teacher, classes, assignments }: { teacher: Teacher; classes: Class[]; assignments: Assignment[] }) {
  const safeClasses = Array.isArray(classes) ? classes : []
  const safeAssignments = Array.isArray(assignments) ? assignments : []
  
  const recentClasses = safeClasses.slice(0, 3)
  const recentAssignments = safeAssignments.filter(a => a.status === 'published').slice(0, 3)
  const pendingGrading = safeAssignments.filter(a => a.status === 'published').reduce((sum, a) => sum + (a.totalSubmissions || 0), 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>الفصول الأخيرة</span>
            <Badge variant="secondary">{safeClasses.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentClasses.length > 0 ? recentClasses.map(cls => (
            <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium">{cls.nameAr || cls.name}</p>
                  <p className="text-sm text-gray-500">{cls.totalStudents} طالب</p>
                </div>
              </div>
              <Badge variant="outline">{cls.subject || 'عام'}</Badge>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد فصول بعد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>الواجبات النشطة</span>
            <Badge variant="secondary">{safeAssignments.filter(a => a.status === 'published').length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentAssignments.length > 0 ? recentAssignments.map(assignment => (
            <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">{assignment.titleAr || assignment.title}</p>
                  <p className="text-sm text-gray-500">
                    {assignment.totalSubmissions} تسليم
                    {assignment.dueAt && ` • ${new Date(assignment.dueAt).toLocaleDateString('ar-SA')}`}
                  </p>
                </div>
              </div>
              <Badge className={
                assignment.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                assignment.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                'bg-amber-100 text-amber-700'
              }>
                {assignment.status === 'published' ? 'نشط' : assignment.status === 'closed' ? 'مغلق' : 'مسودة'}
              </Badge>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد واجبات نشطة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Plus className="w-6 h-6 text-emerald-600" />
              <span>إضافة فصل</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <ClipboardList className="w-6 h-6 text-amber-600" />
              <span>إنشاء واجب</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <UserPlus className="w-6 h-6 text-blue-600" />
              <span>دعوة طلاب</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <BarChart3 className="w-6 h-6 text-rose-600" />
              <span>عرض التقارير</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// Class Management Section
// ============================================
function ClassManagement({ teacherId, classes, setClasses }: { teacherId: string; classes: Class[]; setClasses: (classes: Class[]) => void }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    grade: '',
    subject: '',
    maxStudents: 50,
    isPublic: false,
    requireApproval: true
  })

  const filteredClasses = useMemo(() => {
    if (!searchQuery) return classes
    return classes.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameAr?.includes(searchQuery) ||
      c.subject?.includes(searchQuery)
    )
  }, [classes, searchQuery])

  const handleCreateClass = async () => {
    if (!formData.name) {
      toast.error('اسم الفصل مطلوب')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          ...formData
        })
      })
      const newClass = await res.json()
      setClasses([newClass, ...classes])
      setIsCreateOpen(false)
      resetForm()
      toast.success('تم إنشاء الفصل بنجاح!')
    } catch (error) {
      toast.error('فشل في إنشاء الفصل')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      grade: '',
      subject: '',
      maxStudents: 50,
      isPublic: false,
      requireApproval: true
    })
  }

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('تم نسخ كود الانضمام!')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث في الفصول..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 w-full sm:w-64"
            />
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 ml-2" />
          إنشاء فصل جديد
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredClasses.map((cls, index) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedClass(cls)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                        {(cls.nameAr || cls.name).charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cls.nameAr || cls.name}</CardTitle>
                        <CardDescription>{cls.subject || 'عام'} • {cls.grade || 'جميع المستويات'}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {cls.totalStudents}/{cls.maxStudents} طالب
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-4 h-4" />
                      {cls.totalAssignments} واجب
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs font-mono">
                        {cls.joinCode}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyJoinCode(cls.joinCode)
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    {cls.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700">نشط</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">مؤرشف</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">لا توجد فصول</p>
          <p className="text-sm">ابدأ بإنشاء فصل جديد لإدارة الطلاب والواجبات</p>
        </div>
      )}

      {/* Create Class Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء فصل جديد</DialogTitle>
            <DialogDescription>أنشئ فصلاً جديداً لإدارة الطلاب وتوزيع الواجبات</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الفصل (عربي)</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="مثال: الصف العاشر أ"
                />
              </div>
              <div className="space-y-2">
                <Label>اسم الفصل (إنجليزي)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Class 10A"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الصف الدراسي</Label>
                <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس',
                      'الصف السابع', 'الصف الثامن', 'الصف التاسع', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر'
                    ].map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المادة</Label>
                <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {['اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'اللغة العربية', 'الدراسات الاجتماعية', 'التربية الإسلامية'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                placeholder="وصف الفصل..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>الحد الأقصى للطلاب</Label>
              <Input
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 50 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>يتطلب موافقة للانضمام</Label>
              <Switch
                checked={formData.requireApproval}
                onCheckedChange={(checked) => setFormData({ ...formData, requireApproval: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreateClass} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Details Dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="max-w-2xl">
          {selectedClass && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedClass.nameAr || selectedClass.name}</DialogTitle>
                <DialogDescription>
                  {selectedClass.subject} • {selectedClass.grade}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{selectedClass.totalStudents}</p>
                  <p className="text-sm text-gray-500">طالب</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <ClipboardList className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold">{selectedClass.totalAssignments}</p>
                  <p className="text-sm text-gray-500">واجب</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-2xl font-bold">{selectedClass.totalLessons}</p>
                  <p className="text-sm text-gray-500">درس</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                  <p className="text-sm font-bold">{new Date(selectedClass.createdAt).toLocaleDateString('ar-SA')}</p>
                  <p className="text-sm text-gray-500">تاريخ الإنشاء</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-emerald-700 dark:text-emerald-300">كود الانضمام</p>
                    <p className="text-2xl font-mono font-bold text-emerald-800 dark:text-emerald-200">{selectedClass.joinCode}</p>
                  </div>
                  <Button variant="outline" onClick={() => copyJoinCode(selectedClass.joinCode)}>
                    <Copy className="w-4 h-4 ml-2" />
                    نسخ
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <ClipboardList className="w-4 h-4 ml-2" />
                  إضافة واجب
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// Student Management Section
// ============================================
function StudentManagement({ teacherId, classes }: { teacherId: string; classes: Class[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<string>('all')

  // Mock students data
  const students = useMemo(() => {
    const mockStudents: Student[] = []
    classes.forEach(cls => {
      for (let i = 0; i < Math.min(cls.totalStudents, 5); i++) {
        mockStudents.push({
          id: `${cls.id}-student-${i}`,
          userId: `user-${i}`,
          name: `طالب ${i + 1}`,
          email: `student${i + 1}@example.com`,
          progress: Math.floor(Math.random() * 100),
          averageScore: Math.floor(Math.random() * 40) + 60,
          totalWordsLearned: Math.floor(Math.random() * 200) + 50,
          lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          status: Math.random() > 0.1 ? 'active' : 'inactive'
        })
      }
    })
    return mockStudents
  }, [classes])

  const filteredStudents = useMemo(() => {
    let result = students
    if (searchQuery) {
      result = result.filter(s => 
        s.name.includes(searchQuery) || s.email.includes(searchQuery)
      )
    }
    return result
  }, [students, searchQuery])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث في الطلاب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 w-full sm:w-64"
            />
          </div>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="جميع الفصول" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفصول</SelectItem>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nameAr || c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="w-4 h-4 ml-2" />
          دعوة طالب
        </Button>
      </div>

      {/* Students List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="text-right p-4 font-medium">الطالب</th>
                  <th className="text-right p-4 font-medium">التقدم</th>
                  <th className="text-right p-4 font-medium">متوسط الدرجات</th>
                  <th className="text-right p-4 font-medium">الكلمات</th>
                  <th className="text-right p-4 font-medium">آخر نشاط</th>
                  <th className="text-right p-4 font-medium">الحالة</th>
                  <th className="text-right p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-24">
                        <Progress value={student.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">{student.progress}%</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "font-bold",
                        student.averageScore >= 80 ? "text-emerald-600" :
                        student.averageScore >= 60 ? "text-amber-600" : "text-rose-600"
                      )}>
                        {student.averageScore}%
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{student.totalWordsLearned}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {student.lastActive ? new Date(student.lastActive).toLocaleDateString('ar-SA') : '-'}
                    </td>
                    <td className="p-4">
                      <Badge className={student.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                        {student.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">لا يوجد طلاب</p>
          <p className="text-sm">قم بدعوة الطلاب للانضمام إلى فصولك</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// Assignment Management Section
// ============================================
function AssignmentManagement({ teacherId, classes, assignments, setAssignments }: { teacherId: string; classes: Class[]; assignments: Assignment[]; setAssignments: (assignments: Assignment[]) => void }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    classId: '',
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    type: 'homework',
    totalPoints: 100,
    passingScore: 60,
    dueAt: '',
    allowRetake: true,
    maxAttempts: 3
  })

  const filteredAssignments = useMemo(() => {
    let result = assignments
    if (searchQuery) {
      result = result.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.titleAr?.includes(searchQuery)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter)
    }
    return result
  }, [assignments, searchQuery, statusFilter])

  const handleCreateAssignment = async () => {
    if (!formData.classId || !formData.title) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          ...formData,
          dueAt: formData.dueAt || null
        })
      })
      const newAssignment = await res.json()
      setAssignments([newAssignment, ...assignments])
      setIsCreateOpen(false)
      resetForm()
      toast.success('تم إنشاء الواجب بنجاح!')
    } catch (error) {
      toast.error('فشل في إنشاء الواجب')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      classId: '',
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      type: 'homework',
      totalPoints: 100,
      passingScore: 60,
      dueAt: '',
      allowRetake: true,
      maxAttempts: 3
    })
  }

  const publishAssignment = async (assignment: Assignment) => {
    try {
      await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignment.id, status: 'published' })
      })
      setAssignments(assignments.map(a => 
        a.id === assignment.id ? { ...a, status: 'published' } : a
      ))
      toast.success('تم نشر الواجب!')
    } catch (error) {
      toast.error('فشل في نشر الواجب')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث في الواجبات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 w-full sm:w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="published">منشور</SelectItem>
              <SelectItem value="closed">مغلق</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 ml-2" />
          إنشاء واجب
        </Button>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredAssignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        assignment.type === 'homework' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        assignment.type === 'quiz' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        assignment.type === 'exam' ? 'bg-rose-100 dark:bg-rose-900/30' :
                        'bg-emerald-100 dark:bg-emerald-900/30'
                      )}>
                        <ClipboardList className={cn(
                          "w-6 h-6",
                          assignment.type === 'homework' ? 'text-amber-600' :
                          assignment.type === 'quiz' ? 'text-blue-600' :
                          assignment.type === 'exam' ? 'text-rose-600' :
                          'text-emerald-600'
                        )} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{assignment.titleAr || assignment.title}</h3>
                        <p className="text-sm text-gray-500">
                          {assignment.class?.nameAr || assignment.class?.name || 'غير محدد'}
                          {' • '}
                          {assignment.totalPoints} نقطة
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <Badge className={
                          assignment.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                          assignment.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                          'bg-amber-100 text-amber-700'
                        }>
                          {assignment.status === 'published' ? 'منشور' : 
                           assignment.status === 'closed' ? 'مغلق' : 'مسودة'}
                        </Badge>
                        {assignment.dueAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 inline ml-1" />
                            {new Date(assignment.dueAt).toLocaleDateString('ar-SA')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment.status === 'draft' && (
                          <Button size="sm" variant="outline" onClick={() => publishAssignment(assignment)}>
                            <Send className="w-4 h-4 ml-1" />
                            نشر
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">لا توجد واجبات</p>
          <p className="text-sm">ابدأ بإنشاء واجب جديد لطلابك</p>
        </div>
      )}

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء واجب جديد</DialogTitle>
            <DialogDescription>أنشئ واجباً جديداً لتوزيعه على الطلاب</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الفصل *</Label>
              <Select value={formData.classId} onValueChange={(v) => setFormData({ ...formData, classId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفصل" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nameAr || c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder="عنوان الواجب"
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Assignment Title"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                placeholder="وصف الواجب..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">واجب منزلي</SelectItem>
                    <SelectItem value="quiz">اختبار قصير</SelectItem>
                    <SelectItem value="project">مشروع</SelectItem>
                    <SelectItem value="exam">اختبار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>تاريخ التسليم</Label>
                <Input
                  type="date"
                  value={formData.dueAt}
                  onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الدرجة الكلية</Label>
                <Input
                  type="number"
                  value={formData.totalPoints}
                  onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) || 100 })}
                />
              </div>
              <div className="space-y-2">
                <Label>درجة النجاح</Label>
                <Input
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 60 })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>السماح بإعادة المحاولة</Label>
              <Switch
                checked={formData.allowRetake}
                onCheckedChange={(checked) => setFormData({ ...formData, allowRetake: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreateAssignment} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// Analytics Section
// ============================================
function TeacherAnalytics({ teacherId, classes, assignments }: { teacherId: string; classes: Class[]; assignments: Assignment[] }) {
  const totalStudents = classes.reduce((sum, c) => sum + c.totalStudents, 0)
  const totalSubmissions = assignments.reduce((sum, a) => sum + (a.totalSubmissions || 0), 0)
  const avgScore = assignments.length > 0 
    ? assignments.reduce((sum, a) => sum + (a.averageScore || 0), 0) / assignments.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold">{classes.length}</p>
            <p className="text-sm text-gray-500">فصل نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-sm text-gray-500">طالب</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{totalSubmissions}</p>
            <p className="text-sm text-gray-500">تسليم</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="text-2xl font-bold">{avgScore.toFixed(0)}%</p>
            <p className="text-sm text-gray-500">متوسط الدرجات</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>أداء الطلاب</CardTitle>
          <CardDescription>متوسط درجات الطلاب خلال الفترة الماضية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-2 opacity-30" />
              <p>الرسم البياني للأداء</p>
              <p className="text-sm">سيتم عرض البيانات عند توفر تسجيلات</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Performance */}
      <Card>
        <CardHeader>
          <CardTitle>أداء الفصول</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classes.length > 0 ? classes.map(cls => (
              <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">{cls.nameAr || cls.name}</p>
                    <p className="text-sm text-gray-500">{cls.totalStudents} طالب</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-emerald-600">{Math.floor(Math.random() * 20) + 70}%</p>
                  <p className="text-xs text-gray-500">معدل الإنجاز</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد فصول بعد</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TeacherPortal
