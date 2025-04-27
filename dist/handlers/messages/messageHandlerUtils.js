"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImageGeneration = handleImageGeneration;
exports.handleChatInteraction = handleChatInteraction;
exports.createMessage = createMessage;
exports.handleDocumentInteraction = handleDocumentInteraction;
const telegram_1 = require("../../services/telegram");
const openRouter_1 = require("../../services/openRouter");
const openai_1 = require("../../services/openai");
const repositories_1 = require("../../repositories");
const messageFormatUtils_1 = require("./messageFormatUtils");
async function handleImageGeneration(msg, _contextId, _userMessageId, content, previousMessages) {
    const promptContent = previousMessages
        ? previousMessages
            .filter((m) => m.role === 'user')
            .map((m) => m.content)
            .concat(content)
            .join(';\n')
        : content;
    const waitMessage = await telegram_1.TelegramService.sendMessage(msg.from.id, '🎨 Desenhando...', {
        replyToMessageId: msg.messageId
    });
    const generatedImageUrl = await openai_1.OpenAIService.generateImage(promptContent);
    await telegram_1.TelegramService.bot.deleteMessage(msg.from.id, waitMessage.message_id);
    const response = 'Aqui está a imagem gerada com base nas suas instruções. Se quiser outra imagem com base no mesmo contexto, basta responder à esta mensagem com instruções adicionais.';
    const sentMessage = await telegram_1.TelegramService.sendPhoto(msg.from.id, generatedImageUrl, {
        caption: response,
        replyToMessageId: msg.messageId
    });
    return {
        content: response,
        imageUrl: generatedImageUrl,
        telegramMessageId: sentMessage.message_id
    };
}
async function handleChatInteraction(msg, _contextId, _userMessageId, content, imageUrl, modelName, previousMessageId) {
    let messages = [];
    if (previousMessageId) {
        const { messages: historyMessages, modelName: historyModelName } = await repositories_1.MessageRepository.getMessageHistory(previousMessageId);
        try {
            messages = messageFormatUtils_1.MessageFormatUtils.convertToOpenRouterFormat(historyMessages);
        }
        catch (error) {
            if (error instanceof messageFormatUtils_1.MessageFormatError) {
                console.error(messageFormatUtils_1.MessageFormatUtils.formatError(error));
            }
            throw error;
        }
        modelName = historyModelName;
    }
    try {
        messages.push(messageFormatUtils_1.MessageFormatUtils.createOpenRouterMessage(content, imageUrl));
    }
    catch (error) {
        if (error instanceof messageFormatUtils_1.MessageFormatError) {
            console.error(messageFormatUtils_1.MessageFormatUtils.formatError(error));
        }
        throw error;
    }
    const response = imageUrl
        ? await openRouter_1.OpenRouterService.vision(messages, modelName)
        : await openRouter_1.OpenRouterService.chat(messages, modelName);
    const sentMessage = await telegram_1.TelegramService.sendMessage(msg.from.id, response, {
        replyToMessageId: msg.messageId
    });
    return {
        content: response,
        telegramMessageId: sentMessage.message_id
    };
}
async function createMessage(contextId, content, role, telegramMessageId, replyToId, imageUrl, pdfUrl) {
    return repositories_1.MessageRepository.create({
        contextId,
        content,
        role,
        imageUrl,
        pdfUrl,
        replyToId,
        telegramMessageId
    });
}
async function handleDocumentInteraction(msg, _contextId, _userMessageId, content, pdfUrl, filename, modelName, previousMessageId) {
    let messages = [];
    if (previousMessageId) {
        const { messages: historyMessages, modelName: historyModelName } = await repositories_1.MessageRepository.getMessageHistory(previousMessageId);
        try {
            messages = messageFormatUtils_1.MessageFormatUtils.convertToOpenRouterFormat(historyMessages);
        }
        catch (error) {
            if (error instanceof messageFormatUtils_1.MessageFormatError) {
                console.error(messageFormatUtils_1.MessageFormatUtils.formatError(error));
            }
            throw error;
        }
        modelName = historyModelName;
    }
    try {
        messages.push(messageFormatUtils_1.MessageFormatUtils.createOpenRouterMessage(content, undefined, pdfUrl, filename));
    }
    catch (error) {
        if (error instanceof messageFormatUtils_1.MessageFormatError) {
            console.error(messageFormatUtils_1.MessageFormatUtils.formatError(error));
        }
        throw error;
    }
    const response = await openRouter_1.OpenRouterService.document(messages, modelName);
    const sentMessage = await telegram_1.TelegramService.sendMessage(msg.from.id, response, {
        replyToMessageId: msg.messageId
    });
    return {
        content: response,
        pdfUrl,
        telegramMessageId: sentMessage.message_id
    };
}
//# sourceMappingURL=messageHandlerUtils.js.map