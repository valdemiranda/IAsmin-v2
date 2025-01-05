import { Prisma } from '@prisma/client'

/**
 * Common error handler for repository operations
 * Handles specific Prisma errors and provides meaningful error messages
 */
export async function handleRepositoryError(
  operation: string,
  error: any,
  defaultMessage: string
): Promise<never> {
  console.error(`Repository ${operation} error:`, error)

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    switch (error.code) {
      case 'P2002':
        throw new Error('Registro duplicado encontrado.')
      case 'P2025':
        throw new Error('Registro não encontrado.')
      default:
        throw new Error(defaultMessage)
    }
  }

  throw new Error(defaultMessage)
}
