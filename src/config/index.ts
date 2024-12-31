import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const requiredEnvVars = ['DATABASE_URL', 'TELEGRAM_BOT_TOKEN', 'OPENROUTER_API_KEY'] as const

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

export const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN as string
  },
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY as string,
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-pro-1.5'
  },
  database: {
    url: process.env.DATABASE_URL as string
  }
} as const

// Singleton instance of PrismaClient
export const prisma = new PrismaClient()

// Ensure proper cleanup on application shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
