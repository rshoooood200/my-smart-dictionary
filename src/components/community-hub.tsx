'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Users, Target, Library, Crown, Medal, Search,
  Plus, Send, Check, X, Clock, Zap, Star, MessageSquare,
  Download, ThumbsUp, ChevronRight, Flame, Award, Loader2,
  UserPlus, UserMinus, Play, Eye, ArrowRight, Heart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CommunityHubProps {
  currentUserId: string
  words: any[]
}

interface Friend {
  id: string
  name: string
  level: number
  xp: number
  currentStreak: number
  avatar?: string
  friendshipId: string
  friendsSince: Date
}

interface FriendRequest {
  id: string
  requester: {
    id: string
    name: string
    level: number
    xp: number
    avatar?: string
  }
  createdAt: Date
}

interface Challenge {
  id: string
  title: string
  titleAr?: string
  type: string
  difficulty: string
  status: string
  xpReward: number
  wordCount: number
  timeLimit?: number
  creator: { id: string; name: string; level: number }
  opponent?: { id: string; name: string; level: number }
  winner?: { id: string; name: string }
  creatorScore: number
  opponentScore: number
  createdAt: Date
}

interface LeaderboardEntry {
  id: string
  userId: string
  score: number
  rank: number
  wordsLearned: number
  streakDays: number
  user: { id: string; name: string; level: number; avatar?: string }
}

interface CommunityList {
  id: string
  name: string
  nameAr?: string
  description?: string
  category?: string
  wordCount: number
  downloads: number
  likes: number
  isOfficial: boolean
  difficulty: string
  avgRating: number
  creator: { id: string; name: string; level: number }
  _count?: { words: number; comments: number; ratings: number }
}

const avatarColors = ['from-emerald-500 to-teal-600', 'from-violet-500 to-purple-600', 'from-orange-500 to-amber-600', 'from-cyan-500 to-blue-600', 'from-rose-500 to-pink-600']

const difficultyColors: Record<string, string> = {
  easy: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  medium: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  hard: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30',
}

const difficultyLabels: Record<string, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}

const challengeTypeLabels: Record<string, string> = {
  vocabulary: 'مفردات',
  speed: 'سرعة',
  accuracy: 'دقة',
  streak: 'سلسلة',
}

const periodLabels: Record<string, string> = {
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
  'all-time': 'كل الوقت',
}

