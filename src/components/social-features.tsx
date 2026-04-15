'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2, Users, Star, MessageCircle, ThumbsUp, ThumbsDown,
  Send, Bookmark, Flag, MoreHorizontal, Clock, CheckCircle2,
  XCircle, TrendingUp, Award, Crown, Flame, Heart, Sparkles,
  Copy, Link2, Twitter, Facebook, Mail, Download, Upload
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Word } from '@/store/vocab-store'

// أنواع التقييمات
interface WordReview {
  id: string
  wordId: string
  userId: string
  userName: string
  userAvatar: string
  rating: number // 1-5
  comment: string
  difficulty: 'easy' | 'medium' | 'hard'
  helpful: number
  notHelpful: number
  createdAt: Date
}

interface SharedWordList {
  id: string
  name: string
  description: string
  userId: string
  userName: string
  words: Word[]
  likes: number
  saves: number
  downloads: number
  tags: string[]
  isPublic: boolean
  createdAt: Date
}

// بيانات تجريبية للتقييمات
const SAMPLE_REVIEWS: WordReview[] = [
  {
    id: '1',
    wordId: 'sample-1',
    userId: 'user-1',
    userName: 'أحمد محمد',
    userAvatar: '👨',
    rating: 5,
    comment: 'كلمة مهمة جداً ومستخدمة بكثرة في المحادثات اليومية',
    difficulty: 'easy',
    helpful: 15,
    notHelpful: 2,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    wordId: 'sample-1',
    userId: 'user-2',
    userName: 'سارة أحمد',
    userAvatar: '👩',
    rating: 4,
    comment: 'سهلة الحفظ، أنصح بتكرارها في جمل مختلفة',
    difficulty: 'medium',
    helpful: 8,
    notHelpful: 1,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
]

// القوائم المشاركة
const SAMPLE_SHARED_LISTS: SharedWordList[] = [
  {
    id: 'list-1',
    name: 'كلمات السفر والسياحة',
    description: 'أهم الكلمات التي تحتاجها عند السفر',
    userId: 'user-1',
    userName: 'أحمد محمد',
    words: [],
    likes: 45,
    saves: 120,
    downloads: 89,
    tags: ['سفر', 'سياحة', 'مبتدئ'],
    isPublic: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'list-2',
    name: 'كلمات الأعمال',
    description: 'مفردات مهمة لاجتماعات العمل',
    userId: 'user-2',
    userName: 'سارة أحمد',
    words: [],
    likes: 32,
    saves: 78,
    downloads: 56,
    tags: ['أعمال', 'مهني', 'متوسط'],
    isPublic: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
]

interface SocialFeaturesProps {
  words: Word[]
  currentUserId: string
}

export function SocialFeatures({ words, currentUserId }: SocialFeaturesProps) {
  const [activeTab, setActiveTab] = useState('community')
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewDifficulty, setReviewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [sharedLists, setSharedLists] = useState<SharedWordList[]>(SAMPLE_SHARED_LISTS)
  const [reviews, setReviews] = useState<WordReview[]>(SAMPLE_REVIEWS)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [newListTags, setNewListTags] = useState('')
  const [selectedWordsForList, setSelectedWordsForList] = useState<string[]>([])
  
  // حساب الإحصائيات
  const stats = useMemo(() => ({
    totalShared: sharedLists.filter(l => l.userId === currentUserId).length,
    totalLikes: sharedLists.filter(l => l.userId === currentUserId).reduce((sum, l) => sum + l.likes, 0),
    totalDownloads: sharedLists.filter(l => l.userId === currentUserId).reduce((sum, l) => sum + l.downloads, 0),
    reviewsWritten: reviews.filter(r => r.userId === currentUserId).length,
  }), [sharedLists, reviews, currentUserId])
  
  // مشاركة قائمة
  const handleShareList = () => {
    if (!newListName.trim()) {
      toast.error('الرجاء إدخال اسم للقائمة')
      return
    }
    if (selectedWordsForList.length === 0) {
      toast.error('الرجاء اختيار كلمات للمشاركة')
      return
    }
    
    const newList: SharedWordList = {
      id: `list-${Date.now()}`,
      name: newListName,
      description: newListDescription,
      userId: currentUserId,
      userName: 'أنت',
      words: words.filter(w => selectedWordsForList.includes(w.id)),
      likes: 0,
      saves: 0,
      downloads: 0,
      tags: newListTags.split(',').map(t => t.trim()).filter(Boolean),
      isPublic: true,
      createdAt: new Date()
    }
    
    setSharedLists(prev => [newList, ...prev])
    setNewListName('')
    setNewListDescription('')
    setNewListTags('')
    setSelectedWordsForList([])
    setIsShareDialogOpen(false)
    toast.success('تم مشاركة القائمة بنجاح!')
  }
  
  // إضافة تقييم
  const handleAddReview = () => {
    if (!selectedWord) return
    if (!reviewComment.trim()) {
      toast.error('الرجاء كتابة تعليق')
      return
    }
    
    const newReview: WordReview = {
      id: `review-${Date.now()}`,
      wordId: selectedWord.id,
      userId: currentUserId,
      userName: 'أنت',
      userAvatar: '😊',
      rating: reviewRating,
      comment: reviewComment,
      difficulty: reviewDifficulty,
      helpful: 0,
      notHelpful: 0,
      createdAt: new Date()
    }
    
    setReviews(prev => [newReview, ...prev])
    setReviewComment('')
    setReviewRating(5)
    setIsReviewDialogOpen(false)
    toast.success('تم إضافة تقييمك!')
  }
  
  // تصويت مفيد/غير مفيد
  const handleVote = (reviewId: string, type: 'helpful' | 'notHelpful') => {
    setReviews(prev => prev.map(r => 
      r.id === reviewId 
        ? { ...r, [type]: r[type] + 1 }
        : r
    ))
    toast.success('شكراً على تقييمك!')
  }
  
  // نسخ رابط المشاركة
  const copyShareLink = (listId: string) => {
    const link = `${window.location.origin}?list=${listId}`
    navigator.clipboard.writeText(link)
    toast.success('تم نسخ الرابط!')
  }
  
  // تنسيق التاريخ
  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'اليوم'
    if (days === 1) return 'أمس'
    if (days < 7) return `منذ ${days} أيام`
    if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`
    return `منذ ${Math.floor(days / 30)} أشهر`
  }
  
  // عرض النجوم
  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={cn(
              "w-4 h-4",
              i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300",
              interactive && "cursor-pointer hover:scale-110 transition-transform"
            )}
            onClick={interactive ? () => setReviewRating(i) : undefined}
          />
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* الإحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Share2 className="w-6 h-6 mx-auto mb-2 text-violet-500" />
            <p className="text-2xl font-bold">{stats.totalShared}</p>
            <p className="text-xs text-gray-500">قوائم مشاركة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Heart className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <p className="text-2xl font-bold">{stats.totalLikes}</p>
            <p className="text-xs text-gray-500">إعجابات</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Download className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold">{stats.totalDownloads}</p>
            <p className="text-xs text-gray-500">تحميلات</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{stats.reviewsWritten}</p>
            <p className="text-xs text-gray-500">تقييمات</p>
          </CardContent>
        </Card>
      </div>
      
      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="community">
            <Users className="w-4 h-4 mr-1" />
            المجتمع
          </TabsTrigger>
          <TabsTrigger value="share">
            <Share2 className="w-4 h-4 mr-1" />
            مشاركة
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="w-4 h-4 mr-1" />
            التقييمات
          </TabsTrigger>
        </TabsList>
        
        {/* تبويب المجتمع */}
        <TabsContent value="community" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">القوائم المشاركة</h3>
            <Button onClick={() => setIsShareDialogOpen(true)}>
              <Share2 className="w-4 h-4 mr-2" />
              شارك قائمة
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sharedLists.map((list) => (
              <Card key={list.id} className="border-0 shadow-md hover:shadow-xl transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{list.name}</CardTitle>
                      <CardDescription className="text-sm">{list.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">{list.words.length || words.length} كلمة</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{list.userAvatar || '👤'}</span>
                    <span className="text-sm text-gray-500">{list.userName}</span>
                    <span className="text-xs text-gray-400">• {formatDate(list.createdAt)}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {list.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {list.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-4 h-4" />
                        {list.saves}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {list.downloads}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copyShareLink(list.id)}>
                        <Link2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* تبويب المشاركة */}
        <TabsContent value="share" className="space-y-4 mt-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-xl">
                  <Share2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">شارك معرفتك</h2>
                  <p className="text-white/80">أنشئ قائمة كلمات وشاركها مع المجتمع</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">إنشاء قائمة جديدة</CardTitle>
              <CardDescription>اختر الكلمات التي تريد مشاركتها</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">اسم القائمة</label>
                <Input
                  placeholder="مثال: كلمات السفر"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">الوصف</label>
                <Textarea
                  placeholder="وصف مختصر للقائمة..."
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  rows={2}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">الوسوم (مفصولة بفواصل)</label>
                <Input
                  placeholder="سفر, سياحة, مبتدئ"
                  value={newListTags}
                  onChange={(e) => setNewListTags(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">اختر الكلمات ({selectedWordsForList.length} محددة)</label>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {words.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">لا توجد كلمات</p>
                  ) : (
                    words.map((word) => (
                      <label
                        key={word.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                          selectedWordsForList.includes(word.id)
                            ? "bg-violet-100 dark:bg-violet-900/30"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedWordsForList.includes(word.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWordsForList(prev => [...prev, word.id])
                            } else {
                              setSelectedWordsForList(prev => prev.filter(id => id !== word.id))
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <span className="font-medium">{word.word}</span>
                          <span className="text-gray-500 mx-2">-</span>
                          <span className="text-gray-600">{word.translation}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
              
              <Button
                className="w-full"
                onClick={handleShareList}
                disabled={!newListName.trim() || selectedWordsForList.length === 0}
              >
                <Share2 className="w-4 h-4 mr-2" />
                مشاركة القائمة
              </Button>
            </CardContent>
          </Card>
          
          {/* خيارات المشاركة */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">خيارات المشاركة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => toast.success('تم نسخ الرابط!')}>
                  <Copy className="w-6 h-6 mb-2" />
                  <span className="text-sm">نسخ رابط</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col">
                  <Twitter className="w-6 h-6 mb-2 text-sky-500" />
                  <span className="text-sm">تويتر</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col">
                  <Facebook className="w-6 h-6 mb-2 text-blue-600" />
                  <span className="text-sm">فيسبوك</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col">
                  <Mail className="w-6 h-6 mb-2 text-rose-500" />
                  <span className="text-sm">بريد</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تبويب التقييمات */}
        <TabsContent value="reviews" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">تقييمات الكلمات</h3>
            <Button
              variant="outline"
              onClick={() => {
                if (words.length > 0) {
                  setSelectedWord(words[0])
                  setIsReviewDialogOpen(true)
                }
              }}
              disabled={words.length === 0}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              أضف تقييم
            </Button>
          </div>
          
          {reviews.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">لا توجد تقييمات بعد</p>
                <p className="text-sm text-gray-400">كن أول من يضيف تقييم!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id} className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg">
                        {review.userAvatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="font-medium">{review.userName}</span>
                            <span className="text-xs text-gray-400 mx-2">• {formatDate(review.createdAt)}</span>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{review.comment}</p>
                        
                        <div className="flex items-center gap-4">
                          <Badge variant={
                            review.difficulty === 'easy' ? 'default' :
                            review.difficulty === 'medium' ? 'secondary' : 'destructive'
                          }>
                            {review.difficulty === 'easy' ? 'سهل' :
                             review.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                          </Badge>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleVote(review.id, 'helpful')}
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              {review.helpful}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleVote(review.id, 'notHelpful')}
                            >
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              {review.notHelpful}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* حوار إضافة تقييم */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة تقييم</DialogTitle>
            <DialogDescription>
              شارك رأيك في الكلمة لمساعدة الآخرين
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {selectedWord && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                <p className="text-xl font-bold">{selectedWord.word}</p>
                <p className="text-gray-500">{selectedWord.translation}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">التقييم</label>
              <div className="flex justify-center">
                {renderStars(reviewRating, true)}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">مستوى الصعوبة</label>
              <div className="flex gap-2 justify-center">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <Button
                    key={diff}
                    variant={reviewDifficulty === diff ? 'default' : 'outline'}
                    onClick={() => setReviewDifficulty(diff)}
                  >
                    {diff === 'easy' ? 'سهل' : diff === 'medium' ? 'متوسط' : 'صعب'}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">تعليقك</label>
              <Textarea
                placeholder="اكتب تعليقك هنا..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsReviewDialogOpen(false)}>
                إلغاء
              </Button>
              <Button className="flex-1" onClick={handleAddReview}>
                <Send className="w-4 h-4 mr-2" />
                إرسال
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
