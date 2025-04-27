import { config } from '../config'
import { encodePdfToBase64 } from './pdfUtils'
import { OpenRouterService } from '../services/openRouter'
import { OpenRouterMessage } from '../types'

/**
 * Exemplo de como analisar um documento PDF com a API OpenRouter
 * @param pdfPath Caminho para o arquivo PDF
 * @param query Pergunta ou instrução sobre o documento
 * @returns Promessa com a resposta da análise
 */
export async function analyzePdf(pdfPath: string, query: string): Promise<string> {
  try {
    // Obter o modelo padrão da configuração
    const model = config.openRouter.defaultModel

    // Extrair o nome do arquivo do caminho
    const filename = pdfPath.split('/').pop() || 'document.pdf'

    // Codificar o PDF para base64
    const pdfDataUrl = await encodePdfToBase64(pdfPath)

    // Criar mensagem para a API OpenRouter
    const messages: OpenRouterMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: query
          },
          {
            type: 'file',
            file: {
              filename,
              file_data: pdfDataUrl
            }
          }
        ]
      }
    ]

    // Enviar para a API e retornar a resposta
    return await OpenRouterService.document(messages, model)
  } catch (error) {
    console.error('Erro ao analisar PDF:', error)
    throw new Error(
      `Falha ao analisar o PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    )
  }
}

/**
 * Exemplo de como usar a função de análise
 */
// @ts-ignore - Função de exemplo para referência, não é utilizada diretamente
async function example() {
  try {
    const pdfPath = './documents/exemplo.pdf' // Caminho para o arquivo PDF
    const query = 'Quais são os principais pontos deste documento?' // Pergunta sobre o documento

    console.log('Analisando PDF...')
    const response = await analyzePdf(pdfPath, query)

    console.log('Resposta da análise:')
    console.log(response)
  } catch (error) {
    console.error('Erro no exemplo:', error)
  }
}

// Descomente para executar o exemplo
// example()
