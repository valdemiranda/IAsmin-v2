import { Prisma } from '@prisma/client'

/**
 * Types for context repository operations
 */
export type ContextCreateData = {
  userId: string
  modelId: string
  type?: string
}

/**
 * Common include object for context queries
 * Includes related model and messages ordered by creation date
 */
export const contextInclude = {
  model: true,
  messages: {
    orderBy: {
      createdAt: 'asc' as const
    }
  }
} satisfies Prisma.ContextInclude
