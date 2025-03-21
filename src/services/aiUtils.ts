import { OpenRouterMessage, OpenRouterResponse } from '../types'

/**
 * Common error handler for AI service operations
 */
export async function handleAIError(
  service: string,
  operation: string,
  error: any,
  defaultMessage: string
): Promise<never> {
  console.error(`${service} ${operation} error:`, error)
  throw new Error(defaultMessage)
}

/**
 * Type guard for OpenRouter API responses
 */
export function isOpenRouterResponse(data: unknown): data is OpenRouterResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'choices' in data &&
    Array.isArray((data as OpenRouterResponse).choices)
  )
}

/**
 * Format OpenRouter response with consistent handling
 */
export function formatOpenRouterResponse(
  content: string | undefined,
  finishReason: string | undefined
): string {
  if (!content) return 'Desculpe, não consegui processar sua mensagem.'

  if (finishReason?.toLocaleLowerCase() !== 'stop') {
    return `${content} **(...)**`
  }

  return content
}

/**
 * Create system instructions for OpenRouter
 */
export function createSystemInstructions(model: string): string {
  return `
  - If the user asks you to introduce yourself, your name is IAsmin and you are a personal assistant bot on Telegram created by Valdecir with the help of **${model}**.
  - If the request is related to generating an image, please note that this mode cannot generate images, but the user can call the /generate command for this purpose.
  `
}

/**
 * Add system instructions to messages array
 */
export function addSystemInstructions(messages: OpenRouterMessage[], model: string): OpenRouterMessage[] {
  const systemMessage: OpenRouterMessage = {
    role: 'system',
    content: createSystemInstructions(model)
  }

  return [systemMessage, ...messages]
}

/**
 * Common fetch options builder for OpenRouter API
 */
export function buildOpenRouterFetchOptions(apiKey: string, body: any) {
  return {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'IAsmin v2'
    },
    body: JSON.stringify(body)
  }
}

/**
 * Common OpenRouter API request handler
 */
export async function makeOpenRouterRequest(
  baseUrl: string,
  apiKey: string,
  messages: OpenRouterMessage[],
  model: string,
  operation: string
): Promise<string> {
  try {
    const options = buildOpenRouterFetchOptions(apiKey, {
      model,
      messages: addSystemInstructions(messages, model),
      stream: false,
      max_tokens: 900
    })

    const response = await fetch(`${baseUrl}/chat/completions`, options)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (!isOpenRouterResponse(data)) {
      throw new Error('Resposta inválida da OpenRouter API')
    }

    const choice = data.choices[0]
    return formatOpenRouterResponse(choice?.message?.content, choice?.finish_reason)
  } catch (error) {
    return handleAIError(
      'OpenRouter',
      operation,
      error,
      `Erro ao processar ${operation} com a OpenRouter API`
    )
  }
}
