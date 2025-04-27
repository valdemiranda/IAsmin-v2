import TelegramBot from 'node-telegram-bot-api'
import { config } from '../config'
import { TelegramMessage, TelegramSentMessage, TelegramPhotoOptions } from '../types'
import { handleTelegramError, sanitizeMessage, formatSentMessage, buildMessageOptions } from './telegramUtils'

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
      const sanitizedText = sanitizeMessage(text)
      const messageOptions = buildMessageOptions(options)
      const sentMessage = await bot.sendMessage(chatId, sanitizedText, messageOptions)
      return formatSentMessage(sentMessage)
    } catch (error) {
      return handleTelegramError('send message', error, 'Erro ao enviar mensagem no Telegram')
    }
  },

  getFile: async (fileId: string) => {
    try {
      const file = await bot.getFile(fileId)
      return `https://api.telegram.org/file/bot${config.telegram.token}/${file.file_path}`
    } catch (error) {
      return handleTelegramError('get file', error, 'Erro ao obter arquivo do Telegram')
    }
  },

  setCommands: async (commands: Array<{ command: string; description: string }>) => {
    try {
      await bot.setMyCommands(commands)
    } catch (error) {
      return handleTelegramError('set commands', error, 'Erro ao configurar comandos do bot')
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
            : undefined,
          document:
            msg.document && msg.document.file_id
              ? {
                  file_id: msg.document.file_id,
                  file_name: msg.document.file_name || 'document.pdf',
                  mime_type: msg.document.mime_type || 'application/pdf'
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
      const messageOptions = buildMessageOptions(options)
      const sentMessage = await bot.sendPhoto(chatId, photoUrl, messageOptions)
      return formatSentMessage(sentMessage)
    } catch (error) {
      return handleTelegramError('send photo', error, 'Erro ao enviar foto no Telegram')
    }
  },

  sendPhotoBuffer: async (
    chatId: number | string,
    photoBuffer: Buffer,
    options?: TelegramPhotoOptions
  ): Promise<TelegramSentMessage> => {
    try {
      const messageOptions = buildMessageOptions(options)
      const sentMessage = await bot.sendPhoto(chatId, photoBuffer, messageOptions)
      return formatSentMessage(sentMessage)
    } catch (error) {
      return handleTelegramError('send photo buffer', error, 'Erro ao enviar foto no Telegram')
    }
  }
}
