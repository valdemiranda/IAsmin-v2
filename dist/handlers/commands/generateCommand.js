"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommand = void 0;
const telegram_1 = require("../../services/telegram");
const repositories_1 = require("../../repositories");
const commandUtils_1 = require("../commandUtils");
exports.generateCommand = {
    command: 'generate',
    description: 'Iniciar geração de imagem',
    handler: async (msg) => {
        try {
            const userId = msg.from.id.toString();
            if (!(await (0, commandUtils_1.checkAuthorization)(userId))) {
                return;
            }
            const modelCheck = await (0, commandUtils_1.checkModelAvailability)(userId);
            if (!modelCheck.success) {
                return;
            }
            const context = await repositories_1.ContextRepository.create({
                userId,
                modelId: modelCheck.model.id,
                type: 'image'
            });
            const msgResp = '🎨 Iniciando contexto de geração de imagem.\nDescreva a imagem que você gostaria que eu gerasse em resposta à esta mensagem.';
            const sentMessage = await telegram_1.TelegramService.sendMessage(userId, msgResp);
            await repositories_1.MessageRepository.create({
                contextId: context.id,
                content: msgResp,
                role: 'assistant',
                telegramMessageId: sentMessage.message_id
            });
        }
        catch (error) {
            await (0, commandUtils_1.handleCommandError)(error, msg.from.id.toString(), 'generate', 'Desculpe, ocorreu um erro ao iniciar o contexto de geração de imagem.');
        }
    }
};
//# sourceMappingURL=generateCommand.js.map