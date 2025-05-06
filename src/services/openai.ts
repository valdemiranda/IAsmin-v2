import OpenAI, { toFile } from 'openai'
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
  },

  /**
   * Edits an existing image using DALL-E 3
   * @param imageBuffer Buffer containing the image to edit
   * @param prompt Text prompt for image editing
   * @returns Base64 encoded string of the edited image
   */
  editImage: async (imageBuffer: Buffer, prompt: string): Promise<string> => {
    try {
      // Create a mask that covers the entire image (transparent PNG)
      // This allows DALL-E to edit the entire image based on the prompt
      //const maskBuffer = Buffer.from(
      //  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      //  'base64'
      //)

      // Converte o buffer da imagem para um formato que a API da OpenAI aceita
      // O segundo parâmetro (null) permite que a biblioteca determine automaticamente o nome do arquivo
      // O terceiro parâmetro especifica o tipo MIME da imagem como PNG
      const imageFile = await toFile(imageBuffer, null, { type: 'image/png' })
      const response = await openai.images.edit({
        image: imageFile, // Usa o arquivo convertido
        // image: imageBuffer, // Não usar diretamente o buffer
        //mask: maskBuffer,
        model: 'gpt-image-1',
        quality: 'high',
        prompt,
        n: 1,
        size: '1024x1024'
      })

      if (!response.data || !response.data[0] || !response.data[0].b64_json) {
        throw new Error('Dados base64 da imagem editada não encontrados na resposta')
      }
      return response.data[0].b64_json
    } catch (error) {
      return handleAIError(
        'OpenAI',
        'edit image',
        error,
        'Falha ao editar imagem. Por favor, tente novamente.'
      )
    }
  }
}
