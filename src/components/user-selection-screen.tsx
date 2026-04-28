'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Plus, Trash2, BookOpen, Sparkles, ChevronRight, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useVocabStore } from '@/store/vocab-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface UserSelectionScreenProps {
  onSelectUser: (userId: string) => void
}

export function UserSelectionScreen({ onSelectUser }: UserSelectionScreenProps) {
  const { users, createNewUser, removeUser } = useVocabStore()
  const [newUserName, setNewUserName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      toast.error('الرجاء إدخال اسم المستخدم')
      return
    }
    try {
      const user = await createNewUser(newUserName.trim())
      setNewUserName('')
      setIsDialogOpen(false)
      toast.success(`تم إنشاء حساب ${user.name} بنجاح`)
      onSelectUser(user.id)
    } catch (error) {
      toast.error('فشل في إنشاء الحساب')
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await removeUser(userId)
      setDeleteConfirmId(null)
      toast.success(`تم حذف حساب ${userName}`)
    } catch (error) {
      toast.error('فشل في حذف الحساب')
    }
  }

  const handleStartEdit = (userId: string, currentName: string) => {
    setEditingUserId(userId)
    setEditingName(currentName)
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditingName('')
  }

  const handleSaveEdit = async (userId: string) => {
    if (!editingName.trim()) {
      toast.error('الاسم لا يمكن أن يكون فارغاً')
      return
    }
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('تم تحديث الاسم بنجاح')
        setEditingUserId(null)
        setEditingName('')
        // Reload users
        window.location.reload()
      } else {
        toast.error(data.error || 'فشل في تحديث الاسم')
      }
    } catch (error) {
      toast.error('فشل في تحديث الاسم')
    }
  }

  const getInitials = (name: string) => name.charAt(0).toUpperCase()

  const avatarColors = [
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-orange-500 to-amber-600',
    'from-cyan-500 to-blue-600',
    'from-rose-500 to-pink-600',
  ]

  const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length]

  return (
    <div className="min-h-screen relative flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/user-selection-bg.png)' }}
      />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/60 backdrop-blur-[2px]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* App Icon and Title */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl sm:rounded-3xl blur-2xl opacity-30" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600">
                <img
                  src="/app-icon.png"
                  alt="قاموسي الذكي"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            قاموسي الذكي
          </motion.h1>
          
          <motion.p
            className="text-sm sm:text-base text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            اختر حسابك أو أنشئ حساباً جديداً
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Badge variant="secondary" className="mt-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              البيانات محفوظة في قاعدة بيانات
            </Badge>
          </motion.div>
        </div>

        {/* Users List */}
        <Card className="border border-white/30 dark:border-gray-700/50 shadow-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20">
            <CardTitle className="text-lg sm:text-xl text-center text-gray-800 dark:text-white">المستخدمون</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-2 px-3 sm:px-6 pb-5 pt-4">
            <AnimatePresence mode="popLayout">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  layout
                >
                  {deleteConfirmId === user.id ? (
                    <Card className="border-rose-300/50 dark:border-rose-700/50 bg-rose-50/80 dark:bg-rose-900/30 backdrop-blur-sm shadow-md">
                      <CardContent className="p-3 flex items-center justify-between">
                        <span className="text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium">
                          حذف {user.name}؟
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 text-xs bg-white/60 dark:bg-gray-800/60 border-white/40"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            إلغاء
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="h-8 text-xs"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                          >
                            حذف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : editingUserId === user.id ? (
                    <Card className="border-emerald-300/50 dark:border-emerald-700/50 bg-emerald-50/80 dark:bg-emerald-900/30 backdrop-blur-sm shadow-md">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-9 text-sm flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(user.id)
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                          />
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                            onClick={() => handleSaveEdit(user.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-9 w-9 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div
                      className="group flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/60 dark:bg-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-700/80 cursor-pointer transition-all duration-200 active:scale-[0.98] border border-white/40 dark:border-gray-600/30 shadow-sm hover:shadow-md"
                      onClick={() => onSelectUser(user.id)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="w-10 h-10 sm:w-11 sm:h-11">
                          <AvatarFallback className={cn(
                            "bg-gradient-to-br text-white font-bold text-base sm:text-lg",
                            getAvatarColor(index)
                          )}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">
                            {user.name}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                            عضو منذ {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Edit Button - Always visible */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 sm:h-9 sm:w-9 text-gray-400 hover:text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartEdit(user.id, user.name)
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {/* Delete Button - Always visible */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 sm:h-9 sm:w-9 text-gray-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(user.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-1" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add New User Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full h-12 sm:h-14 border-2 border-dashed border-emerald-400/50 dark:border-emerald-500/40 hover:border-emerald-500 dark:hover:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30 transition-all duration-200 text-sm sm:text-base text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  إنشاء حساب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>إنشاء حساب جديد</DialogTitle>
                  <DialogDescription>
                    أدخل اسمك لإنشاء حساب جديد. سيكون لديك بياناتك الخاصة.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="اسمك"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="h-12 text-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateUser()
                    }}
                    autoFocus
                  />
                </div>
                <DialogFooter className="flex gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleCreateUser} className="bg-emerald-600 hover:bg-emerald-700">
                    إنشاء الحساب
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-center"
        >
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-full backdrop-blur-sm border border-white/40 dark:border-gray-700/40">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              البيانات محفوظة بشكل آمن ودائم
            </span>
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              صُمّم بواسطة
              <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                رشيد الحربي
              </span>
              <span className="w-4 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
            </span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
