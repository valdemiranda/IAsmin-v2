"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReplyMessage = handleReplyMessage;
const telegram_1 = require("../../services/telegram");
const repositories_1 = require("../../repositories");
const messageFormatUtils_1 = require("./messageFormatUtils");
const messageHandlerUtils_1 = require("./messageHandlerUtils");
async function handleReplyMessage(msg) {
    const previousMessage = await repositories_1.MessageRepository.findByTelegramMessageId(msg.reply_to_message.message_id);
    if (!previousMessage || !previousMessage.context) {
        await telegram_1.TelegramService.sendMessage(msg.from.id, 'Não foi possível encontrar o contexto desta mensagem.');
        return;
    }
    const context = previousMessage.context;
    const { content, imageUrl, pdfUrl, filename } = await messageFormatUtils_1.MessageFormatUtils.extractMessageContent(msg);
    const userMessage = await (0, messageHandlerUtils_1.createMessage)(context.id, content, 'user', msg.messageId, previousMessage.id, imageUrl, pdfUrl);
    if (context.type === 'image') {
        const previousMessages = await repositories_1.MessageRepository.findByContextId(context.id);
        const result = await (0, messageHandlerUtils_1.handleImageGeneration)(msg, context.id, userMessage.id, content, previousMessages);
        await (0, messageHandlerUtils_1.createMessage)(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id, result.imageUrl);
    }
    else if (context.type === 'document' && pdfUrl && filename) {
        const result = await (0, messageHandlerUtils_1.handleDocumentInteraction)(msg, context.id, userMessage.id, content, pdfUrl, filename, undefined, previousMessage.id);
        await (0, messageHandlerUtils_1.createMessage)(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id, undefined, result.pdfUrl);
    }
    else if (pdfUrl && filename) {
        const result = await (0, messageHandlerUtils_1.handleDocumentInteraction)(msg, context.id, userMessage.id, content, pdfUrl, filename, undefined, previousMessage.id);
        await (0, messageHandlerUtils_1.createMessage)(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id, undefined, result.pdfUrl);
    }
    else {
        const result = await (0, messageHandlerUtils_1.handleChatInteraction)(msg, context.id, userMessage.id, content, imageUrl, undefined, previousMessage.id);
        await (0, messageHandlerUtils_1.createMessage)(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id);
    }
}
//# sourceMappingURL=replyHandler.js.map