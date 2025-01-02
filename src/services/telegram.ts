import TelegramBot from 'node-telegram-bot-api'
import { config } from '../config'
import { TelegramMessage, TelegramSentMessage } from '../types'

const sanitizeMarkdown = (text: string): string => {
  // Characters that need to be properly closed
  const closableChars = ['*', '_', '`', '[', '(', '{']

  // Find all unclosed special characters
  const unclosedChars = new Set<string>()
  const stack: string[] = []

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    // Skip escaped characters
    if (i > 0 && text[i - 1] === '\\') continue

    if (closableChars.includes(char)) {
      // Check if it's an opening or closing character
      if (char === '[' || char === '(' || char === '{') {
        stack.push(char)
      } else if (char === ']' || char === ')' || char === '}') {
        const lastOpen = stack.pop()
        // If closing character doesn't match last opening, mark as unclosed
        if (
          (lastOpen === '[' && char !== ']') ||
          (lastOpen === '(' && char !== ')') ||
          (lastOpen === '{' && char !== '}')
        ) {
          unclosedChars.add(lastOpen || char)
        }
      } else {
        // For *, _, ` - toggle between open/closed state
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop()
        } else {
          stack.push(char)
        }
      }
    }
  }

  // Add any remaining unclosed characters to the set
  stack.forEach((char) => unclosedChars.add(char))

  // Escape unclosed special characters
  let sanitizedText = text
  unclosedChars.forEach((char) => {
    const regex = new RegExp(`(?<!\\\\)\\${char}`, 'g')
    sanitizedText = sanitizedText.replace(regex, `\\${char}`)
  })

  // Handle code blocks (```)
  const codeBlockCount = (sanitizedText.match(/```/g) || []).length
  if (codeBlockCount % 2 !== 0) {
    sanitizedText = sanitizedText + '```'
  }

  return sanitizedText
}

const bot = new TelegramBot(config.telegram.token, { polling: true })

export const TelegramService = {
  bot,

  sendMessage: async (
    chatId: number | string,
    text: string,
    options?: {
      replyToMessageId?: number
      inlineKeyboard?: Array<Array<{ text: string; callback_data: string }>>
    }
  ): Promise<TelegramSentMessage> => {
    try {
      const sanitizedText = sanitizeMarkdown(text)
      const sentMessage = await bot.sendMessage(chatId, sanitizedText, {
        reply_to_message_id: options?.replyToMessageId,
        parse_mode: 'Markdown',
        reply_markup: options?.inlineKeyboard
          ? {
              inline_keyboard: options.inlineKeyboard
            }
          : undefined
      })

      return {
        message_id: sentMessage.message_id,
        chat: {
          id: typeof sentMessage.chat.id === 'string' ? parseInt(sentMessage.chat.id) : sentMessage.chat.id
        },
        text: sentMessage.text
      }
    } catch (error) {
      console.error('Telegram send message error:', error)
      throw new Error('Erro ao enviar mensagem no Telegram')
    }
  },

  getFile: async (fileId: string) => {
    try {
      const file = await bot.getFile(fileId)
      return `https://api.telegram.org/file/bot${config.telegram.token}/${file.file_path}`
    } catch (error) {
      console.error('Telegram get file error:', error)
      throw new Error('Erro ao obter arquivo do Telegram')
    }
  },

  setCommands: async (commands: Array<{ command: string; description: string }>) => {
    try {
      await bot.setMyCommands(commands)
    } catch (error) {
      console.error('Telegram set commands error:', error)
      throw new Error('Erro ao configurar comandos do bot')
    }
  },

  onMessage: (callback: (msg: TelegramMessage) => Promise<void>) => {
    bot.on('message', async (msg) => {
      try {
        const formattedMsg: TelegramMessage = {
          messageId: msg.message_id,
          from: {
            id: msg.from?.id.toString() || '',
            username: msg.from?.username
          },
          caption: msg.caption,
          text: msg.text,
          photo: msg.photo?.map((p) => ({ file_id: p.file_id })),
          reply_to_message: msg.reply_to_message
            ? {
                message_id: msg.reply_to_message.message_id
              }
            : undefined
        }

        await callback(formattedMsg)
      } catch (error) {
        console.error('Error processing message:', error)
        await bot.sendMessage(msg.chat.id, 'Desculpe, ocorreu um erro ao processar sua mensagem.')
      }
    })
  },

  onCallbackQuery: (callback: (query: TelegramBot.CallbackQuery) => Promise<void>) => {
    bot.on('callback_query', async (query) => {
      try {
        await callback(query)
      } catch (error) {
        console.error('Error processing callback query:', error)
        await bot.answerCallbackQuery(query.id, {
          text: 'Desculpe, ocorreu um erro ao processar sua seleção.'
        })
      }
    })
  }
}
