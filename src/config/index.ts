import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { validateEnvVars, createConfig, RequiredEnvVars } from './configUtils'

// Load environment variables
dotenv.config()

// Validate required environment variables
const requiredEnvVars: RequiredEnvVars[] = ['DATABASE_URL', 'TELEGRAM_BOT_TOKEN', 'OPENROUTER_API_KEY']
validateEnvVars(requiredEnvVars)

// Create and validate configuration
export const config = createConfig()

// Initialize database connection
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url
    }
  }
})

// Ensure proper cleanup on application shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

// Handle uncaught errors to ensure database connection is properly closed
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error)
  await prisma.$disconnect()
  process.exit(1)
})

process.on('unhandledRejection', async (error) => {
  console.error('Unhandled Rejection:', error)
  await prisma.$disconnect()
  process.exit(1)
})
