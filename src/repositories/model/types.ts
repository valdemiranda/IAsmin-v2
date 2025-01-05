import { Prisma } from '@prisma/client'

/**
 * Types for model repository operations
 */
export type ModelCreateData = Prisma.ModelCreateInput

export type ModelDefaultData = {
  userId: string
  modelId: string
}

export type ModelFindData = {
  name: string
}
