import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get store items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'all'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'all' || type === 'items') {
      const itemType = searchParams.get('itemType')
      
      const where: any = { isActive: true }
      if (itemType) where.type = itemType

      const items = await db.storeItem.findMany({
        where,
        include: {
          userItems: {
            where: { userId }
          }
        },
        orderBy: [
          { rarity: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      // Check availability
      const now = new Date()
      const availableItems = items.map(item => ({
        ...item,
        isOwned: item.userItems.length > 0,
        isEquipped: item.userItems[0]?.isEquipped || false,
        isAvailable: (!item.availableFrom || now >= item.availableFrom) && 
                     (!item.availableUntil || now <= item.availableUntil)
      }))

      return NextResponse.json({ items: availableItems })
    }

    if (type === 'user-items') {
      const userItems = await db.userItem.findMany({
        where: { userId },
        include: {
          item: true
        },
        orderBy: { purchasedAt: 'desc' }
      })

      return NextResponse.json({ userItems })
    }

    if (type === 'currency') {
      let currency = await db.userCurrency.findUnique({
        where: { userId }
      })

      if (!currency) {
        currency = await db.userCurrency.create({
          data: { userId }
        })
      }

      return NextResponse.json({ currency })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Store API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Purchase or equip items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, data } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (type === 'purchase') {
      const { itemId } = data

      // Get item and user currency
      const [item, userCurrency] = await Promise.all([
        db.storeItem.findUnique({ where: { id: itemId } }),
        db.userCurrency.findUnique({ where: { userId } })
      ])

      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }

      if (!userCurrency) {
        return NextResponse.json({ error: 'Currency not found' }, { status: 400 })
      }

      // Check if already owned
      const existing = await db.userItem.findUnique({
        where: { userId_itemId: { userId, itemId } }
      })

      if (existing) {
        return NextResponse.json({ error: 'Already owned' }, { status: 400 })
      }

      // Check currency
      const price = item.price
      if (item.currency === 'coins' && userCurrency.coins < price) {
        return NextResponse.json({ error: 'Not enough coins' }, { status: 400 })
      }
      if (item.currency === 'gems' && userCurrency.gems < price) {
        return NextResponse.json({ error: 'Not enough gems' }, { status: 400 })
      }

      // Purchase item
      const [userItem, updatedCurrency, transaction] = await db.$transaction([
        db.userItem.create({
          data: { userId, itemId }
        }),
        db.userCurrency.update({
          where: { userId },
          data: {
            [item.currency]: { decrement: price },
            totalSpent: { increment: price }
          }
        }),
        db.currencyTransaction.create({
          data: {
            userId,
            type: 'spend',
            currency: item.currency,
            amount: price,
            reason: 'purchase',
            relatedId: itemId,
            balanceAfter: item.currency === 'coins' 
              ? userCurrency.coins - price 
              : userCurrency.gems - price
          }
        })
      ])

      return NextResponse.json({ 
        success: true, 
        userItem,
        newBalance: item.currency === 'coins' 
          ? updatedCurrency.coins 
          : updatedCurrency.gems
      })
    }

    if (type === 'equip') {
      const { itemId } = data

      // Unequip all items of same type first
      const item = await db.storeItem.findUnique({ where: { id: itemId } })
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }

      const userItems = await db.userItem.findMany({
        where: { userId },
        include: { item: true }
      })

      const sameTypeItems = userItems.filter(ui => ui.item.type === item.type)

      // Unequip all same type items
      await db.$transaction(
        sameTypeItems.map(ui => 
          db.userItem.update({
            where: { id: ui.id },
            data: { isEquipped: false }
          })
        )
      )

      // Equip selected item
      const userItem = await db.userItem.update({
        where: { userId_itemId: { userId, itemId } },
        data: { isEquipped: true }
      })

      return NextResponse.json({ success: true, userItem })
    }

    if (type === 'unequip') {
      const { itemId } = data

      const userItem = await db.userItem.update({
        where: { userId_itemId: { userId, itemId } },
        data: { isEquipped: false }
      })

      return NextResponse.json({ success: true, userItem })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('Store POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
