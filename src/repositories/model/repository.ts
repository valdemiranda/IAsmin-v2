import { prisma } from '../../config'
import { handleRepositoryError } from '../utils/errorHandler'
import { ModelCreateData, ModelDefaultData, ModelFindData } from './types'
import { handleDefaultModel } from './utils'

/**
 * Repository for model-related database operations
 */
export const ModelRepository = {
  /**
   * Finds the default model for a user
   */
  findUserDefault: async (userId: string) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { defaultModel: true }
      })
      return user?.defaultModel
    } catch (error) {
      return handleRepositoryError('find user default model', error, 'Erro ao buscar modelo padrão')
    }
  },

  /**
   * Finds a model by its name
   */
  findByName: async ({ name }: ModelFindData) => {
    try {
      return await prisma.model.findUnique({
        where: { name }
      })
    } catch (error) {
      return handleRepositoryError('find model by name', error, 'Erro ao buscar modelo')
    }
  },

  /**
   * Creates a new model
   */
  create: async (data: ModelCreateData) => {
    try {
      return await prisma.model.create({ data })
    } catch (error) {
      return handleRepositoryError('create model', error, 'Erro ao criar modelo')
    }
  },

  /**
   * Sets the default model for a user
   */
  setUserDefault: async ({ userId, modelId }: ModelDefaultData) => {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { defaultModelId: modelId },
        include: { defaultModel: true }
      })
    } catch (error) {
      return handleRepositoryError('set user default model', error, 'Erro ao definir modelo padrão')
    }
  },

  /**
   * Finds all models ordered by name
   */
  findAll: async () => {
    try {
      return await prisma.model.findMany({
        orderBy: { name: 'asc' }
      })
    } catch (error) {
      return handleRepositoryError('find all models', error, 'Erro ao buscar modelos')
    }
  },

  /**
   * Gets the user's default model or the first available model
   */
  getUserDefaultOrFirst: async (userId: string) => {
    try {
      const userDefault = await prisma.user.findUnique({
        where: { id: userId },
        include: { defaultModel: true }
      })

      if (userDefault?.defaultModel) {
        return userDefault.defaultModel
      }

      return handleDefaultModel(prisma, userId)
    } catch (error) {
      return handleRepositoryError('get user default model', error, 'Erro ao buscar modelo do usuário')
    }
  }
}
