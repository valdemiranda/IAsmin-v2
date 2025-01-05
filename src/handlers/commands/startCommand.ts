import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { UserRepository } from '../../repositories'
import { handleCommandError } from '../commandUtils'

// Handles the /start command which registers new users and shows welcome message
export const startCommand = {
  command: 'start',
  description: 'Iniciar o bot',
  handler: async (msg: TelegramMessage) => {
    try {
      const userId = msg.from.id.toString()
      const user = await UserRepository.findOrCreate({ id: userId, username: msg.from.username })

      const welcomeMessage = user.authorized
        ? `Bem-vindo de volta! Você está autorizado e pode começar a conversar comigo.\nSeu ID: ${userId}`
        : `Olá! Seu cadastro foi realizado com o ID: ${userId}\nVocê precisa de autorização para interagir comigo. Por favor, aguarde a aprovação de um administrador.`

      await TelegramService.sendMessage(userId, welcomeMessage)

      if (!user.authorized) {
        console.log(
          `Novo usuário registrado - ID: ${userId}, Username: ${msg.from.username || 'não informado'}`
        )
      }
    } catch (error) {
      await handleCommandError(
        error,
        msg.from.id.toString(),
        'start',
        'Desculpe, ocorreu um erro ao processar seu cadastro. Tente novamente mais tarde.'
      )
    }
  }
}
