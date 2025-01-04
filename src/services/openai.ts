import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const OpenAIService = {
  /**
   * Generates an image using DALL-E 3
   * @param prompt Text prompt for image generation
   * @returns URL of the generated image
   */
  generateImage: async (prompt: string): Promise<string> => {
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'url'
      })

      if (!response.data[0].url) {
        throw new Error('URL da imagem não encontrada na resposta')
      }
      return response.data[0].url
    } catch (error) {
      console.error('Error generating image:', error)
      throw new Error('Falha ao gerar imagem. Por favor, tente novamente.')
    }
  }
}
