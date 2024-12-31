import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import { TelegramMessage, TelegramSentMessage } from '../types';

const sanitizeMarkdown = (text: string): string => {
  // Array to store positions of special characters
  const specialChars = new Map<string, number[]>();
  const chars = ['*', '_', '`'];

  // Find all positions of special characters
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (chars.includes(char)) {
      if (!specialChars.has(char)) {
        specialChars.set(char, []);
      }
      specialChars.get(char)?.push(i);
    }
  }

  // Process each special character
  let sanitizedText = text;
  specialChars.forEach((positions, char) => {
    // If we have an odd count of a special character, add one at the end
    if (positions.length % 2 !== 0) {
      sanitizedText = sanitizedText + char;
    }
  });

  // Handle code blocks (```)
  const codeBlockCount = (text.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    sanitizedText = sanitizedText + '```';
  }

  return sanitizedText;
};

const bot = new TelegramBot(config.telegram.token, { polling: true });

export const TelegramService = {
  bot,

  sendMessage: async (chatId: number | string, text: string, replyToMessageId?: number): Promise<TelegramSentMessage> => {
    try {
      const sanitizedText = sanitizeMarkdown(text);
      const sentMessage = await bot.sendMessage(chatId, sanitizedText, {
        reply_to_message_id: replyToMessageId,
        parse_mode: 'Markdown',
      });
      
      return {
        message_id: sentMessage.message_id,
        chat: {
          id: typeof sentMessage.chat.id === 'string' ? parseInt(sentMessage.chat.id) : sentMessage.chat.id
        },
        text: sentMessage.text
      };
    } catch (error) {
      console.error('Telegram send message error:', error);
      throw new Error('Erro ao enviar mensagem no Telegram');
    }
  },

  getFile: async (fileId: string) => {
    try {
      const file = await bot.getFile(fileId);
      return `https://api.telegram.org/file/bot${config.telegram.token}/${file.file_path}`;
    } catch (error) {
      console.error('Telegram get file error:', error);
      throw new Error('Erro ao obter arquivo do Telegram');
    }
  },

  setCommands: async (commands: Array<{ command: string; description: string }>) => {
    try {
      await bot.setMyCommands(commands);
    } catch (error) {
      console.error('Telegram set commands error:', error);
      throw new Error('Erro ao configurar comandos do bot');
    }
  },

  onMessage: (callback: (msg: TelegramMessage) => Promise<void>) => {
    bot.on('message', async (msg) => {
      try {
        const formattedMsg: TelegramMessage = {
          messageId: msg.message_id,
          from: {
            id: msg.from?.id.toString() || '',
            username: msg.from?.username,
          },
          caption: msg.caption,
          text: msg.text,
          photo: msg.photo?.map(p => ({ file_id: p.file_id })),
          reply_to_message: msg.reply_to_message ? {
            message_id: msg.reply_to_message.message_id,
          } : undefined,
        };

        await callback(formattedMsg);
      } catch (error) {
        console.error('Error processing message:', error);
        await bot.sendMessage(
          msg.chat.id,
          'Desculpe, ocorreu um erro ao processar sua mensagem.'
        );
      }
    });
  },
};
