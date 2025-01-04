export type TelegramMessage = {
  messageId: number
  from: {
    id: number
    username?: string
  }
  text?: string
  caption?: string
  photo?: Array<{
    file_id: string
  }>
  reply_to_message?: {
    message_id: number
  }
}

export type OpenRouterMessage = {
  role: string
  content: string | Array<{ type: string; text?: string; image_url?: string }>
}

export type OpenRouterResponse = {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
}

export type CommandHandler = {
  command: string
  description: string
  handler: (msg: TelegramMessage) => Promise<void>
}

export type MessageHandler = {
  handleMessage: (msg: TelegramMessage) => Promise<void>
}

export type TelegramSentMessage = {
  message_id: number
  chat: {
    id: number
  }
  text?: string
}

export type TelegramPhotoOptions = {
  caption?: string
  replyToMessageId?: number
}

// Extensão do tipo Context do Prisma
export interface ContextWithType {
  id: string
  userId: string
  modelId: string
  type: string
  createdAt: Date
  updatedAt: Date
  messages: any[]
}
