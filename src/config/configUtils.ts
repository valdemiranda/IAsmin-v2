/**
 * Type for environment variables
 */
export type RequiredEnvVars = 'DATABASE_URL' | 'TELEGRAM_BOT_TOKEN' | 'OPENROUTER_API_KEY'

/**
 * Type for application configuration
 */
export interface AppConfig {
  telegram: {
    token: string
  }
  openRouter: {
    apiKey: string
    baseUrl: string
    defaultModel: string
  }
  database: {
    url: string
  }
}

/**
 * Validates required environment variables
 */
export function validateEnvVars(requiredVars: RequiredEnvVars[]): void {
  const missingVars = requiredVars.filter((envVar) => !process.env[envVar])
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
}

/**
 * Gets environment variable with validation
 */
export function getEnvVar(name: RequiredEnvVars): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/**
 * Creates configuration object with validation
 */
export function createConfig(): AppConfig {
  return {
    telegram: {
      token: getEnvVar('TELEGRAM_BOT_TOKEN')
    },
    openRouter: {
      apiKey: getEnvVar('OPENROUTER_API_KEY'),
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'google/gemini-pro-1.5'
    },
    database: {
      url: getEnvVar('DATABASE_URL')
    }
  }
}
