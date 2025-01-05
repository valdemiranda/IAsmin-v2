import { prisma } from '../../config'
import { handleRepositoryError } from '../utils/errorHandler'
import { ContextCreateData, contextInclude } from './types'

/**
 * Repository for context-related database operations
 */
export const ContextRepository = {
  /**
   * Creates a new context with the specified user, model and optional type
   */
  create: async ({ userId, modelId, type = 'chat' }: ContextCreateData) => {
    try {
      return await prisma.context.create({
        data: { userId, modelId, type },
        include: contextInclude
      })
    } catch (error) {
      return handleRepositoryError('create context', error, 'Erro ao criar contexto')
    }
  },

  /**
   * Finds a context by its ID
   */
  findById: async (id: string) => {
    try {
      return await prisma.context.findUnique({
        where: { id },
        include: contextInclude
      })
    } catch (error) {
      return handleRepositoryError('find context', error, 'Erro ao buscar contexto')
    }
  }
}
