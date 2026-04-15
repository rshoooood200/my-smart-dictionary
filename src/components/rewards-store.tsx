'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gift, Coins, Gem, ShoppingBag, Check, Lock, Sparkles,
  Star, Crown, Zap, Clock, Award, Loader2, ChevronRight,
  Package, Shirt, Palette, BadgeCheck, Rocket
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RewardsStoreProps {
  currentUserId: string
}

interface StoreItem {
  id: string
  name: string
  nameAr?: string
  description: string
  descriptionAr?: string
  type: string
  rarity: string
  price: number
  currency: string
  icon?: string
  isOwned: boolean
  isEquipped: boolean
  isAvailable: boolean
}

interface UserCurrency {
  coins: number
  gems: number
  totalEarned: number
  totalSpent: number
}

interface DailyReward {
  day: number
  coins: number
  gems: number
  xp: number
}

const rarityColors: Record<string, string> = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-amber-400 to-orange-500'
}

const rarityLabels: Record<string, string> = {
  common: 'عادي',
  rare: 'نادر',
  epic: 'أسطوري',
  legendary: 'خرافي'
}

const typeIcons: Record<string, any> = {
  avatar: Shirt,
  theme: Palette,
  badge: BadgeCheck,
  booster: Rocket,
  sticker: Sparkles
}

const typeLabels: Record<string, string> = {
  avatar: 'أفاتار',
  theme: 'ثيم',
  badge: 'شارة',
  booster: 'معزز',
  sticker: 'ملصق'
}

