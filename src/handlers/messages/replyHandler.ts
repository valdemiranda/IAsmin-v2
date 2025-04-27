import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { MessageRepository } from '../../repositories'
import { MessageFormatUtils } from './messageFormatUtils'
import {
  handleImageGeneration,
  handleChatInteraction,
  handleDocumentInteraction,
  createMessage
} from './messageHandlerUtils'

// Handle replies to existing messages
export async function handleReplyMessage(msg: TelegramMessage): Promise<void> {
  const previousMessage = await MessageRepository.findByTelegramMessageId(msg.reply_to_message!.message_id)

  if (!previousMessage || !previousMessage.context) {
    await TelegramService.sendMessage(msg.from.id, 'Não foi possível encontrar o contexto desta mensagem.')
    return
  }

  const context = previousMessage.context
  const { content, imageUrl, pdfUrl, filename } = await MessageFormatUtils.extractMessageContent(msg)

  // Save user message
  const userMessage = await createMessage(
    context.id,
    content,
    'user',
    msg.messageId,
    previousMessage.id,
    imageUrl,
    pdfUrl
  )

  // Handle message based on content
  if (context.type === 'image') {
    // Continue image generation context
    const previousMessages = await MessageRepository.findByContextId(context.id)
    const result = await handleImageGeneration(msg, context.id, userMessage.id, content, previousMessages)
    await createMessage(
      context.id,
      result.content,
      'assistant',
      result.telegramMessageId,
      userMessage.id,
      result.imageUrl
    )
  } else if (context.type === 'document' && pdfUrl && filename) {
    // Continue PDF document analysis in document context
    const result = await handleDocumentInteraction(
      msg,
      context.id,
      userMessage.id,
      content,
      pdfUrl,
      filename,
      undefined,
      previousMessage.id
    )
    await createMessage(
      context.id,
      result.content,
      'assistant',
      result.telegramMessageId,
      userMessage.id,
      undefined,
      result.pdfUrl
    )
  } else if (pdfUrl && filename) {
    // New PDF document in a chat context - handle it appropriately
    const result = await handleDocumentInteraction(
      msg,
      context.id,
      userMessage.id,
      content,
      pdfUrl,
      filename,
      undefined,
      previousMessage.id
    )
    await createMessage(
      context.id,
      result.content,
      'assistant',
      result.telegramMessageId,
      userMessage.id,
      undefined,
      result.pdfUrl
    )
  } else {
    // Regular chat message
    const result = await handleChatInteraction(
      msg,
      context.id,
      userMessage.id,
      content,
      imageUrl,
      undefined,
      previousMessage.id
    )
    await createMessage(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id)
  }
}
