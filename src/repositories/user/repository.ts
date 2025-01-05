import { prisma } from '../../config'
import { handleRepositoryError } from '../utils/errorHandler'
import { UserCreateData, UserUpdateAuthorizationData } from './types'

/**
 * Repository for user-related database operations
 */
export const UserRepository = {
  /**
   * Finds or creates a user with the given ID and optional username
   */
  findOrCreate: async ({ id, username }: UserCreateData) => {
    try {
      return await prisma.user.upsert({
        where: { id },
        update: { username },
        create: { id, username }
      })
    } catch (error) {
      return handleRepositoryError('create/update user', error, 'Erro ao criar/atualizar usuário')
    }
  },

  /**
   * Updates the authorization status of a user
   */
  updateAuthorization: async ({ id, authorized }: UserUpdateAuthorizationData) => {
    try {
      return await prisma.user.update({
        where: { id },
        data: { authorized }
      })
    } catch (error) {
      return handleRepositoryError('update user authorization', error, 'Erro ao atualizar autorização')
    }
  },

  /**
   * Checks if a user is authorized
   */
  isAuthorized: async (id: string) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } })
      return user?.authorized ?? false
    } catch (error) {
      return handleRepositoryError('check user authorization', error, 'Erro ao verificar autorização')
    }
  }
}
