import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Error types for database operations
 */
export enum DatabaseErrorType {
  CONNECTION = 'CONNECTION',
  CREATION = 'CREATION',
  MIGRATION = 'MIGRATION',
  URL_PARSING = 'URL_PARSING'
}

/**
 * Custom error class for database operations
 */
export class DatabaseError extends Error {
  constructor(public type: DatabaseErrorType, message: string, public originalError?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

/**
 * Interface for database connection URL parts
 */
export interface DatabaseUrlParts {
  baseUrl: string
  databaseName: string
}

/**
 * Parses database URL into its components
 */
export function parseDatabaseUrl(url: string): DatabaseUrlParts {
  try {
    const matches = url.match(/\/([^/?]+)(\?|$)/)
    if (!matches) {
      throw new DatabaseError(DatabaseErrorType.URL_PARSING, 'Invalid database URL format')
    }
    const databaseName = matches[1]
    const baseUrl = url.replace(`/${databaseName}`, '/postgres')
    return { baseUrl, databaseName }
  } catch (error) {
    throw new DatabaseError(DatabaseErrorType.URL_PARSING, 'Failed to parse database URL', error)
  }
}

/**
 * Checks if database exists
 */
export async function checkDatabaseExists(url: string): Promise<boolean> {
  const client = new PrismaClient({ datasourceUrl: url })
  try {
    await client.$connect()
    await client.$disconnect()
    return true
  } catch (error) {
    if (error instanceof Error && error.message.includes('does not exist')) {
      return false
    }
    throw new DatabaseError(DatabaseErrorType.CONNECTION, 'Failed to check database existence', error)
  }
}

/**
 * Creates a new database
 */
export async function createDatabase(url: string): Promise<void> {
  const { baseUrl, databaseName } = parseDatabaseUrl(url)
  const client = new PrismaClient({ datasourceUrl: baseUrl })

  try {
    await client.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`)
  } catch (error) {
    throw new DatabaseError(DatabaseErrorType.CREATION, 'Failed to create database', error)
  } finally {
    await client.$disconnect()
  }
}

/**
 * Applies pending migrations
 */
export async function applyMigrations(): Promise<void> {
  try {
    await execAsync('npx prisma migrate deploy')
  } catch (error) {
    throw new DatabaseError(DatabaseErrorType.MIGRATION, 'Failed to apply migrations', error)
  }
}

/**
 * Formats database error messages
 */
export function formatDatabaseError(error: DatabaseError): string {
  let message = `Database Error (${error.type}): ${error.message}`
  if (error.originalError instanceof Error) {
    message += `\nCause: ${error.originalError.message}`
  }
  return message
}
