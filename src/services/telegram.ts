import TelegramBot from 'node-telegram-bot-api'
import { config } from '../config'
import { TelegramMessage, TelegramSentMessage, TelegramPhotoOptions } from '../types'
import sanitizeTelegramMarkdownV2 from 'telegramify-markdown'

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
      const sanitizedText = sanitizeTelegramMarkdownV2(text, 'keep')
      const sentMessage = await bot.sendMessage(chatId, sanitizedText, {
        reply_to_message_id: options?.replyToMessageId,
        parse_mode: 'MarkdownV2',
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
            id: msg.from?.id || 0,
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
  },

  sendPhoto: async (
    chatId: number | string,
    photoUrl: string,
    options?: TelegramPhotoOptions
  ): Promise<TelegramSentMessage> => {
    try {
      const sentMessage = await bot.sendPhoto(chatId, photoUrl, {
        caption: options?.caption ? sanitizeTelegramMarkdownV2(options.caption, 'keep') : undefined,
        reply_to_message_id: options?.replyToMessageId,
        parse_mode: 'MarkdownV2'
      })

      return {
        message_id: sentMessage.message_id,
        chat: {
          id: typeof sentMessage.chat.id === 'string' ? parseInt(sentMessage.chat.id) : sentMessage.chat.id
        },
        text: sentMessage.caption
      }
    } catch (error) {
      console.error('Telegram send photo error:', error)
      throw new Error('Erro ao enviar foto no Telegram')
    }
  }
}
