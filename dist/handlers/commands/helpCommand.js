"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpCommand = void 0;
const telegram_1 = require("../../services/telegram");
exports.helpCommand = {
    command: 'help',
    description: 'Mostrar ajuda sobre os comandos',
    handler: async (msg) => {
        const helpText = `
Comandos disponíveis:

/start - Iniciar o bot e registrar usuário
/model - Escolher ou visualizar o modelo atual
/help - Mostrar esta mensagem de ajuda
/generate - Iniciar geração de imagem com DALL-E

Para conversar, simplesmente envie uma mensagem.
Para continuar um contexto, responda a uma mensagem anterior.
Para incluir uma imagem na conversa, envie a imagem com uma descrição.
Para gerar uma imagem, use /generate e descreva a imagem desejada.

Seu ID: ${msg.from.id}
    `.trim();
        await telegram_1.TelegramService.sendMessage(msg.from.id, helpText);
    }
};
//# sourceMappingURL=helpCommand.js.map