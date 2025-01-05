import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { ContextRepository, MessageRepository } from '../../repositories'
import { checkAuthorization, checkModelAvailability, handleCommandError } from '../commandUtils'

// Handles the /generate command which initiates an image generation context
export const generateCommand = {
  command: 'generate',
  description: 'Iniciar geração de imagem',
  handler: async (msg: TelegramMessage) => {
    try {
      const userId = msg.from.id.toString()

      if (!(await checkAuthorization(userId))) {
        return
      }

      const modelCheck = await checkModelAvailability(userId)
      if (!modelCheck.success) {
        return
      }

      // Creates a new context of type 'image'
      const context = await ContextRepository.create({
        userId,
        modelId: modelCheck.model.id,
        type: 'image'
      })

      // Sends the message and saves it to maintain context
      const msgResp =
        '🎨 Iniciando contexto de geração de imagem.\nDescreva a imagem que você gostaria que eu gerasse em resposta à esta mensagem.'
      const sentMessage = await TelegramService.sendMessage(userId, msgResp)

      // Saves the bot's message to the database
      await MessageRepository.create({
        contextId: context.id,
        content: msgResp,
        role: 'assistant',
        telegramMessageId: sentMessage.message_id
      })
    } catch (error) {
      await handleCommandError(
        error,
        msg.from.id.toString(),
        'generate',
        'Desculpe, ocorreu um erro ao iniciar o contexto de geração de imagem.'
      )
    }
  }
}
