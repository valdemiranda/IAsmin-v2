import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { ContextRepository, ModelRepository } from '../../repositories'
import { MessageFormatUtils } from './messageFormatUtils'
import {
  handleImageGeneration,
  handleImageAnalysis,
  handleChatInteraction,
  handleDocumentInteraction,
  createMessage
} from './messageHandlerUtils'

// Handle creation of new message contexts
export async function handleNewContext(msg: TelegramMessage): Promise<void> {
  const telegramId = msg.from.id
  const userId = telegramId.toString()
  const userModel = await ModelRepository.getUserDefaultOrFirst(userId)

  if (!userModel) {
    await TelegramService.sendMessage(
      telegramId,
      'Nenhum modelo disponível. Por favor, contate um administrador.'
    )
    return
  }

  const { content, imageUrl, pdfUrl, filename } = await MessageFormatUtils.extractMessageContent(msg)

  // Determine context type based on message content
  let contextType = 'chat'

  if (pdfUrl && filename) {
    contextType = 'document'
  } else if (msg.photo) {
    contextType = 'image'
  }

  const context = await ContextRepository.create({ userId, modelId: userModel.id, type: contextType })
  await sendContextStartMessage(telegramId, userModel.name, contextType)

  // Save user message
  const userMessage = await createMessage(
    context.id,
    content,
    'user',
    msg.messageId,
    undefined,
    imageUrl,
    pdfUrl
  )

  // Handle context based on type
  if (contextType === 'image') {
    // Se o contexto é de imagem e uma imagem foi enviada, usamos a função de análise de imagem
    if (imageUrl) {
      const result = await handleImageAnalysis(
        msg,
        context.id,
        userMessage.id,
        content,
        imageUrl,
        userModel.name
      )

      await createMessage(
        context.id,
        result.content,
        'assistant',
        result.telegramMessageId,
        userMessage.id,
        result.imageUrl
      )
    } else {
      // Se não há imagem, usamos a geração de imagem normal
      const result = await handleImageGeneration(msg, context.id, userMessage.id, content)
      await createMessage(
        context.id,
        result.content,
        'assistant',
        result.telegramMessageId,
        userMessage.id,
        result.imageUrl
      )
    }
  } else if (contextType === 'document') {
    // Handle PDF document context
    const result = await handleDocumentInteraction(
      msg,
      context.id,
      userMessage.id,
      content,
      pdfUrl!,
      filename!,
      userModel.name
    )
    await createMessage(
      context.id,
      result.content,
      'assistant',
      result.telegramMessageId,
      userMessage.id,
      undefined,
      result.pdfUrl
    )
  } else {
    // Handle regular chat context
    const result = await handleChatInteraction(
      msg,
      context.id,
      userMessage.id,
      content,
      imageUrl,
      userModel.name
    )
    await createMessage(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id)
  }
}

/**
 * Sends context start message
 */
async function sendContextStartMessage(
  telegramId: number,
  modelName: string,
  contextType: string = 'chat'
): Promise<void> {
  let startMessage = `Iniciando nova conversa com ${modelName}.`

  if (contextType === 'image') {
    startMessage = `Iniciando contexto de imagem com ${modelName}. Você pode enviar imagens para análise, solicitar a geração de novas imagens ou editar imagens já geradas.`
  } else if (contextType === 'document') {
    startMessage = `Analisando documento PDF com ${modelName}.`
  }

  await TelegramService.sendMessage(telegramId, startMessage)
}
