import TelegramBot from 'node-telegram-bot-api'
import { config } from '../config'
import { TelegramMessage, TelegramSentMessage } from '../types'

/**
 * Sanitizes text for Telegram's MarkdownV2 format
 * Escapes special characters according to Telegram's specifications
 * @param text - The text to be sanitized
 * @returns The sanitized text safe for MarkdownV2 format
 */
const sanitizeMarkdown = (text: string): string => {
  // Conforme documentação do Telegram, estes são os caracteres que devem ser escapados
  // em "posição normal": _ * [ ] ( ) ~ ` > # + - = | { } . !
  // O caractere '\' em si também deve ser escapado (\\).
  //
  // Aqui, vamos RETIRAR da regex os que desejamos manter:
  //   - `*` (bold)
  //   - `_` (italic/underline)
  //   - `` ` `` (code)
  //   - `~` (strikethrough)
  //   - `|` (spoiler)
  //
  // Ou seja, escaparemos somente:
  //   [ ] ( ) > # + - = { } . ! e a barra invertida "\"
  //
  // Observação: se você quiser realmente escapar '_' ou '*', é só incluí-los na classe da regex.
  // Se quiser retirar mais, basta removê-los do grupo abaixo.
  const regex = /([\[\]\(\)>#\+\-=\{\}\.!\\])/g

  return text.replace(regex, '\\$1')
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
