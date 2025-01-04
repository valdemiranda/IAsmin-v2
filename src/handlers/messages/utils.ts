import { Message } from '@prisma/client'
import { OpenRouterMessage, TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'

// Utility functions for message processing
export const MessageUtils = {
  // Extract content and image URL from a Telegram message
  extractMessageContent: async (msg: TelegramMessage): Promise<{ content: string; imageUrl?: string }> => {
    let content = msg.text || ''
    let imageUrl: string | undefined

    if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1] // Get highest resolution
      imageUrl = await TelegramService.getFile(photo.file_id)
      content = msg.caption || 'Por favor, analise esta imagem'
    }

    return { content, imageUrl }
  },

  // Convert messages to OpenRouter format
  convertToOpenRouterFormat: (messages: Message[]): OpenRouterMessage[] => {
    return messages.map((m: Message) => ({
      role: m.role,
      content: m.imageUrl
        ? [
            { type: 'text', text: m.content },
            { type: 'image_url', image_url: m.imageUrl }
          ]
        : m.content
    }))
  },

  // Create OpenRouter message from content and image
  createOpenRouterMessage: (content: string, imageUrl?: string): OpenRouterMessage => ({
    role: 'user',
    content: imageUrl
      ? [
          { type: 'text', text: content },
          { type: 'image_url', image_url: imageUrl }
        ]
      : content
  })
}
