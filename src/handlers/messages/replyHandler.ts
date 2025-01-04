import { Message } from '@prisma/client'
import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { OpenRouterService } from '../../services/openRouter'
import { OpenAIService } from '../../services/openai'
import { MessageRepository } from '../../repositories'
import { MessageUtils } from './utils'

// Handle replies to existing messages
export async function handleReplyMessage(msg: TelegramMessage): Promise<void> {
  const previousMessage = await MessageRepository.findByTelegramMessageId(msg.reply_to_message!.message_id)

  if (!previousMessage || !previousMessage.context) {
    await TelegramService.sendMessage(msg.from.id, 'Não foi possível encontrar o contexto desta mensagem.')
    return
  }

  const context = previousMessage.context
  const { content, imageUrl } = await MessageUtils.extractMessageContent(msg)

  // Save user message
  const userMessage = await MessageRepository.create({
    contextId: context.id,
    content,
    role: 'user',
    imageUrl,
    replyToId: previousMessage.id,
    telegramMessageId: msg.messageId
  })

  if (context.type === 'image') {
    await handleImageReply(msg, context.id, userMessage.id, content)
  } else {
    await handleChatReply(msg, previousMessage.id, userMessage.id, content, imageUrl)
  }
}

// Handle replies in image context
async function handleImageReply(
  msg: TelegramMessage,
  contextId: string,
  userMessageId: string,
  content: string
): Promise<void> {
  const previousMessages = await MessageRepository.findByContextId(contextId)
  const userMessages = previousMessages
    .filter((m: Message) => m.role === 'user')
    .map((m: Message) => m.content)
    .concat(content)
    .join(';\n')

  await TelegramService.sendMessage(msg.from.id, '🎨 Desenhando...', {
    replyToMessageId: msg.messageId
  })

  const generatedImageUrl = await OpenAIService.generateImage(userMessages)
  const response =
    'Aqui está a imagem gerada com base nas suas instruções. Se quiser outra imagem com base no mesmo contexto, basta responder à esta mensagem com instruções adicionais.'

  const sentMessage = await TelegramService.sendPhoto(msg.from.id, generatedImageUrl, {
    caption: response,
    replyToMessageId: msg.messageId
  })

  await MessageRepository.create({
    contextId,
    content: response,
    role: 'assistant',
    imageUrl: generatedImageUrl,
    replyToId: userMessageId,
    telegramMessageId: sentMessage.message_id
  })
}

// Handle replies in chat context
async function handleChatReply(
  msg: TelegramMessage,
  previousMessageId: string,
  userMessageId: string,
  content: string,
  imageUrl?: string
): Promise<void> {
  const { messages: historyMessages, modelName } = await MessageRepository.getMessageHistory(
    previousMessageId
  )
  const messages = MessageUtils.convertToOpenRouterFormat(historyMessages)
  messages.push(MessageUtils.createOpenRouterMessage(content, imageUrl))

  const response = imageUrl
    ? await OpenRouterService.vision(messages, modelName)
    : await OpenRouterService.chat(messages, modelName)

  const sentMessage = await TelegramService.sendMessage(msg.from.id, response, {
    replyToMessageId: msg.messageId
  })

  await MessageRepository.create({
    contextId: historyMessages[0].contextId,
    content: response,
    role: 'assistant',
    replyToId: userMessageId,
    telegramMessageId: sentMessage.message_id
  })
}
