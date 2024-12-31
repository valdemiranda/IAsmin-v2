import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Checks if the database exists by attempting to connect
 * @param url Database URL
 * @returns True if database exists, false otherwise
 */
const checkDatabaseExists = async (url: string): Promise<boolean> => {
  const client = new PrismaClient({ datasourceUrl: url })
  try {
    await client.$connect()
    await client.$disconnect()
    return true
  } catch (error) {
    return false
  }
}

/**
 * Extracts database name from connection URL
 * @param url Database URL
 * @returns Database name
 */
const getDatabaseName = (url: string): string => {
  const matches = url.match(/\/([^/?]+)(\?|$)/)
  if (!matches) throw new Error('Invalid database URL format')
  return matches[1]
}

/**
 * Creates a new database
 * @param url Database URL
 */
const createDatabase = async (url: string): Promise<void> => {
  const dbName = getDatabaseName(url)
  const baseUrl = url.replace(`/${dbName}`, '/postgres')

  const client = new PrismaClient({ datasourceUrl: baseUrl })
  try {
    await client.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`)
  } finally {
    await client.$disconnect()
  }
}

/**
 * Applies all pending migrations
 */
const applyMigrations = async (): Promise<void> => {
  await execAsync('npx prisma migrate deploy')
}

/**
 * Initializes the database by creating it if it doesn't exist and applying migrations
 */
export const initializeDatabase = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  try {
    const exists = await checkDatabaseExists(databaseUrl)

    if (!exists) {
      console.log('Database does not exist. Creating...')
      await createDatabase(databaseUrl)
      console.log('Database created successfully')
    }

    console.log('Applying migrations...')
    await applyMigrations()
    console.log('Migrations applied successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}
