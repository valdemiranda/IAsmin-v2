import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { OpenRouterService } from '../../services/openRouter'
import { OpenAIService } from '../../services/openai'
import { ContextRepository, MessageRepository, ModelRepository } from '../../repositories'
import { MessageUtils } from './utils'

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

  const context = await ContextRepository.create(userId, userModel.id)
  await sendContextStartMessage(telegramId, userModel.name)

  const { content, imageUrl } = await MessageUtils.extractMessageContent(msg)

  // Save user message
  const userMessage = await MessageRepository.create({
    contextId: context.id,
    content,
    role: 'user',
    imageUrl,
    telegramMessageId: msg.messageId
  })

  if (context.type === 'image') {
    await handleImageContext(msg, context.id, userMessage.id, content)
  } else {
    await handleChatContext(msg, context.id, userMessage.id, content, imageUrl, userModel.name)
  }
}

// Send initial context message
async function sendContextStartMessage(userId: number, modelName: string): Promise<void> {
  await TelegramService.sendMessage(
    userId,
    `🔄 Iniciando um novo contexto de conversa usando o modelo *${modelName}*.\n` +
      'Para alterar o modelo, use o comando /model.\n' +
      'Para manter o contexto basta responder à mensagem sobre a qual deseja continuar conversando.'
  )
}

// Handle new image generation context
async function handleImageContext(
  msg: TelegramMessage,
  contextId: string,
  userMessageId: string,
  content: string
): Promise<void> {
  const waitMessage = await TelegramService.sendMessage(msg.from.id, '🎨 Desenhando...', {
    replyToMessageId: msg.messageId
  })

  const imageUrl = await OpenAIService.generateImage(content)
  await TelegramService.bot.deleteMessage(msg.from.id, waitMessage.message_id)

  const response =
    'Aqui está a imagem gerada com base nas suas instruções. Se quiser outra imagem com base no mesmo contexto, basta responder à esta mensagem com instruções adicionais.'
  const sentMessage = await TelegramService.sendPhoto(msg.from.id, imageUrl, {
    caption: response,
    replyToMessageId: msg.messageId
  })

  await MessageRepository.create({
    contextId,
    content: response,
    role: 'assistant',
    imageUrl,
    replyToId: userMessageId,
    telegramMessageId: sentMessage.message_id
  })
}

// Handle new chat context
async function handleChatContext(
  msg: TelegramMessage,
  contextId: string,
  userMessageId: string,
  content: string,
  imageUrl: string | undefined,
  modelName: string
): Promise<void> {
  const messages = [MessageUtils.createOpenRouterMessage(content, imageUrl)]

  const response = imageUrl
    ? await OpenRouterService.vision(messages, modelName)
    : await OpenRouterService.chat(messages, modelName)

  const sentMessage = await TelegramService.sendMessage(msg.from.id, response, {
    replyToMessageId: msg.messageId
  })

  await MessageRepository.create({
    contextId,
    content: response,
    role: 'assistant',
    replyToId: userMessageId,
    telegramMessageId: sentMessage.message_id
  })
}
