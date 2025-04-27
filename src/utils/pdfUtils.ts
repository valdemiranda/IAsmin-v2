import * as fs from 'fs/promises'
import fetch from 'node-fetch'

/**
 * Converts a PDF file to base64 encoded string
 * @param pdfPath Path to the PDF file
 * @returns Promise with base64 encoded string representation of the PDF
 */
export async function encodePdfToBase64(pdfPath: string): Promise<string> {
  try {
    // Read file as binary
    const data = await fs.readFile(pdfPath)

    // Convert binary data to base64 encoded string
    const base64Data = data.toString('base64')

    // Format as data URL
    return `data:application/pdf;base64,${base64Data}`
  } catch (error) {
    console.error('Error encoding PDF:', error)
    throw new Error(`Failed to encode PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Downloads a PDF from a URL and converts it to base64
 * @param url URL of the PDF file
 * @returns Promise with base64 encoded string representation of the PDF
 */
export async function downloadAndEncodePdf(url: string): Promise<string> {
  try {
    // Fetch the PDF file
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
    }

    // Get response as array buffer
    const buffer = await response.arrayBuffer()

    // Convert to base64
    const base64Data = Buffer.from(buffer).toString('base64')

    // Format as data URL
    const dataUrl = `data:application/pdf;base64,${base64Data}`

    return dataUrl
  } catch (error) {
    console.error('Error downloading and encoding PDF:', error)
    throw new Error(
      `Failed to download and encode PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Creates a PDF content part for OpenRouter API
 * @param pdfPath Path to the PDF file
 * @param filename Optional filename (defaults to the path's basename)
 * @returns Promise with PDF content part ready for OpenRouter API
 */
export async function createPdfContentPart(pdfPath: string, filename?: string): Promise<any> {
  const pdfDataUrl = await encodePdfToBase64(pdfPath)

  // Extract filename from path if not provided
  const actualFilename = filename || pdfPath.split('/').pop() || 'document.pdf'

  return {
    type: 'file',
    file: {
      filename: actualFilename,
      file_data: pdfDataUrl
    }
  }
}
