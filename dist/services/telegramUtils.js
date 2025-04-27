"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTelegramError = handleTelegramError;
exports.sanitizeMessage = sanitizeMessage;
exports.parseChatId = parseChatId;
exports.formatSentMessage = formatSentMessage;
exports.buildMessageOptions = buildMessageOptions;
const telegramify_markdown_1 = __importDefault(require("telegramify-markdown"));
async function handleTelegramError(operation, error, defaultMessage) {
    console.error(`Telegram ${operation} error:`, error);
    throw new Error(defaultMessage);
}
function sanitizeMessage(text) {
    return (0, telegramify_markdown_1.default)(text, 'escape');
}
function parseChatId(chatId) {
    return typeof chatId === 'string' ? parseInt(chatId) : chatId;
}
function formatSentMessage(message) {
    return {
        message_id: message.message_id,
        chat: {
            id: parseChatId(message.chat.id)
        },
        text: message.text || message.caption
    };
}
function buildMessageOptions(options) {
    return {
        reply_to_message_id: options === null || options === void 0 ? void 0 : options.replyToMessageId,
        parse_mode: 'MarkdownV2',
        caption: (options === null || options === void 0 ? void 0 : options.caption) ? sanitizeMessage(options.caption) : undefined,
        reply_markup: (options === null || options === void 0 ? void 0 : options.inlineKeyboard)
            ? {
                inline_keyboard: options.inlineKeyboard
            }
            : undefined
    };
}
//# sourceMappingURL=telegramUtils.js.map