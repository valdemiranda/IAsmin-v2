import { PrismaClient } from '@prisma/client'

/**
 * Handles default model selection for a user
 * If the specified default model is not found, it will try to use the first available model
 */
export async function handleDefaultModel(
  prisma: PrismaClient,
  userId: string,
  defaultModelName: string = 'google/gemini-pro-1.5'
) {
  // Try to find the specified default model
  const defaultModel = await prisma.model.findFirst({
    where: { name: defaultModelName }
  })

  if (defaultModel) {
    await prisma.user.update({
      where: { id: userId },
      data: { defaultModelId: defaultModel.id }
    })
    return defaultModel
  }

  // If default model not found, get first available
  const firstModel = await prisma.model.findFirst({
    orderBy: { name: 'asc' }
  })

  if (firstModel) {
    await prisma.user.update({
      where: { id: userId },
      data: { defaultModelId: firstModel.id }
    })
  }

  return firstModel
}
