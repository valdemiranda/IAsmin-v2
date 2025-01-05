import { Prisma } from '@prisma/client'

/**
 * Types for message repository operations
 */
export type MessageCreateData = {
  contextId: string
  content: string
  role: string
  imageUrl?: string
  replyToId?: string
  telegramMessageId?: number
}

/**
 * Common include object for message queries with context
 */
export const messageWithContextInclude = {
  context: {
    include: {
      model: true,
      messages: {
        orderBy: {
          createdAt: 'asc' as const
        }
      }
    }
  }
} satisfies Prisma.MessageInclude

/**
 * Common include object for message queries with replies
 */
export const messageWithRepliesInclude = {
  context: {
    include: {
      model: true,
      messages: {
        orderBy: {
          createdAt: 'asc' as const
        },
        include: {
          replies: {
            orderBy: {
              createdAt: 'asc' as const
            }
          }
        }
      }
    }
  }
} satisfies Prisma.MessageInclude