export function CommunityHub({ currentUserId, words }: CommunityHubProps) {
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [loading, setLoading] = useState(true)
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [topThree, setTopThree] = useState<LeaderboardEntry[]>([])
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('weekly')
  const [userRank, setUserRank] = useState<any>(null)
  
  // Friends state
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  // Challenges state
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [openChallenges, setOpenChallenges] = useState<Challenge[]>([])
  
  // Community Lists state
  const [communityLists, setCommunityLists] = useState<CommunityList[]>([])
  const [selectedList, setSelectedList] = useState<any>(null)
  
  // Dialogs
  const [showCreateChallenge, setShowCreateChallenge] = useState(false)
  const [showCreateList, setShowCreateList] = useState(false)
  const [showChallengeDetail, setShowChallengeDetail] = useState(false)
  const [showListDetail, setShowListDetail] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  
  // Form states
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    type: 'vocabulary',
    difficulty: 'medium',
    xpReward: 50,
    wordCount: 10,
    timeLimit: 60,
    opponentId: ''
  })
  
  const [listForm, setListForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    category: '',
    isPublic: true,
    difficulty: 'intermediate',
    words: [] as any[]
  })

  // Load initial data
  useEffect(() => {
    loadData()
  }, [currentUserId])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadLeaderboard(),
        loadFriends(),
        loadChallenges(),
        loadCommunityLists()
      ])
    } catch (error) {
      console.error('Error loading community data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async (period = leaderboardPeriod) => {
    try {
      const response = await fetch(`/api/leaderboard?userId=${currentUserId}&period=${period}`)
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
      setTopThree(data.topThree || [])
      setUserRank(data.userRank)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  const loadFriends = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`/api/friends?userId=${currentUserId}&type=friends`),
        fetch(`/api/friends?userId=${currentUserId}&type=requests`)
      ])
      const friendsData = await friendsRes.json()
      const requestsData = await requestsRes.json()
      setFriends(friendsData.friends || [])
      setFriendRequests(requestsData.requests || [])
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }

  const loadChallenges = async () => {
    try {
      const [myRes, openRes] = await Promise.all([
        fetch(`/api/challenges?userId=${currentUserId}&type=my-challenges`),
        fetch(`/api/challenges?userId=${currentUserId}&type=open-challenges`)
      ])
      const myData = await myRes.json()
      const openData = await openRes.json()
      setChallenges(myData.challenges || [])
      setOpenChallenges(openData.challenges || [])
    } catch (error) {
      console.error('Error loading challenges:', error)
    }
  }

  const loadCommunityLists = async () => {
    try {
      const response = await fetch(`/api/community?userId=${currentUserId}&type=community-lists`)
      const data = await response.json()
      setCommunityLists(data.lists || [])
    } catch (error) {
      console.error('Error loading community lists:', error)
    }
  }

  // Search users
  const handleSearchUsers = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    try {
      const response = await fetch(`/api/friends?userId=${currentUserId}&type=search&q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }, [currentUserId])

  // Send friend request
  const handleSendFriendRequest = async (friendId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'send-request',
          data: { friendId }
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('تم إرسال طلب الصداقة')
        handleSearchUsers(searchQuery)
      } else {
        toast.error(data.error || 'حدث خطأ')
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  // Accept friend request
  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'accept-request',
          data: { friendshipId }
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('تم قبول طلب الصداقة')
        loadFriends()
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  // Reject friend request
  const handleRejectRequest = async (friendshipId: string) => {
    try {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'reject-request',
          data: { friendshipId }
        })
      })
      toast.success('تم رفض الطلب')
      loadFriends()
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  // Remove friend
  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'remove-friend',
          data: { friendshipId }
        })
      })
      toast.success('تم إزالة الصديق')
      loadFriends()
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  // Create challenge
  const handleCreateChallenge = async () => {
    if (!challengeForm.title.trim()) {
      toast.error('الرجاء إدخال عنوان التحدي')
      return
    }

    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'create-challenge',
          data: challengeForm
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('تم إنشاء التحدي')
        setShowCreateChallenge(false)
        setChallengeForm({
          title: '',
          type: 'vocabulary',
          difficulty: 'medium',
          xpReward: 50,
          wordCount: 10,
          timeLimit: 60,
          opponentId: ''
        })
        loadChallenges()
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  // Join challenge
  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'join-challenge',
          data: { challengeId }
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('انضممت للتحدي!')
        loadChallenges()
      } else {
        toast.error(data.error || 'حدث خطأ')
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  // Download community list
  const handleDownloadList = async (listId: string) => {
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'download-list',
          data: { listId }
        })
      })
      const data = await response.json()
      if (data.success && data.list) {
        // Add words to user's vocabulary
        // This would typically call the words API
        toast.success(`تم تحميل ${data.list.words?.length || 0} كلمة`)
        loadCommunityLists()
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  // View list detail
  const handleViewListDetail = async (listId: string) => {
    try {
      const response = await fetch(`/api/community?userId=${currentUserId}&type=list-detail&listId=${listId}`)
      const data = await response.json()
      if (data.list) {
        setSelectedList(data.list)
        setShowListDetail(true)
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  const getUserColor = (index: number) => avatarColors[index % avatarColors.length]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المجتمع</h2>
          <p className="text-gray-500 text-sm">تنافس مع الآخرين وتعلم معاً</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateChallenge(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            تحدي جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 opacity-80" />
              <div>
                <div className="text-2xl font-bold">{friends.length}</div>
                <div className="text-sm opacity-80">أصدقاء</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 opacity-80" />
              <div>
                <div className="text-2xl font-bold">{userRank?.rank || '-'}</div>
                <div className="text-sm opacity-80">ترتيبك</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 opacity-80" />
              <div>
                <div className="text-2xl font-bold">{challenges.filter(c => c.status === 'active').length}</div>
                <div className="text-sm opacity-80">تحديات نشطة</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Library className="w-8 h-8 opacity-80" />
              <div>
                <div className="text-2xl font-bold">{communityLists.length}</div>
                <div className="text-sm opacity-80">قوائم عامة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="leaderboard">
            <Trophy className="w-4 h-4 ml-2" />
            المتصدرين
          </TabsTrigger>
          <TabsTrigger value="friends">
            <Users className="w-4 h-4 ml-2" />
            الأصدقاء
            {friendRequests.length > 0 && (
              <Badge className="mr-2 h-5 w-5 p-0 flex items-center justify-center bg-rose-500">{friendRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <Target className="w-4 h-4 ml-2" />
            التحديات
          </TabsTrigger>
          <TabsTrigger value="lists">
            <Library className="w-4 h-4 ml-2" />
            القوائم
          </TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          {/* Period Selector */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(periodLabels).map(([key, label]) => (
              <Button
                key={key}
                variant={leaderboardPeriod === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setLeaderboardPeriod(key); loadLeaderboard(key); }}
                className={leaderboardPeriod === key ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Top 3 Podium */}
          {topThree.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {/* 2nd Place */}
              <div className="order-1 pt-8">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center"
                >
                  <div className="relative inline-block">
                    <Avatar className="w-16 h-16 border-4 border-gray-300">
                      <AvatarFallback className={cn("bg-gradient-to-br text-white font-bold text-lg", getUserColor(1))}>
                        {topThree[1]?.user?.name?.charAt(0) || '؟'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-sm">
                      2
                    </div>
                  </div>
                  <h4 className="mt-3 font-medium text-gray-900 dark:text-white truncate">{topThree[1]?.user?.name}</h4>
                  <p className="text-sm text-gray-500">{topThree[1]?.score} XP</p>
                  <Badge variant="outline" className="mt-1">Lv.{topThree[1]?.user?.level}</Badge>
                </motion.div>
              </div>

              {/* 1st Place */}
              <div className="order-2">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center"
                >
                  <Crown className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                  <div className="relative inline-block">
                    <Avatar className="w-20 h-20 border-4 border-amber-400">
                      <AvatarFallback className={cn("bg-gradient-to-br text-white font-bold text-xl", getUserColor(0))}>
                        {topThree[0]?.user?.name?.charAt(0) || '؟'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold">
                      1
                    </div>
                  </div>
                  <h4 className="mt-3 font-bold text-gray-900 dark:text-white truncate">{topThree[0]?.user?.name}</h4>
                  <p className="text-sm text-gray-500">{topThree[0]?.score} XP</p>
                  <Badge className="mt-1 bg-amber-100 text-amber-700">Lv.{topThree[0]?.user?.level}</Badge>
                </motion.div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 pt-12">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center"
                >
                  <div className="relative inline-block">
                    <Avatar className="w-14 h-14 border-4 border-amber-600">
                      <AvatarFallback className={cn("bg-gradient-to-br text-white font-bold", getUserColor(2))}>
                        {topThree[2]?.user?.name?.charAt(0) || '؟'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-xs">
                      3
                    </div>
                  </div>
                  <h4 className="mt-3 font-medium text-gray-900 dark:text-white truncate">{topThree[2]?.user?.name}</h4>
                  <p className="text-sm text-gray-500">{topThree[2]?.score} XP</p>
                  <Badge variant="outline" className="mt-1">Lv.{topThree[2]?.user?.level}</Badge>
                </motion.div>
              </div>
            </div>
          )}

          {/* User's Rank */}
          {userRank && (
            <Card className="border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {userRank.rank}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">ترتيبك الحالي</h4>
                  <p className="text-sm text-gray-500">{userRank.score} XP • {userRank.wordsLearned} كلمة</p>
                </div>
                <Badge className="bg-emerald-600">
                  <Flame className="w-3 h-3 mr-1" />
                  {userRank.streakDays} يوم
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard List */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">الترتيب الكامل</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {leaderboard.slice(3).map((entry, index) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-center gap-4 p-4 transition-colors",
                        entry.userId === currentUserId && "bg-emerald-50 dark:bg-emerald-900/10"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        index === 0 ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {entry.rank}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={cn("bg-gradient-to-br text-white font-bold", getUserColor(index))}>
                          {entry.user?.name?.charAt(0) || '؟'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{entry.user?.name}</h4>
                        <p className="text-sm text-gray-500">Level {entry.user?.level}</p>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-emerald-600">{entry.score} XP</div>
                        <div className="text-xs text-gray-500">{entry.wordsLearned} كلمة</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends" className="space-y-4">
          {/* Search Users */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="ابحث عن مستخدمين..."
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="pr-10"
                />
              </div>
              {searching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={cn("bg-gradient-to-br text-white font-bold", getUserColor(index))}>
                          {user.name?.charAt(0) || '؟'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-gray-500">Level {user.level}</p>
                      </div>
                      {user.friendshipStatus === 'accepted' ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                          <Check className="w-3 h-3 mr-1" /> صديق
                        </Badge>
                      ) : user.friendshipStatus === 'pending' ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          قيد الانتظار
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleSendFriendRequest(user.id)}>
                          <UserPlus className="w-4 h-4 ml-1" />
                          إضافة
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  طلبات الصداقة
                  <Badge className="bg-rose-500">{friendRequests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {friendRequests.map((request, index) => (
                  <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className={cn("bg-gradient-to-br text-white font-bold", getUserColor(index))}>
                        {request.requester?.name?.charAt(0) || '؟'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{request.requester?.name}</h4>
                      <p className="text-sm text-gray-500">Level {request.requester?.level}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAcceptRequest(request.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Friends List */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">أصدقاؤك ({friends.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا يوجد أصدقاء بعد</p>
                  <p className="text-sm">ابحث عن مستخدمين وأضفهم كأصدقاء</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {friends.map((friend, index) => (
                    <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className={cn("bg-gradient-to-br text-white font-bold", getUserColor(index))}>
                          {friend.name?.charAt(0) || '؟'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">{friend.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline" className="text-xs">Lv.{friend.level}</Badge>
                          {friend.currentStreak > 0 && (
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-500" />
                              {friend.currentStreak}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setChallengeForm(prev => ({ ...prev, opponentId: friend.id }))
                          setShowCreateChallenge(true)
                        }}>
                          <Target className="w-4 h-4 ml-1" />
                          تحدّ
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveFriend(friend.friendshipId)}>
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          {/* Active Challenges */}
          {challenges.filter(c => c.status === 'active').length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  تحديات نشطة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {challenges.filter(c => c.status === 'active').map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20"
                    onClick={() => { setSelectedChallenge(challenge); setShowChallengeDetail(true); }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{challenge.titleAr || challenge.title}</h4>
                      <Badge className={difficultyColors[challenge.difficulty]}>
                        {difficultyLabels[challenge.difficulty]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        {challenge.xpReward} XP
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {challenge.timeLimit ? `${challenge.timeLimit}s` : 'بدون حد'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{challenge.creator?.name}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="text-sm">{challenge.opponent?.name || 'بانتظار...'}</span>
                      </div>
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                        <Play className="w-4 h-4 ml-1" />
                        العب
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Open Challenges */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">تحديات مفتوحة</CardTitle>
              <CardDescription>انضم للتحديات واكسب XP</CardDescription>
            </CardHeader>
            <CardContent>
              {openChallenges.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد تحديات مفتوحة</p>
                  <Button className="mt-3" onClick={() => setShowCreateChallenge(true)}>
                    أنشئ تحدياً
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {openChallenges.map((challenge) => (
                    <div key={challenge.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{challenge.titleAr || challenge.title}</h4>
                        <Badge className={difficultyColors[challenge.difficulty]}>
                          {difficultyLabels[challenge.difficulty]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          {challenge.xpReward} XP
                        </span>
                        <span>{challenge.wordCount} كلمة</span>
                        <span>{challengeTypeLabels[challenge.type]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs">
                              {challenge.creator?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{challenge.creator?.name}</span>
                        </div>
                        <Button size="sm" onClick={() => handleJoinChallenge(challenge.id)}>
                          انضم للتحدي
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Challenges */}
          {challenges.filter(c => c.status === 'completed').length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">تحديات مكتملة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {challenges.filter(c => c.status === 'completed').slice(0, 5).map((challenge) => (
                  <div key={challenge.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      challenge.winner?.id === currentUserId ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500"
                    )}>
                      {challenge.winner?.id === currentUserId ? <Trophy className="w-5 h-5" /> : <Medal className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{challenge.titleAr || challenge.title}</h4>
                      <p className="text-sm text-gray-500">
                        الفائز: {challenge.winner?.name || 'تعادل'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {challenge.creatorScore} - {challenge.opponentScore}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Community Lists Tab */}
        <TabsContent value="lists" className="space-y-4">
          <div className="grid gap-4">
            {communityLists.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-12 text-center text-gray-500">
                  <Library className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد قوائم عامة</p>
                </CardContent>
              </Card>
            ) : (
              communityLists.map((list, index) => (
                <Card
                  key={list.id}
                  className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewListDetail(list.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold",
                        list.isOfficial ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
                      )}>
                        {list.isOfficial ? <Award className="w-6 h-6" /> : <Library className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {list.nameAr || list.name}
                          </h4>
                          {list.isOfficial && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs">رسمية</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{list.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400" />
                            {list.avgRating?.toFixed(1) || '-'}
                          </span>
                          <span>{list._count?.words || list.wordCount} كلمة</span>
                          <span className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            {list.downloads}
                          </span>
                          <Badge className={cn("text-xs", difficultyColors[list.difficulty])}>
                            {difficultyLabels[list.difficulty]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={cn("bg-gradient-to-br text-white text-xs", getUserColor(index))}>
                            {list.creator?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleDownloadList(list.id); }}>
                          <Download className="w-4 h-4 ml-1" />
                          تحميل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Challenge Dialog */}
      <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إنشاء تحدي جديد</DialogTitle>
            <DialogDescription>تحدّى أصدقاءك أو أنشئ تحدياً مفتوحاً</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">عنوان التحدي</label>
              <Input
                placeholder="مثال: تحدي الكلمات الصعبة"
                value={challengeForm.title}
                onChange={(e) => setChallengeForm(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">النوع</label>
                <Select value={challengeForm.type} onValueChange={(v) => setChallengeForm(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vocabulary">مفردات</SelectItem>
                    <SelectItem value="speed">سرعة</SelectItem>
                    <SelectItem value="accuracy">دقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">الصعوبة</label>
                <Select value={challengeForm.difficulty} onValueChange={(v) => setChallengeForm(prev => ({ ...prev, difficulty: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">سهل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">صعب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">مكافأة XP</label>
                <Input
                  type="number"
                  value={challengeForm.xpReward}
                  onChange={(e) => setChallengeForm(prev => ({ ...prev, xpReward: parseInt(e.target.value) || 50 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الوقت (ثانية)</label>
                <Input
                  type="number"
                  value={challengeForm.timeLimit}
                  onChange={(e) => setChallengeForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 60 }))}
                  className="mt-1"
                />
              </div>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateChallenge}>
              <Target className="w-4 h-4 ml-2" />
              إنشاء التحدي
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* List Detail Dialog */}
      <Dialog open={showListDetail} onOpenChange={setShowListDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedList && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedList.nameAr || selectedList.name}
                  {selectedList.isOfficial && <Badge className="bg-amber-100 text-amber-700">رسمية</Badge>}
                </DialogTitle>
                <DialogDescription>{selectedList.description}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400" />
                    {selectedList.avgRating?.toFixed(1) || '-'}
                  </span>
                  <span>{selectedList.words?.length || 0} كلمة</span>
                  <span>{selectedList.downloads} تحميل</span>
                </div>

                {/* Words List */}
                <div className="border rounded-lg divide-y">
                  {selectedList.words?.slice(0, 20).map((word: any, index: number) => (
                    <div key={word.id || index} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{word.word}</span>
                        <span className="mx-2 text-gray-400">-</span>
                        <span className="text-gray-600">{word.translation}</span>
                      </div>
                      {word.pronunciation && (
                        <span className="text-sm text-gray-500">/{word.pronunciation}/</span>
                      )}
                    </div>
                  ))}
                  {selectedList.words?.length > 20 && (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      و {selectedList.words.length - 20} كلمة أخرى...
                    </div>
                  )}
                </div>

                {/* Download Button */}
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => { handleDownloadList(selectedList.id); setShowListDetail(false); }}
                >
                  <Download className="w-4 h-4 ml-2" />
                  تحميل القائمة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
