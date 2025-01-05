import { Message } from '@prisma/client'
import { OpenRouterMessage, TelegramMessage, OpenRouterContentPart, OpenRouterRole } from '../../types'
import { TelegramService } from '../../services/telegram'

/**
 * Error types for message format operations
 */
export enum MessageFormatErrorType {
  CONTENT_EXTRACTION = 'CONTENT_EXTRACTION',
  FORMAT_CONVERSION = 'FORMAT_CONVERSION'
}

/**
 * Custom error class for message format operations
 */
export class MessageFormatError extends Error {
  constructor(public type: MessageFormatErrorType, message: string, public originalError?: unknown) {
    super(message)
    this.name = 'MessageFormatError'
  }
}

/**
 * Interface for extracted message content
 */
export interface ExtractedContent {
  content: string
  imageUrl?: string
}

/**
 * Utility functions for message processing and format conversion
 */
export const MessageFormatUtils = {
  /**
   * Extract content and image URL from a Telegram message
   */
  extractMessageContent: async (msg: TelegramMessage): Promise<ExtractedContent> => {
    try {
      let content = msg.text || ''
      let imageUrl: string | undefined

      if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1] // Get highest resolution
        imageUrl = await TelegramService.getFile(photo.file_id)
        content = msg.caption || 'Por favor, analise esta imagem'
      }

      return { content, imageUrl }
    } catch (error) {
      throw new MessageFormatError(
        MessageFormatErrorType.CONTENT_EXTRACTION,
        'Failed to extract message content',
        error
      )
    }
  },

  /**
   * Convert messages to OpenRouter format
   */
  convertToOpenRouterFormat: (messages: Message[]): OpenRouterMessage[] => {
    try {
      return messages.map((m: Message) => ({
        role: m.role as OpenRouterRole,
        content: m.imageUrl
          ? [
              { type: 'text' as const, text: m.content },
              { type: 'image_url' as const, image_url: m.imageUrl }
            ]
          : m.content
      }))
    } catch (error) {
      throw new MessageFormatError(
        MessageFormatErrorType.FORMAT_CONVERSION,
        'Failed to convert messages to OpenRouter format',
        error
      )
    }
  },

  /**
   * Create OpenRouter message from content and image
   */
  createOpenRouterMessage: (content: string, imageUrl?: string): OpenRouterMessage => {
    try {
      const message: OpenRouterMessage = {
        role: 'user',
        content: content
      }

      if (imageUrl) {
        const contentParts: OpenRouterContentPart[] = [
          { type: 'text', text: content },
          { type: 'image_url', image_url: imageUrl }
        ]
        message.content = contentParts
      }

      return message
    } catch (error) {
      throw new MessageFormatError(
        MessageFormatErrorType.FORMAT_CONVERSION,
        'Failed to create OpenRouter message',
        error
      )
    }
  },

  /**
   * Format message format error messages
   */
  formatError: (error: MessageFormatError): string => {
    let message = `Message Format Error (${error.type}): ${error.message}`
    if (error.originalError instanceof Error) {
      message += `\nCause: ${error.originalError.message}`
    }
    return message
  }
}
