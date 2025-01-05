import { config } from '../config'
import {
  checkDatabaseExists,
  createDatabase,
  applyMigrations,
  DatabaseError,
  formatDatabaseError
} from './databaseUtils'

/**
 * Initializes the database by creating it if it doesn't exist and applying migrations
 */
export async function initializeDatabase(): Promise<void> {
  const databaseUrl = config.database.url

  try {
    // Check if database exists
    const exists = await checkDatabaseExists(databaseUrl)

    // Create database if it doesn't exist
    if (!exists) {
      console.log('Database does not exist. Creating...')
      await createDatabase(databaseUrl)
      console.log('Database created successfully')
    }

    // Apply migrations
    console.log('Applying migrations...')
    await applyMigrations()
    console.log('Migrations applied successfully')
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error(formatDatabaseError(error))
    } else {
      console.error('Unexpected error during database initialization:', error)
    }
    throw error
  }
}
