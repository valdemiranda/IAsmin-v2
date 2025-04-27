"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = void 0;
const telegram_1 = require("../../services/telegram");
const repositories_1 = require("../../repositories");
const commandUtils_1 = require("../commandUtils");
exports.startCommand = {
    command: 'start',
    description: 'Iniciar o bot',
    handler: async (msg) => {
        try {
            const userId = msg.from.id.toString();
            const user = await repositories_1.UserRepository.findOrCreate({ id: userId, username: msg.from.username });
            const welcomeMessage = user.authorized
                ? `Bem-vindo de volta! Você está autorizado e pode começar a conversar comigo.\nSeu ID: ${userId}`
                : `Olá! Seu cadastro foi realizado com o ID: ${userId}\nVocê precisa de autorização para interagir comigo. Por favor, aguarde a aprovação de um administrador.`;
            await telegram_1.TelegramService.sendMessage(userId, welcomeMessage);
            if (!user.authorized) {
                console.log(`Novo usuário registrado - ID: ${userId}, Username: ${msg.from.username || 'não informado'}`);
            }
        }
        catch (error) {
            await (0, commandUtils_1.handleCommandError)(error, msg.from.id.toString(), 'start', 'Desculpe, ocorreu um erro ao processar seu cadastro. Tente novamente mais tarde.');
        }
    }
};
//# sourceMappingURL=startCommand.js.map