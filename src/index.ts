import { TelegramService } from './services/telegram'
import { commands } from './handlers/commands'
import { MessageHandler } from './handlers/messages'

async function setupBot() {
  try {
    // Registra os comandos no Telegram
    await TelegramService.setCommands(
      commands.map(({ command, description }) => ({
        command,
        description
      }))
    )

    // Configura os handlers de comando
    for (const { command, handler } of commands) {
      TelegramService.bot.onText(new RegExp(`^/${command}`), async (msg) => {
        try {
          await handler({
            messageId: msg.message_id,
            from: {
              id: msg.from?.id.toString() || '',
              username: msg.from?.username
            },
            text: msg.text
          })
        } catch (error) {
          console.error(`Error handling /${command} command:`, error)
        }
      })
    }

    // Configura o handler de mensagens
    TelegramService.onMessage(MessageHandler.handleMessage)

    console.log('IAsmin iniciada com sucesso!')
  } catch (error) {
    console.error('Error setting up bot:', error)
    process.exit(1)
  }
}

async function main() {
  try {
    await setupBot()
  } catch (error) {
    console.error('Error starting application:', error)
    process.exit(1)
  }
}

main()
