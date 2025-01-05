import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'

// Handles the /help command which shows available commands and usage instructions
export const helpCommand = {
  command: 'help',
  description: 'Mostrar ajuda sobre os comandos',
  handler: async (msg: TelegramMessage) => {
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
    `.trim()

    await TelegramService.sendMessage(msg.from.id, helpText)
  }
}
