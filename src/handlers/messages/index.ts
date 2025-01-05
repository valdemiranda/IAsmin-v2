import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { UserRepository } from '../../repositories'
import { handleNewContext } from './contextHandler'
import { handleReplyMessage } from './replyHandler'

// Main message handler that orchestrates different message processing scenarios
export const MessageHandler = {
  handleMessage: async (msg: TelegramMessage): Promise<void> => {
    try {
      // Ignore command messages
      if (msg.text?.startsWith('/')) {
        return
      }

      // Ignore empty messages
      if (!msg.text && !msg.photo) {
        return
      }

      // Ensure user is registered
      const userId = msg.from.id.toString()
      const user = await UserRepository.findOrCreate({ id: userId, username: msg.from.username })

      if (!user.authorized) {
        await TelegramService.sendMessage(
          msg.from.id,
          'Você ainda não está autorizado a interagir comigo. Use /start para ver seu ID e aguarde a aprovação de um administrador.'
        )
        console.log(
          `Tentativa de interação de usuário não autorizado - ID: ${userId}, Username: ${
            msg.from.username || 'não informado'
          }`
        )
        return
      }

      // Handle reply messages or create new context
      if (msg.reply_to_message) {
        await handleReplyMessage(msg)
      } else {
        await handleNewContext(msg)
      }
    } catch (error) {
      console.error('Error handling message:', error)
      await TelegramService.sendMessage(msg.from.id, 'Desculpe, ocorreu um erro ao processar sua mensagem.')
    }
  }
}
