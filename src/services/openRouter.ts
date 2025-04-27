import { config } from '../config'
import { OpenRouterMessage } from '../types'
import { makeOpenRouterRequest } from './aiUtils'

export const OpenRouterService = {
  chat: async (messages: OpenRouterMessage[], model: string): Promise<string> => {
    return makeOpenRouterRequest(config.openRouter.baseUrl, config.openRouter.apiKey, messages, model, 'chat')
  },

  vision: async (messages: OpenRouterMessage[], model: string): Promise<string> => {
    return makeOpenRouterRequest(
      config.openRouter.baseUrl,
      config.openRouter.apiKey,
      messages,
      model,
      'vision'
    )
  },

  /**
   * Process PDF documents using the OpenRouter API
   * @param messages OpenRouter formatted messages, including PDF file content
   * @param model Model to use for processing
   * @returns Promise with the AI response
   */
  document: async (messages: OpenRouterMessage[], model: string): Promise<string> => {
    return makeOpenRouterRequest(
      config.openRouter.baseUrl,
      config.openRouter.apiKey,
      messages,
      model,
      'document'
    )
  }
}
