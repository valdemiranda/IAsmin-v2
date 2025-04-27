import OpenAI from 'openai'
import { handleAIError } from './aiUtils'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const OpenAIService = {
  /**
   * Generates an image using DALL-E 3
   * @param prompt Text prompt for image generation
   * @returns Base64 encoded string of the generated image
   */
  generateImage: async (prompt: string): Promise<string> => {
    try {
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        moderation: 'low',
        output_format: 'png',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'high'
        // response_format: 'b64_json'
      })

      if (!response.data || !response.data[0] || !response.data[0].b64_json) {
        throw new Error('Dados base64 da imagem não encontrados na resposta')
      }
      return response.data[0].b64_json
    } catch (error) {
      return handleAIError(
        'OpenAI',
        'generate image',
        error,
        'Falha ao gerar imagem. Por favor, tente novamente.'
      )
    }
  }
}
