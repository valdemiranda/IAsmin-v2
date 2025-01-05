import { Context, Message } from '@prisma/client'

// Telegram Types
export interface TelegramUser {
  id: number
  username?: string
}

export interface TelegramPhoto {
  file_id: string
}

export interface TelegramReplyMessage {
  message_id: number
}

/**
 * Represents a message received from Telegram
 */
export interface TelegramMessage {
  messageId: number
  from: TelegramUser
  text?: string
  caption?: string
  photo?: TelegramPhoto[]
  reply_to_message?: TelegramReplyMessage
}

/**
 * Represents a message sent to Telegram
 */
export interface TelegramSentMessage {
  message_id: number
  chat: {
    id: number
  }
  text?: string
}

/**
 * Options for sending photos via Telegram
 */
export interface TelegramPhotoOptions {
  caption?: string
  replyToMessageId?: number
}

// OpenRouter Types
export type OpenRouterRole = 'user' | 'assistant' | 'system'

export interface OpenRouterContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: string
}

/**
 * Represents a message in the OpenRouter format
 */
export interface OpenRouterMessage {
  role: OpenRouterRole
  content: string | OpenRouterContentPart[]
}

/**
 * Represents a response from the OpenRouter API
 */
export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
      role: OpenRouterRole
    }
    finish_reason: string
  }>
}

// Handler Types
/**
 * Represents a command handler
 */
export interface CommandHandler {
  command: string
  description: string
  handler: (msg: TelegramMessage) => Promise<void>
}

/**
 * Represents a message handler
 */
export interface MessageHandler {
  handleMessage: (msg: TelegramMessage) => Promise<void>
}

// Context Types
/**
 * Extends Prisma's Context type with additional properties
 */
export interface ContextWithType extends Context {
  type: 'chat' | 'image'
  messages: Message[]
}
