import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force recompile - v3 - Timestamp: 2024-03-14-03:15
// Admin models: AdminVideo, AdminLesson, AdminCategory, AdminUpdate, AdminNote

// Clear cached prisma to force new client with Admin models
if (globalForPrisma.prisma) {
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
