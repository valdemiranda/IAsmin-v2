import { TelegramMessage } from '../types'
import { TelegramService } from '../services/telegram'
import { ModelRepository, UserRepository } from '../repositories'

export const startCommand = {
  command: 'start',
  description: 'Iniciar o bot',
  handler: async (msg: TelegramMessage) => {
    try {
      // Garante que o ID do usuário seja uma string
      const userId = msg.from.id.toString()

      // Cria ou atualiza o usuário no banco
      const user = await UserRepository.findOrCreate(userId, msg.from.username)

      const welcomeMessage = user.authorized
        ? `Bem-vindo de volta! Você está autorizado e pode começar a conversar comigo.\nSeu ID: ${userId}`
        : `Olá! Seu cadastro foi realizado com o ID: ${userId}\nVocê precisa de autorização para interagir comigo. Por favor, aguarde a aprovação de um administrador.`

      await TelegramService.sendMessage(userId, welcomeMessage)

      if (!user.authorized) {
        console.log(
          `Novo usuário registrado - ID: ${userId}, Username: ${msg.from.username || 'não informado'}`
        )
      }
    } catch (error) {
      console.error('Erro ao processar comando /start:', error)
      await TelegramService.sendMessage(
        msg.from.id,
        'Desculpe, ocorreu um erro ao processar seu cadastro. Tente novamente mais tarde.'
      )
    }
  }
}

export const modelCommand = {
  command: 'model',
  description: 'Escolher ou visualizar o modelo atual',
  handler: async (msg: TelegramMessage) => {
    const isAuthorized = await UserRepository.isAuthorized(msg.from.id.toString())
    if (!isAuthorized) {
      await TelegramService.sendMessage(msg.from.id, 'Você ainda não está autorizado a usar este comando.')
      return
    }

    const userId = msg.from.id.toString()
    const userModel = await ModelRepository.findUserDefault(userId)
    const models = await ModelRepository.findAll()

    const modelButtons = models.map((model) => [
      {
        text: model.name + (model.id === userModel?.id ? ' (atual)' : ''),
        callback_data: `model:${model.name}`
      }
    ])

    await TelegramService.sendMessage(
      msg.from.id,
      userModel
        ? `Modelo atual: ${userModel.name}\n\nEscolha um modelo para usar:`
        : 'Escolha um modelo para usar:',
      {
        inlineKeyboard: modelButtons
      }
    )
  }
}

// Handler para as callbacks dos botões de modelo
TelegramService.onCallbackQuery(async (query) => {
  if (!query.data?.startsWith('model:')) return

  const modelName = query.data.replace('model:', '')
  const userId = query.from.id.toString()

  const isAuthorized = await UserRepository.isAuthorized(userId)
  if (!isAuthorized) {
    await TelegramService.bot.answerCallbackQuery(query.id, {
      text: 'Você não está autorizado a usar este comando.',
      show_alert: true
    })
    return
  }

  const model = await ModelRepository.findByName(modelName)
  if (!model) {
    await TelegramService.bot.answerCallbackQuery(query.id, {
      text: 'Modelo não encontrado.',
      show_alert: true
    })
    return
  }

  // Verifica se o modelo já é o padrão atual do usuário
  const currentDefault = await ModelRepository.findUserDefault(userId)
  if (currentDefault?.id === model.id) {
    await TelegramService.bot.answerCallbackQuery(query.id, {
      text: 'Este já é o seu modelo atual.'
    })
    return
  }

  await ModelRepository.setUserDefault(userId, model.id)

  await TelegramService.bot.answerCallbackQuery(query.id, {
    text: `Seu modelo foi alterado para: ${model.name}`
  })

  try {
    // Atualiza a mensagem com os botões para mostrar o novo modelo padrão do usuário
    const models = await ModelRepository.findAll()
    const modelButtons = models.map((m) => [
      {
        text: m.name + (m.id === model.id ? ' (atual)' : ''),
        callback_data: `model:${m.name}`
      }
    ])

    await TelegramService.bot.editMessageText(`Modelo atual: ${model.name}\n\nEscolha um modelo para usar:`, {
      chat_id: query.message?.chat.id,
      message_id: query.message?.message_id,
      reply_markup: {
        inline_keyboard: modelButtons
      }
    })
  } catch (error) {
    // Ignora erros de mensagem não modificada
    if (error.response?.body?.description?.includes('message is not modified')) {
      return
    }
    throw error
  }
})

export const helpCommand = {
  command: 'help',
  description: 'Mostrar ajuda sobre os comandos',
  handler: async (msg: TelegramMessage) => {
    const helpText = `
Comandos disponíveis:

/start - Iniciar o bot e registrar usuário
/model - Escolher ou visualizar o modelo atual
/help - Mostrar esta mensagem de ajuda

Para conversar, simplesmente envie uma mensagem.
Para continuar um contexto, responda a uma mensagem anterior.
Para incluir uma imagem na conversa, envie a imagem com uma descrição.

Seu ID: ${msg.from.id}
    `.trim()

    await TelegramService.sendMessage(msg.from.id, helpText)
  }
}

export const commands = [startCommand, modelCommand, helpCommand]
