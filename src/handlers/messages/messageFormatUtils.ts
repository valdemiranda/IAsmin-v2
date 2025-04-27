import { Message } from '@prisma/client'
import { OpenRouterMessage, TelegramMessage, OpenRouterContentPart, OpenRouterRole } from '../../types'
import { TelegramService } from '../../services/telegram'
import { downloadAndEncodePdf } from '../../utils/pdfUtils'

/**
 * Error types for message format operations
 */
export enum MessageFormatErrorType {
  CONTENT_EXTRACTION = 'CONTENT_EXTRACTION',
  FORMAT_CONVERSION = 'FORMAT_CONVERSION',
  FILE_PROCESSING = 'FILE_PROCESSING'
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
  pdfUrl?: string
  filename?: string
}

/**
 * Utility functions for message processing and format conversion
 */
export const MessageFormatUtils = {
  /**
   * Extract content and file URLs from a Telegram message
   */
  extractMessageContent: async (msg: TelegramMessage): Promise<ExtractedContent> => {
    try {
      let content = msg.text || ''
      let imageUrl: string | undefined
      let pdfUrl: string | undefined
      let filename: string | undefined

      if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1] // Get highest resolution
        imageUrl = await TelegramService.getFile(photo.file_id)
        content = msg.caption || 'Por favor, analise esta imagem'
      } else if (msg.document) {
        // Handle document (potentially PDF)
        const fileUrl = await TelegramService.getFile(msg.document.file_id)
        const mimeType = msg.document.mime_type

        if (mimeType === 'application/pdf') {
          filename = msg.document.file_name
          content =
            msg.caption ||
            'Por favor, analise o conteúdo deste PDF e me forneça um resumo dos principais pontos'

          // Baixar e codificar o PDF como base64
          try {
            pdfUrl = await downloadAndEncodePdf(fileUrl)
          } catch (downloadError) {
            console.error('Erro ao baixar e codificar PDF:', downloadError)
            // Manter a URL original como fallback
            pdfUrl = fileUrl
          }
        }
      }

      return { content, imageUrl, pdfUrl, filename }
    } catch (error) {
      console.error('Erro ao extrair conteúdo da mensagem:', error)
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
      return messages.map((m: Message) => {
        // Base message structure
        const message: OpenRouterMessage = {
          role: m.role as OpenRouterRole,
          content: m.content
        }

        // Content parts array for multimedia messages
        const contentParts: OpenRouterContentPart[] = []

        // Add text content
        contentParts.push({ type: 'text', text: m.content })

        // Add image if available
        if (m.imageUrl) {
          contentParts.push({ type: 'image_url', image_url: m.imageUrl })
        }

        // Add PDF if available
        if (m.pdfUrl) {
          contentParts.push({
            type: 'file',
            file: {
              filename: m.pdfUrl.includes(';base64,')
                ? 'document.pdf'
                : m.pdfUrl.split('/').pop() || 'document.pdf',
              file_data: m.pdfUrl
            }
          })
        }

        // If we have multimedia content, use the array format
        if (m.imageUrl || m.pdfUrl) {
          message.content = contentParts
        }

        return message
      })
    } catch (error) {
      throw new MessageFormatError(
        MessageFormatErrorType.FORMAT_CONVERSION,
        'Failed to convert messages to OpenRouter format',
        error
      )
    }
  },

  /**
   * Create OpenRouter message from content and files
   */
  createOpenRouterMessage: (
    content: string,
    imageUrl?: string,
    pdfUrl?: string,
    filename?: string
  ): OpenRouterMessage => {
    try {
      const message: OpenRouterMessage = {
        role: 'user',
        content: content
      }

      if (imageUrl || pdfUrl) {
        const contentParts: OpenRouterContentPart[] = [{ type: 'text', text: content }]

        if (imageUrl) {
          contentParts.push({ type: 'image_url', image_url: imageUrl })
        }

        if (pdfUrl && filename) {
          contentParts.push({
            type: 'file',
            file: {
              filename: filename,
              file_data: pdfUrl
            }
          })
        }

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
   * Create OpenRouter message with PDF content
   */
  createPdfOpenRouterMessage: (query: string, pdfDataUrl: string, filename: string): OpenRouterMessage => {
    try {
      return {
        role: 'user',
        content: [
          {
            type: 'text',
            text: query
          },
          {
            type: 'file',
            file: {
              filename: filename,
              file_data: pdfDataUrl
            }
          }
        ]
      }
    } catch (error) {
      throw new MessageFormatError(
        MessageFormatErrorType.FILE_PROCESSING,
        'Failed to create PDF OpenRouter message',
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
