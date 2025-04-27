"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const config_1 = require("../config");
const telegramUtils_1 = require("./telegramUtils");
const bot = new node_telegram_bot_api_1.default(config_1.config.telegram.token, { polling: true });
exports.TelegramService = {
    bot,
    sendMessage: async (chatId, text, options) => {
        try {
            const sanitizedText = (0, telegramUtils_1.sanitizeMessage)(text);
            const messageOptions = (0, telegramUtils_1.buildMessageOptions)(options);
            const sentMessage = await bot.sendMessage(chatId, sanitizedText, messageOptions);
            return (0, telegramUtils_1.formatSentMessage)(sentMessage);
        }
        catch (error) {
            return (0, telegramUtils_1.handleTelegramError)('send message', error, 'Erro ao enviar mensagem no Telegram');
        }
    },
    getFile: async (fileId) => {
        try {
            const file = await bot.getFile(fileId);
            return `https://api.telegram.org/file/bot${config_1.config.telegram.token}/${file.file_path}`;
        }
        catch (error) {
            return (0, telegramUtils_1.handleTelegramError)('get file', error, 'Erro ao obter arquivo do Telegram');
        }
    },
    setCommands: async (commands) => {
        try {
            await bot.setMyCommands(commands);
        }
        catch (error) {
            return (0, telegramUtils_1.handleTelegramError)('set commands', error, 'Erro ao configurar comandos do bot');
        }
    },
    onMessage: (callback) => {
        bot.on('message', async (msg) => {
            var _a, _b, _c;
            try {
                const formattedMsg = {
                    messageId: msg.message_id,
                    from: {
                        id: ((_a = msg.from) === null || _a === void 0 ? void 0 : _a.id) || 0,
                        username: (_b = msg.from) === null || _b === void 0 ? void 0 : _b.username
                    },
                    caption: msg.caption,
                    text: msg.text,
                    photo: (_c = msg.photo) === null || _c === void 0 ? void 0 : _c.map((p) => ({ file_id: p.file_id })),
                    reply_to_message: msg.reply_to_message
                        ? {
                            message_id: msg.reply_to_message.message_id
                        }
                        : undefined,
                    document: msg.document && msg.document.file_id
                        ? {
                            file_id: msg.document.file_id,
                            file_name: msg.document.file_name || 'document.pdf',
                            mime_type: msg.document.mime_type || 'application/pdf'
                        }
                        : undefined
                };
                await callback(formattedMsg);
            }
            catch (error) {
                console.error('Error processing message:', error);
                await bot.sendMessage(msg.chat.id, 'Desculpe, ocorreu um erro ao processar sua mensagem.');
            }
        });
    },
    onCallbackQuery: (callback) => {
        bot.on('callback_query', async (query) => {
            try {
                await callback(query);
            }
            catch (error) {
                console.error('Error processing callback query:', error);
                await bot.answerCallbackQuery(query.id, {
                    text: 'Desculpe, ocorreu um erro ao processar sua seleção.'
                });
            }
        });
    },
    sendPhoto: async (chatId, photoUrl, options) => {
        try {
            const messageOptions = (0, telegramUtils_1.buildMessageOptions)(options);
            const sentMessage = await bot.sendPhoto(chatId, photoUrl, messageOptions);
            return (0, telegramUtils_1.formatSentMessage)(sentMessage);
        }
        catch (error) {
            return (0, telegramUtils_1.handleTelegramError)('send photo', error, 'Erro ao enviar foto no Telegram');
        }
    }
};
//# sourceMappingURL=telegram.js.map