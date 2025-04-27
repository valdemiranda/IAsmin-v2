"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const telegram_1 = require("../../services/telegram");
const repositories_1 = require("../../repositories");
const contextHandler_1 = require("./contextHandler");
const replyHandler_1 = require("./replyHandler");
exports.MessageHandler = {
    handleMessage: async (msg) => {
        var _a;
        try {
            if ((_a = msg.text) === null || _a === void 0 ? void 0 : _a.startsWith('/')) {
                return;
            }
            if (!msg.text && !msg.photo && !msg.document) {
                return;
            }
            if (msg.document && msg.document.mime_type !== 'application/pdf') {
                await telegram_1.TelegramService.sendMessage(msg.from.id, 'Desculpe, no momento só consigo processar arquivos no formato PDF.');
                return;
            }
            const userId = msg.from.id.toString();
            const user = await repositories_1.UserRepository.findOrCreate({ id: userId, username: msg.from.username });
            if (!user.authorized) {
                await telegram_1.TelegramService.sendMessage(msg.from.id, 'Você ainda não está autorizado a interagir comigo. Use /start para ver seu ID e aguarde a aprovação de um administrador.');
                console.log(`Tentativa de interação de usuário não autorizado - ID: ${userId}, Username: ${msg.from.username || 'não informado'}`);
                return;
            }
            if (msg.reply_to_message) {
                await (0, replyHandler_1.handleReplyMessage)(msg);
            }
            else {
                await (0, contextHandler_1.handleNewContext)(msg);
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
            await telegram_1.TelegramService.sendMessage(msg.from.id, 'Desculpe, ocorreu um erro ao processar sua mensagem.');
        }
    }
};
//# sourceMappingURL=index.js.map