import { Message } from '@prisma/client'
import { TelegramMessage, OpenRouterMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { OpenRouterService } from '../../services/openRouter'
import { OpenAIService } from '../../services/openai'
import { MessageRepository } from '../../repositories'
import { MessageFormatUtils, MessageFormatError } from './messageFormatUtils'

// Common interface for message handling responses
interface MessageHandlingResult {
  content: string
  imageUrl?: string
  telegramMessageId: number
}

/**
 * Common utility for handling image generation contexts
 */
export async function handleImageGeneration(
  msg: TelegramMessage,
  _contextId: string,
  _userMessageId: string,
  content: string,
  previousMessages?: Message[]
): Promise<MessageHandlingResult> {
  // Combine previous messages with new content if in reply context
  const promptContent = previousMessages
    ? previousMessages
        .filter((m: Message) => m.role === 'user')
        .map((m: Message) => m.content)
        .concat(content)
        .join(';\n')
    : content

  // Send waiting message
  const waitMessage = await TelegramService.sendMessage(msg.from.id, '🎨 Desenhando...', {
    replyToMessageId: msg.messageId
  })

  // Generate image
  const generatedImageUrl = await OpenAIService.generateImage(promptContent)

  // Delete waiting message
  await TelegramService.bot.deleteMessage(msg.from.id, waitMessage.message_id)

  const response =
    'Aqui está a imagem gerada com base nas suas instruções. Se quiser outra imagem com base no mesmo contexto, basta responder à esta mensagem com instruções adicionais.'

  // Send response with image
  const sentMessage = await TelegramService.sendPhoto(msg.from.id, generatedImageUrl, {
    caption: response,
    replyToMessageId: msg.messageId
  })

  return {
    content: response,
    imageUrl: generatedImageUrl,
    telegramMessageId: sentMessage.message_id
  }
}

/**
 * Common utility for handling chat contexts
 */
export async function handleChatInteraction(
  msg: TelegramMessage,
  _contextId: string,
  _userMessageId: string,
  content: string,
  imageUrl?: string,
  modelName?: string,
  previousMessageId?: string
): Promise<MessageHandlingResult> {
  // Get message history if in reply context
  let messages: OpenRouterMessage[] = []
  if (previousMessageId) {
    const { messages: historyMessages, modelName: historyModelName } =
      await MessageRepository.getMessageHistory(previousMessageId)
    try {
      messages = MessageFormatUtils.convertToOpenRouterFormat(historyMessages)
    } catch (error) {
      if (error instanceof MessageFormatError) {
        console.error(MessageFormatUtils.formatError(error))
      }
      throw error
    }
    modelName = historyModelName
  }

  try {
    messages.push(MessageFormatUtils.createOpenRouterMessage(content, imageUrl))
  } catch (error) {
    if (error instanceof MessageFormatError) {
      console.error(MessageFormatUtils.formatError(error))
    }
    throw error
  }

  // Get response from appropriate service
  const response = imageUrl
    ? await OpenRouterService.vision(messages, modelName!)
    : await OpenRouterService.chat(messages, modelName!)

  // Send response
  const sentMessage = await TelegramService.sendMessage(msg.from.id, response, {
    replyToMessageId: msg.messageId
  })

  return {
    content: response,
    telegramMessageId: sentMessage.message_id
  }
}

/**
 * Common utility for creating and saving messages
 */
export async function createMessage(
  contextId: string,
  content: string,
  role: 'user' | 'assistant',
  telegramMessageId: number,
  replyToId?: string,
  imageUrl?: string
): Promise<Message> {
  return MessageRepository.create({
    contextId,
    content,
    role,
    imageUrl,
    replyToId,
    telegramMessageId
  })
}
