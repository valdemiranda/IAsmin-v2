import { prisma } from '../../config'
import { handleRepositoryError } from '../utils/errorHandler'
import { MessageCreateData, messageWithContextInclude, messageWithRepliesInclude } from './types'
import { validateMessageData, orderMessagesByConversation } from './utils'

/**
 * Repository for message-related database operations
 */
export const MessageRepository = {
  /**
   * Creates a new message
   */
  create: async (data: MessageCreateData) => {
    try {
      validateMessageData(data)
      return await prisma.message.create({
        data,
        include: messageWithContextInclude
      })
    } catch (error) {
      return handleRepositoryError('create message', error, 'Erro ao criar mensagem')
    }
  },

  /**
   * Finds all messages for a given context
   */
  findByContextId: async (contextId: string) => {
    try {
      return await prisma.message.findMany({
        where: { contextId },
        orderBy: { createdAt: 'asc' }
      })
    } catch (error) {
      return handleRepositoryError('find messages by context', error, 'Erro ao buscar mensagens do contexto')
    }
  },

  /**
   * Finds a message by its Telegram message ID
   */
  findByTelegramMessageId: async (telegramMessageId: number) => {
    try {
      return await prisma.message.findFirst({
        where: { telegramMessageId },
        include: messageWithContextInclude
      })
    } catch (error) {
      return handleRepositoryError(
        'find message by telegram id',
        error,
        'Erro ao buscar mensagem do Telegram'
      )
    }
  },

  /**
   * Gets the message history for a given message ID
   * Returns the messages in conversation order and the model name
   */
  getMessageHistory: async (messageId: string): Promise<{ messages: any[]; modelName: string }> => {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: messageWithRepliesInclude
      })

      if (!message || !message.context) {
        throw new Error('Message or context not found')
      }

      return {
        messages: orderMessagesByConversation(message.context.messages),
        modelName: message.context.model.name
      }
    } catch (error) {
      return handleRepositoryError('get message history', error, 'Erro ao buscar histórico de mensagens')
    }
  }
}
