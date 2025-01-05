import TelegramBot from 'node-telegram-bot-api'
import sanitizeTelegramMarkdownV2 from 'telegramify-markdown'
import { TelegramSentMessage } from '../types'

/**
 * Common error handler for Telegram API operations
 */
export async function handleTelegramError(
  operation: string,
  error: any,
  defaultMessage: string
): Promise<never> {
  console.error(`Telegram ${operation} error:`, error)
  throw new Error(defaultMessage)
}

/**
 * Common message sanitizer
 */
export function sanitizeMessage(text: string): string {
  return sanitizeTelegramMarkdownV2(text, 'remove')
}

/**
 * Common chat ID parser
 */
export function parseChatId(chatId: string | number): number {
  return typeof chatId === 'string' ? parseInt(chatId) : chatId
}

/**
 * Common message formatter
 */
export function formatSentMessage(message: TelegramBot.Message): TelegramSentMessage {
  return {
    message_id: message.message_id,
    chat: {
      id: parseChatId(message.chat.id)
    },
    text: message.text || message.caption
  }
}

/**
 * Common message options builder
 */
export function buildMessageOptions(options?: {
  replyToMessageId?: number
  inlineKeyboard?: Array<Array<{ text: string; callback_data: string }>>
  caption?: string
}): TelegramBot.SendMessageOptions & TelegramBot.SendPhotoOptions {
  return {
    reply_to_message_id: options?.replyToMessageId,
    parse_mode: 'MarkdownV2',
    caption: options?.caption ? sanitizeMessage(options.caption) : undefined,
    reply_markup: options?.inlineKeyboard
      ? {
          inline_keyboard: options.inlineKeyboard
        }
      : undefined
  }
}
