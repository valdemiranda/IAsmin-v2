"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepository = void 0;
const config_1 = require("../../config");
const errorHandler_1 = require("../utils/errorHandler");
const types_1 = require("./types");
const utils_1 = require("./utils");
exports.MessageRepository = {
    create: async (data) => {
        try {
            (0, utils_1.validateMessageData)(data);
            return await config_1.prisma.message.create({
                data,
                include: types_1.messageWithContextInclude
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('create message', error, 'Erro ao criar mensagem');
        }
    },
    findByContextId: async (contextId) => {
        try {
            return await config_1.prisma.message.findMany({
                where: { contextId },
                orderBy: { createdAt: 'asc' }
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('find messages by context', error, 'Erro ao buscar mensagens do contexto');
        }
    },
    findByTelegramMessageId: async (telegramMessageId) => {
        try {
            return await config_1.prisma.message.findFirst({
                where: { telegramMessageId },
                include: types_1.messageWithContextInclude
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('find message by telegram id', error, 'Erro ao buscar mensagem do Telegram');
        }
    },
    getMessageHistory: async (messageId) => {
        try {
            const message = await config_1.prisma.message.findUnique({
                where: { id: messageId },
                include: types_1.messageWithRepliesInclude
            });
            if (!message || !message.context) {
                throw new Error('Message or context not found');
            }
            return {
                messages: (0, utils_1.orderMessagesByConversation)(message.context.messages),
                modelName: message.context.model.name
            };
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('get message history', error, 'Erro ao buscar histórico de mensagens');
        }
    }
};
//# sourceMappingURL=repository.js.map