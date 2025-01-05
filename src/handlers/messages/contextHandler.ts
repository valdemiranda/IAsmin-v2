import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { ContextRepository, ModelRepository } from '../../repositories'
import { MessageFormatUtils } from './messageFormatUtils'
import { handleImageGeneration, handleChatInteraction, createMessage } from './messageHandlerUtils'

// Handle creation of new message contexts
export async function handleNewContext(msg: TelegramMessage): Promise<void> {
  const telegramId = msg.from.id
  const userId = telegramId.toString()
  const userModel = await ModelRepository.getUserDefaultOrFirst(userId)

  if (!userModel) {
    await TelegramService.sendMessage(
      telegramId,
      'Nenhum modelo disponível. Por favor, contate um administrador.'
    )
    return
  }

  const context = await ContextRepository.create({ userId, modelId: userModel.id })
  await sendContextStartMessage(telegramId, userModel.name)

  const { content, imageUrl } = await MessageFormatUtils.extractMessageContent(msg)

  // Save user message
  const userMessage = await createMessage(context.id, content, 'user', msg.messageId, undefined, imageUrl)

  // Handle context based on type
  if (context.type === 'image') {
    const result = await handleImageGeneration(msg, context.id, userMessage.id, content)
    await createMessage(
      context.id,
      result.content,
      'assistant',
      result.telegramMessageId,
      userMessage.id,
      result.imageUrl
    )
  } else {
    const result = await handleChatInteraction(
      msg,
      context.id,
      userMessage.id,
      content,
      imageUrl,
      userModel.name
    )
    await createMessage(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id)
  }
}

// Send initial context message
async function sendContextStartMessage(userId: number, modelName: string): Promise<void> {
  await TelegramService.sendMessage(
    userId,
    `🔄 Iniciando um novo contexto de conversa usando o modelo **${modelName}**.\n` +
      'Se quiser alterar o modelo, use o comando /model.\n' +
      'Para manter um contexto basta responder à mensagem sobre a qual deseja continuar conversando.'
  )
}