export function RewardsStore({ currentUserId }: RewardsStoreProps) {
  const [activeTab, setActiveTab] = useState('store')
  const [loading, setLoading] = useState(true)
  
  // Store data
  const [items, setItems] = useState<StoreItem[]>([])
  const [currency, setCurrency] = useState<UserCurrency>({ coins: 0, gems: 0, totalEarned: 0, totalSpent: 0 })
  const [userItems, setUserItems] = useState<any[]>([])
  
  // Daily rewards
  const [dailyRewardData, setDailyRewardData] = useState<{
    currentStreakDay: number
    canClaim: boolean
    nextReward: DailyReward
    claimedDays: number[]
    dailyRewards: DailyReward[]
  }>({
    currentStreakDay: 1,
    canClaim: false,
    nextReward: { day: 1, coins: 10, gems: 0, xp: 5 },
    claimedDays: [],
    dailyRewards: []
  })
  
  // Dialogs
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    loadData()
  }, [currentUserId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [storeRes, currencyRes, dailyRes] = await Promise.all([
        fetch(`/api/store?userId=${currentUserId}&type=all`),
        fetch(`/api/store?userId=${currentUserId}&type=currency`),
        fetch(`/api/rewards?userId=${currentUserId}&type=daily`)
      ])

      const storeData = await storeRes.json()
      const currencyData = await currencyRes.json()
      const dailyData = await dailyRes.json()

      setItems(storeData.items || [])
      setCurrency(currencyData.currency || { coins: 0, gems: 0 })
      setDailyRewardData(dailyData)
    } catch (error) {
      console.error('Error loading store data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Purchase item
  const handlePurchase = async (item: StoreItem) => {
    if (item.currency === 'coins' && currency.coins < item.price) {
      toast.error('لا تملك عملات كافية')
      return
    }
    if (item.currency === 'gems' && currency.gems < item.price) {
      toast.error('لا تملك جواهر كافية')
      return
    }

    setPurchasing(true)
    try {
      const response = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'purchase',
          data: { itemId: item.id }
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('تم شراء العنصر بنجاح!')
        setCurrency(prev => ({
          ...prev,
          [item.currency]: data.newBalance
        }))
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, isOwned: true } : i
        ))
        setShowItemDialog(false)
      } else {
        toast.error(data.error || 'حدث خطأ')
      }
    } catch (error) {
      toast.error('حدث خطأ')
    } finally {
      setPurchasing(false)
    }
  }

  // Equip item
  const handleEquip = async (item: StoreItem) => {
    try {
      const response = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'equip',
          data: { itemId: item.id }
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('تم تلبس العنصر')
        setItems(prev => prev.map(i => ({
          ...i,
          isEquipped: i.id === item.id ? true : (i.type === item.type ? false : i.isEquipped)
        })))
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  // Claim daily reward
  const handleClaimDaily = async () => {
    setClaiming(true)
    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          type: 'claim-daily'
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`حصلت على ${data.reward.coins} عملة و ${data.reward.gems} جوهرة و ${data.reward.xp} XP!`)
        setCurrency(prev => ({
          ...prev,
          coins: data.newBalance.coins,
          gems: data.newBalance.gems
        }))
        setDailyRewardData(prev => ({
          ...prev,
          canClaim: false,
          currentStreakDay: data.currentDay,
          claimedDays: [...prev.claimedDays, data.currentDay]
        }))
      } else {
        toast.error(data.error || 'حدث خطأ')
      }
    } catch (error) {
      toast.error('حدث خطأ')
    } finally {
      setClaiming(false)
    }
  }

  // Filter items by type
  const filteredItems = (type: string) => 
    items.filter(item => item.type === type)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Currency */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المتجر والمكافآت</h2>
          <p className="text-gray-500 text-sm">اجمع العملات واشتري العناصر</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Coins className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-700 dark:text-amber-300">{currency.coins}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30">
            <Gem className="w-5 h-5 text-violet-600" />
            <span className="font-bold text-violet-700 dark:text-violet-300">{currency.gems}</span>
          </div>
        </div>
      </div>

      {/* Daily Reward Card */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gift className="w-12 h-12" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold">المكافأة اليومية</h3>
                <p className="text-white/80">اليوم {dailyRewardData.currentStreakDay} من 7</p>
              </div>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {dailyRewardData.nextReward.coins}
                </span>
                {dailyRewardData.nextReward.gems > 0 && (
                  <span className="flex items-center gap-1">
                    <Gem className="w-4 h-4" />
                    {dailyRewardData.nextReward.gems}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  {dailyRewardData.nextReward.xp} XP
                </span>
              </div>
              <Button
                onClick={handleClaimDaily}
                disabled={!dailyRewardData.canClaim || claiming}
                className="bg-white text-emerald-600 hover:bg-white/90"
              >
                {claiming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : dailyRewardData.canClaim ? (
                  'استلم المكافأة'
                ) : (
                  'تم الاستلام'
                )}
              </Button>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="mt-4 flex gap-2">
            {dailyRewardData.dailyRewards.map((reward, index) => {
              const dayNum = index + 1
              const isClaimed = dailyRewardData.claimedDays.includes(dayNum)
              const isCurrent = dayNum === dailyRewardData.currentStreakDay
              return (
                <div
                  key={dayNum}
                  className={cn(
                    "flex-1 p-2 rounded-lg text-center text-sm",
                    isClaimed ? "bg-white/30" : isCurrent ? "bg-white/20 ring-2 ring-white" : "bg-white/10"
                  )}
                >
                  <div className="font-bold">{dayNum}</div>
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="w-3 h-3" />
                    {reward.coins}
                  </div>
                  {isClaimed && <Check className="w-4 h-4 mx-auto mt-1" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="store">
            <ShoppingBag className="w-4 h-4 ml-2" />
            المتجر
          </TabsTrigger>
          <TabsTrigger value="avatars">
            <Shirt className="w-4 h-4 ml-2" />
            الأفاتارات
          </TabsTrigger>
          <TabsTrigger value="themes">
            <Palette className="w-4 h-4 ml-2" />
            الثيمات
          </TabsTrigger>
          <TabsTrigger value="boosters">
            <Rocket className="w-4 h-4 ml-2" />
            المعززات
          </TabsTrigger>
        </TabsList>

        {/* Store Tab */}
        <TabsContent value="store" className="space-y-4">
          {/* Featured Items */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                عناصر مميزة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {items.filter(i => i.rarity === 'legendary' || i.rarity === 'epic').slice(0, 4).map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "relative p-4 rounded-xl cursor-pointer overflow-hidden",
                      "bg-gradient-to-br", rarityColors[item.rarity]
                    )}
                    onClick={() => { setSelectedItem(item); setShowItemDialog(true); }}
                  >
                    {item.isOwned && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white rounded-full p-1">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <div className="text-white text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center">
                        {item.type === 'avatar' ? (
                          <Crown className="w-8 h-8" />
                        ) : item.type === 'badge' ? (
                          <Award className="w-8 h-8" />
                        ) : (
                          <Package className="w-8 h-8" />
                        )}
                      </div>
                      <h4 className="font-medium">{item.nameAr || item.name}</h4>
                      <div className="flex items-center justify-center gap-1 mt-1 text-sm">
                        {item.currency === 'coins' ? (
                          <Coins className="w-4 h-4" />
                        ) : (
                          <Gem className="w-4 h-4" />
                        )}
                        {item.price}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Items */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">جميع العناصر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -4 }}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer border-2 transition-colors",
                      item.isOwned 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                        : "border-gray-200 dark:border-gray-700 hover:border-emerald-300"
                    )}
                    onClick={() => { setSelectedItem(item); setShowItemDialog(true); }}
                  >
                    <div className={cn(
                      "w-12 h-12 mx-auto rounded-lg mb-2 flex items-center justify-center",
                      "bg-gradient-to-br", rarityColors[item.rarity]
                    )}>
                      {item.isEquipped && (
                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      )}
                      {item.type === 'avatar' ? (
                        <Crown className="w-6 h-6 text-white" />
                      ) : item.type === 'badge' ? (
                        <Award className="w-6 h-6 text-white" />
                      ) : (
                        <Package className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-center truncate">{item.nameAr || item.name}</h4>
                    <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-500">
                      {item.currency === 'coins' ? (
                        <Coins className="w-3 h-3" />
                      ) : (
                        <Gem className="w-3 h-3" />
                      )}
                      {item.price}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avatars Tab */}
        <TabsContent value="avatars" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredItems('avatar').map((item) => (
              <Card key={item.id} className="border-0 shadow-md overflow-hidden">
                <div className={cn("h-24 bg-gradient-to-br", rarityColors[item.rarity])} />
                <CardContent className="p-4">
                  <h4 className="font-medium">{item.nameAr || item.name}</h4>
                  <p className="text-sm text-gray-500 mb-2">{item.descriptionAr || item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {item.currency === 'coins' ? (
                        <Coins className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Gem className="w-4 h-4 text-violet-600" />
                      )}
                      <span className="font-bold">{item.price}</span>
                    </div>
                    {item.isOwned ? (
                      item.isEquipped ? (
                        <Badge className="bg-emerald-600">مُلبس</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleEquip(item)}>تلبس</Button>
                      )
                    ) : (
                      <Button size="sm" onClick={() => handlePurchase(item)}>شراء</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems('theme').map((item) => (
              <Card key={item.id} className="border-0 shadow-md">
                <div className={cn("h-20", rarityColors[item.rarity])} />
                <CardContent className="p-4">
                  <h4 className="font-medium">{item.nameAr || item.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      {item.currency === 'coins' ? (
                        <Coins className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Gem className="w-4 h-4 text-violet-600" />
                      )}
                      <span>{item.price}</span>
                    </div>
                    {item.isOwned ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                        مملوك
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => handlePurchase(item)}>شراء</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Boosters Tab */}
        <TabsContent value="boosters" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems('booster').map((item) => (
              <Card key={item.id} className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center",
                    "bg-gradient-to-br", rarityColors[item.rarity]
                  )}>
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.nameAr || item.name}</h4>
                    <p className="text-sm text-gray-500">{item.descriptionAr || item.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        {item.currency === 'coins' ? (
                          <Coins className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Gem className="w-4 h-4 text-violet-600" />
                        )}
                        <span className="font-bold">{item.price}</span>
                      </div>
                      {item.isOwned ? (
                        <Badge className="bg-emerald-600">مملوك</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handlePurchase(item)}>شراء</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Item Detail Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedItem.nameAr || selectedItem.name}
                  <Badge className={cn("bg-gradient-to-r", rarityColors[selectedItem.rarity], "text-white")}>
                    {rarityLabels[selectedItem.rarity]}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedItem.descriptionAr || selectedItem.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className={cn(
                  "w-32 h-32 mx-auto rounded-2xl flex items-center justify-center",
                  "bg-gradient-to-br", rarityColors[selectedItem.rarity]
                )}>
                  {selectedItem.type === 'avatar' ? (
                    <Crown className="w-16 h-16 text-white" />
                  ) : selectedItem.type === 'badge' ? (
                    <Award className="w-16 h-16 text-white" />
                  ) : (
                    <Package className="w-16 h-16 text-white" />
                  )}
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge variant="outline">{typeLabels[selectedItem.type]}</Badge>
                    <Badge className={cn("bg-gradient-to-r", rarityColors[selectedItem.rarity], "text-white")}>
                      {rarityLabels[selectedItem.rarity]}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  {selectedItem.isOwned ? (
                    selectedItem.isEquipped ? (
                      <Badge className="bg-emerald-600 text-lg px-4 py-2">مُلبس حالياً</Badge>
                    ) : (
                      <Button className="w-full" onClick={() => { handleEquip(selectedItem); setShowItemDialog(false); }}>
                        تلبس
                      </Button>
                    )
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => handlePurchase(selectedItem)}
                      disabled={purchasing}
                    >
                      {purchasing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {selectedItem.currency === 'coins' ? (
                            <Coins className="w-4 h-4 ml-2" />
                          ) : (
                            <Gem className="w-4 h-4 ml-2" />
                          )}
                          شراء بـ {selectedItem.price}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
