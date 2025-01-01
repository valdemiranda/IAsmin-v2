import { config } from '../config'
import { OpenRouterMessage, OpenRouterResponse } from '../types'

const isOpenRouterResponse = (data: unknown): data is OpenRouterResponse => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'choices' in data &&
    Array.isArray((data as OpenRouterResponse).choices)
  )
}

const createSystemInstructions = (model: string) => `
  - If the user asks you to introduce yourself, your name is IAsmin and you are a personal assistant bot on Telegram created by Valdecir with the help of ${model}.
  - If the request is related to generating an image, please note that this mode cannot generate images, so the image generation mode must be started via the menu.
`

const addSystemInstructions = (messages: OpenRouterMessage[], model: string): OpenRouterMessage[] => {
  const systemMessage: OpenRouterMessage = {
    role: 'system',
    content: createSystemInstructions(model)
  }

  return [systemMessage, ...messages]
}

const formatResponse = (content: string | undefined, finishReason: string | undefined): string => {
  if (!content) return 'Desculpe, não consegui processar sua mensagem.'

  if (finishReason === 'length') {
    return `${content} *(...)*`
  }

  return content
}

const fetchOptions = {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${config.openRouter.apiKey}`,
    'Content-Type': 'application/json',
    'X-Title': 'IAsmin v2'
  }
}

export const OpenRouterService = {
  chat: async (messages: OpenRouterMessage[], model: string) => {
    try {
      const response = await fetch(`${config.openRouter.baseUrl}/chat/completions`, {
        ...fetchOptions,
        body: JSON.stringify({
          model,
          messages: addSystemInstructions(messages, model),
          stream: false,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!isOpenRouterResponse(data)) {
        throw new Error('Resposta inválida da OpenRouter API')
      }
      const choice = data.choices[0]
      const content = choice?.message?.content
      const finishReason = choice?.finish_reason
      return formatResponse(content, finishReason)
    } catch (error) {
      console.error('OpenRouter API error:', error)
      throw new Error('Erro ao processar a mensagem com a OpenRouter API')
    }
  },

  vision: async (messages: OpenRouterMessage[], model: string) => {
    try {
      const response = await fetch(`${config.openRouter.baseUrl}/chat/completions`, {
        ...fetchOptions,
        body: JSON.stringify({
          model,
          messages: addSystemInstructions(messages, model),
          stream: false,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!isOpenRouterResponse(data)) {
        throw new Error('Resposta inválida da OpenRouter API')
      }
      const choice = data.choices[0]
      const content = choice?.message?.content
      const finishReason = choice?.finish_reason
      return formatResponse(content, finishReason)
    } catch (error) {
      console.error('OpenRouter Vision API error:', error)
      throw new Error('Erro ao processar a imagem com a OpenRouter API')
    }
  }
}
