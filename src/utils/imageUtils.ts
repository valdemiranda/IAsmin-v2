import fetch from 'node-fetch'

/**
 * Downloads an image from a URL and returns it as a Buffer
 * @param imageUrl URL of the image to download
 * @returns Promise with the image as a Buffer
 */
export async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    // Remove data URI prefix if present
    let url = imageUrl
    if (imageUrl.startsWith('data:image')) {
      // Extract base64 data from data URI
      const base64Data = imageUrl.split(',')[1]
      return Buffer.from(base64Data, 'base64')
    }

    // Fetch the image
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    // Get response as array buffer
    const buffer = await response.arrayBuffer()
    return Buffer.from(buffer)
  } catch (error) {
    console.error('Error downloading image:', error)
    throw new Error(
      `Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Extracts base64 data from a data URI
 * @param dataUri Data URI string
 * @returns Base64 encoded string
 */
export function extractBase64FromDataUri(dataUri: string): string {
  if (!dataUri.startsWith('data:')) {
    throw new Error('Invalid data URI format')
  }
  
  return dataUri.split(',')[1]
}

/**
 * Checks if a string is a valid data URI
 * @param str String to check
 * @returns Boolean indicating if the string is a valid data URI
 */
export function isDataUri(str: string): boolean {
  return str.startsWith('data:')
}

/**
 * Gets the most recent assistant-generated image from a list of messages
 * @param messages List of messages to search
 * @returns URL of the most recent image or undefined if none found
 */
export function getMostRecentAssistantImage(messages: any[]): string | undefined {
  // Filter for assistant messages with images, sort by creation date (newest first)
  const assistantImagesMessages = messages
    .filter(m => m.role === 'assistant' && m.imageUrl)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  // Return the URL of the most recent image, if any
  return assistantImagesMessages.length > 0 ? assistantImagesMessages[0].imageUrl : undefined
}

/**
 * Checks if there are any assistant-generated images in the message history
 * @param messages List of messages to check
 * @returns Boolean indicating if there are any assistant-generated images
 */
export function hasAssistantGeneratedImages(messages: any[]): boolean {
  return messages.some(m => m.role === 'assistant' && m.imageUrl)
}
