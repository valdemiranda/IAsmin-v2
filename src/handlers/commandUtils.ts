import { TelegramService } from '../services/telegram'
import { ModelRepository, UserRepository } from '../repositories'

/**
 * Common utility for checking user authorization
 */
export async function checkAuthorization(
  userId: string,
  errorMessage = 'Você ainda não está autorizado a usar este comando.'
): Promise<boolean> {
  const isAuthorized = await UserRepository.isAuthorized(userId)
  if (!isAuthorized) {
    await TelegramService.sendMessage(userId, errorMessage)
    return false
  }
  return true
}

/**
 * Common utility for checking model availability
 */
export async function checkModelAvailability(userId: string): Promise<{
  success: boolean
  model?: any
}> {
  const userModel = await ModelRepository.getUserDefaultOrFirst(userId)
  if (!userModel) {
    await TelegramService.sendMessage(
      userId,
      'Nenhum modelo disponível. Por favor, contate um administrador.'
    )
    return { success: false }
  }
  return { success: true, model: userModel }
}

/**
 * Common error handler for commands
 */
export async function handleCommandError(
  error: any,
  userId: string,
  commandName: string,
  customErrorMessage?: string
): Promise<void> {
  console.error(`Erro ao processar comando /${commandName}:`, error)
  await TelegramService.sendMessage(
    userId,
    customErrorMessage || 'Desculpe, ocorreu um erro ao processar seu comando. Tente novamente mais tarde.'
  )
}

/**
 * Common utility for creating model selection buttons
 */
export async function createModelButtons(userId: string): Promise<Array<Array<any>>> {
  const models = await ModelRepository.findAll()
  const currentModel = await ModelRepository.findUserDefault(userId)

  return models.map((model) => [
    {
      text: model.name + (model.id === currentModel?.id ? ' (atual)' : ''),
      callback_data: `model:${model.name}`
    }
  ])
}

/**
 * Common utility for handling model selection response
 */
export async function handleModelSelectionResponse(
  userId: string,
  modelId: string,
  currentModelId?: string
): Promise<{ success: boolean; message: string }> {
  // Check if model is already the default
  if (currentModelId === modelId) {
    return {
      success: false,
      message: 'Este já é o seu modelo atual.'
    }
  }

  await ModelRepository.setUserDefault({ userId, modelId })
  return {
    success: true,
    message: `Seu modelo foi alterado com sucesso.`
  }
}
