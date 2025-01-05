import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { ModelRepository } from '../../repositories'
import { checkAuthorization, createModelButtons, handleModelSelectionResponse } from '../commandUtils'

// Handles the /model command which allows users to select or view their current model
export const modelCommand = {
  command: 'model',
  description: 'Escolher ou visualizar o modelo atual',
  handler: async (msg: TelegramMessage) => {
    const userId = msg.from.id.toString()

    if (!(await checkAuthorization(userId))) {
      return
    }

    const userModel = await ModelRepository.findUserDefault(userId)
    const modelButtons = await createModelButtons(userId)

    await TelegramService.sendMessage(
      userId,
      userModel
        ? `Modelo atual: ${userModel.name}\n\nEscolha um modelo para usar:`
        : 'Escolha um modelo para usar:',
      {
        inlineKeyboard: modelButtons
      }
    )
  }
}

// Sets up the callback handler for model selection buttons
export const setupModelCallbacks = () => {
  TelegramService.onCallbackQuery(async (query) => {
    if (!query.data?.startsWith('model:')) return

    const modelName = query.data.replace('model:', '')
    const userId = query.from.id.toString()

    if (!(await checkAuthorization(userId))) {
      await TelegramService.bot.answerCallbackQuery(query.id, {
        text: 'Você não está autorizado a usar este comando.',
        show_alert: true
      })
      return
    }

    const model = await ModelRepository.findByName({ name: modelName })
    if (!model) {
      await TelegramService.bot.answerCallbackQuery(query.id, {
        text: 'Modelo não encontrado.',
        show_alert: true
      })
      return
    }

    const currentDefault = await ModelRepository.findUserDefault(userId)
    const result = await handleModelSelectionResponse(userId, model.id, currentDefault?.id)

    await TelegramService.bot.answerCallbackQuery(query.id, {
      text: result.success ? `Seu modelo foi alterado para: ${model.name}` : result.message
    })

    if (result.success && query.message) {
      try {
        const modelButtons = await createModelButtons(userId)
        await TelegramService.bot.editMessageText(
          `Modelo atual: ${model.name}\n\nEscolha um modelo para usar:`,
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            reply_markup: {
              inline_keyboard: modelButtons
            }
          }
        )
      } catch (error) {
        // Ignora erros de mensagem não modificada
        if (error.response?.body?.description?.includes('message is not modified')) {
          return
        }
        throw error
      }
    }
  })
}
