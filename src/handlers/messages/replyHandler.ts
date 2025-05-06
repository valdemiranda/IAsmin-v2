import { TelegramMessage } from '../../types'
import { TelegramService } from '../../services/telegram'
import { MessageRepository } from '../../repositories'
import { MessageFormatUtils } from './messageFormatUtils'
import { OpenAIService } from '../../services/openai'
import {
  handleImageGeneration,
  handleImageAnalysis,
  handleChatInteraction,
  handleDocumentInteraction,
  createMessage
} from './messageHandlerUtils'
import { downloadImage, hasAssistantGeneratedImages } from '../../utils/imageUtils'

// Handle replies to existing messages
export async function handleReplyMessage(msg: TelegramMessage): Promise<void> {
  const previousMessage = await MessageRepository.findByTelegramMessageId(msg.reply_to_message!.message_id)

  if (!previousMessage || !previousMessage.context) {
    await TelegramService.sendMessage(msg.from.id, 'Não foi possível encontrar o contexto desta mensagem.')
    return
  }

  const context = previousMessage.context
  const { content, imageUrl, pdfUrl, filename } = await MessageFormatUtils.extractMessageContent(msg)

  // Save user message
  const userMessage = await createMessage(
    context.id,
    content,
    'user',
    msg.messageId,
    previousMessage.id,
    imageUrl,
    pdfUrl
  )

  // Handle message based on content
  if (context.type === 'image') {
    // Continue image context
    const previousMessages = await MessageRepository.findByContextId(context.id)

    // Se uma imagem foi enviada, precisamos decidir entre análise ou edição
    if (imageUrl) {
      // Obter o modelo associado ao contexto
      const modelName = context.model.name

      // Verificar se há imagens anteriores geradas pelo assistente
      const hasAssistantImages = hasAssistantGeneratedImages(previousMessages)

      // Se a mensagem anterior contém uma imagem gerada pelo assistente e estamos em um contexto de imagem,
      // devemos editar a imagem em vez de analisá-la
      if (hasAssistantImages && msg.reply_to_message) {
        // Verificar se a mensagem que está sendo respondida é do assistente e tem uma imagem
        const repliedToMessage = previousMessages.find(
          (m) =>
            m.telegramMessageId === msg.reply_to_message!.message_id && m.role === 'assistant' && m.imageUrl
        )

        if (repliedToMessage && repliedToMessage.imageUrl) {
          // Baixar a imagem que está sendo respondida
          const imageBuffer = await downloadImage(repliedToMessage.imageUrl)

          // Enviar mensagem de espera
          const waitMessage = await TelegramService.sendMessage(msg.from.id, '🎨 Editando imagem...', {
            replyToMessageId: msg.messageId
          })

          try {
            // Editar a imagem existente
            const imageBase64 = await OpenAIService.editImage(imageBuffer, content)

            // Converter base64 para buffer
            const newImageBuffer = Buffer.from(imageBase64, 'base64')

            // Remover mensagem de espera
            await TelegramService.bot.deleteMessage(msg.from.id, waitMessage.message_id)

            // Enviar resposta com a imagem editada
            const response =
              'Aqui está a imagem editada com base nas suas instruções. Se quiser continuar editando, basta responder à esta mensagem com instruções adicionais.'
            const sentMessage = await TelegramService.sendPhotoBuffer(msg.from.id, newImageBuffer, {
              caption: response,
              replyToMessageId: msg.messageId
            })

            // Construir URI de dados para armazenamento
            const imageDataUri = `data:image/png;base64,${imageBase64}`

            // Salvar mensagem
            await createMessage(
              context.id,
              response,
              'assistant',
              sentMessage.message_id,
              userMessage.id,
              imageDataUri
            )

            return
          } catch (error) {
            console.error('Erro ao editar imagem:', error)

            // Em caso de erro, remover mensagem de espera
            try {
              await TelegramService.bot.deleteMessage(msg.from.id, waitMessage.message_id)
            } catch (deleteError) {
              console.error('Erro ao deletar mensagem de espera:', deleteError)
            }

            // Enviar mensagem de erro
            const errorMessage = 'Desculpe, ocorreu um erro ao editar a imagem. Por favor, tente novamente.'
            const sentMessage = await TelegramService.sendMessage(msg.from.id, errorMessage, {
              replyToMessageId: msg.messageId
            })

            // Salvar mensagem de erro
            await createMessage(context.id, errorMessage, 'assistant', sentMessage.message_id, userMessage.id)

            return
          }
        }
      }

      // Se não estamos editando uma imagem, analisamos a imagem com o histórico completo de mensagens
      const result = await handleImageAnalysis(
        msg,
        context.id,
        userMessage.id,
        content,
        imageUrl,
        modelName,
        previousMessages
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
      // Se não há imagem, continuamos com a geração de imagem normal
      const result = await handleImageGeneration(msg, context.id, userMessage.id, content, previousMessages)
      await createMessage(
        context.id,
        result.content,
        'assistant',
        result.telegramMessageId,
        userMessage.id,
        result.imageUrl
      )
    }
  } else if (context.type === 'document' && pdfUrl && filename) {
    // Continue PDF document analysis in document context
    const result = await handleDocumentInteraction(
      msg,
      context.id,
      userMessage.id,
      content,
      pdfUrl,
      filename,
      undefined,
      previousMessage.id
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
  } else if (pdfUrl && filename) {
    // New PDF document in a chat context - handle it appropriately
    const result = await handleDocumentInteraction(
      msg,
      context.id,
      userMessage.id,
      content,
      pdfUrl,
      filename,
      undefined,
      previousMessage.id
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
    // Regular chat message
    const result = await handleChatInteraction(
      msg,
      context.id,
      userMessage.id,
      content,
      imageUrl,
      undefined,
      previousMessage.id
    )
    await createMessage(context.id, result.content, 'assistant', result.telegramMessageId, userMessage.id)
  }
}
