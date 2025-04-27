"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNewContext = handleNewContext;
const telegram_1 = require("../../services/telegram");
const repositories_1 = require("../../repositories");
const messageFormatUtils_1 = require("./messageFormatUtils");
const messageHandlerUtils_1 = require("./messageHandlerUtils");
async function handleNewContext(msg) {
    const telegramId = msg.from.id;
    const userId = telegramId.toString();
    const userModel = await repositories_1.ModelRepository.getUserDefaultOrFirst(userId);
    if (!userModel) {
        await telegram_1.TelegramService.sendMessage(telegramId, 'Nenhum modelo disponível. Por favor, contate um administrador.');
        return;
    }
    const { content, imageUrl, pdfUrl, filename } = await messageFormatUtils_1.MessageFormatUtils.extractMessageContent(msg);
    let contextType = 'chat';
    if (pdfUrl && filename) {
        contextType = 'document';
    }
    else if (msg.photo) {
        contextType = 'image';
    }
    const context = await repositories_1.ContextRepository.create({ userId, modelId: userModel.id, type: contextType });
    await sendContextStartMessage(telegramId, userModel.name, contextType);
    const userMessage = await (0, messageHandlerUtils_1.createMessage)(context.id, content, 'user', msg.messageId, undefined, imageUrl, pdfUrl);
    if (contextType === 'image') {
        const result = await (0, messageHandlerUtils_1.handleImageGeneration)(msg, context.id, userMessage.id, content);
        await (0, messageHandlerUtils_1.createMessage)(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id, result.imageUrl);
    }
    else if (contextType === 'document') {
        const result = await (0, messageHandlerUtils_1.handleDocumentInteraction)(msg, context.id, userMessage.id, content, pdfUrl, filename, userModel.name);
        await (0, messageHandlerUtils_1.createMessage)(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id, undefined, result.pdfUrl);
    }
    else {
        const result = await (0, messageHandlerUtils_1.handleChatInteraction)(msg, context.id, userMessage.id, content, imageUrl, userModel.name);
        await (0, messageHandlerUtils_1.createMessage)(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id);
    }
}
async function sendContextStartMessage(telegramId, modelName, contextType = 'chat') {
    let startMessage = `Iniciando nova conversa com ${modelName}.`;
    if (contextType === 'image') {
        startMessage = `Analisando imagem com ${modelName}.`;
    }
    else if (contextType === 'document') {
        startMessage = `Analisando documento PDF com ${modelName}.`;
    }
    await telegram_1.TelegramService.sendMessage(telegramId, startMessage);
}
//# sourceMappingURL=contextHandler.js.map