import { TelegramService } from '../services/telegram'
import { commands } from '../handlers/commands'
import { MessageHandler } from '../handlers/messages'
//import { initializeDatabase } from '../database/initialize'
import { TelegramMessage } from '../types'
import { prisma } from '../config'

/**
 * Error types for application operations
 */
export enum AppErrorType {
  DATABASE = 'DATABASE',
  BOT_SETUP = 'BOT_SETUP',
  COMMAND = 'COMMAND'
}

/**
 * Custom error class for application operations
 */
export class AppError extends Error {
  constructor(public type: AppErrorType, message: string, public originalError?: unknown) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Format application error messages
 */
export function formatAppError(error: AppError): string {
  let message = `Application Error (${error.type}): ${error.message}`
  if (error.originalError instanceof Error) {
    message += `\nCause: ${error.originalError.message}`
  }
  return message
}

/**
 * Maps raw Telegram message to our TelegramMessage type
 */
function mapToTelegramMessage(msg: any): TelegramMessage {
  return {
    messageId: msg.message_id,
    from: {
      id: msg.from?.id || 0,
      username: msg.from?.username
    },
    text: msg.text,
    caption: msg.caption,
    photo: msg.photo,
    reply_to_message: msg.reply_to_message ? { message_id: msg.reply_to_message.message_id } : undefined,
    document: msg.document
      ? {
          file_id: msg.document.file_id,
          file_name: msg.document.file_name,
          mime_type: msg.document.mime_type
        }
      : undefined
  }
}

/**
 * Sets up Telegram bot commands and handlers
 */
async function setupBot(): Promise<void> {
  try {
    // Register commands with Telegram
    await TelegramService.setCommands(
      commands.map(({ command, description }) => ({
        command,
        description
      }))
    )

    // Set up command handlers
    for (const { command, handler } of commands) {
      TelegramService.bot.onText(new RegExp(`^/${command}`), async (msg) => {
        try {
          await handler(mapToTelegramMessage(msg))
        } catch (error) {
          const appError = new AppError(AppErrorType.COMMAND, `Error handling /${command} command`, error)
          console.error(formatAppError(appError))
        }
      })
    }

    // Set up message handler
    TelegramService.onMessage(MessageHandler.handleMessage)

    console.log('IAsmin iniciada com sucesso!')
  } catch (error) {
    throw new AppError(AppErrorType.BOT_SETUP, 'Failed to set up bot', error)
  }
}

/**
 * Performs cleanup operations before shutdown
 */
async function cleanup(): Promise<void> {
  try {
    await prisma.$disconnect()
    await TelegramService.bot.close()
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
}

/**
 * Initializes the application
 */
export async function initializeApp(): Promise<void> {
  try {
    //    console.log('Inicializando banco de dados...')
    //    await initializeDatabase()

    console.log('Configurando bot...')
    await setupBot()

    // Set up cleanup handlers
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT. Cleaning up...')
      await cleanup()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM. Cleaning up...')
      await cleanup()
      process.exit(0)
    })

    // Handle uncaught errors
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught Exception:', error)
      await cleanup()
      process.exit(1)
    })

    process.on('unhandledRejection', async (error) => {
      console.error('Unhandled Rejection:', error)
      await cleanup()
      process.exit(1)
    })
  } catch (error) {
    if (error instanceof AppError) {
      console.error(formatAppError(error))
    } else {
      console.error('Error starting application:', error)
    }
    process.exit(1)
  }
}
