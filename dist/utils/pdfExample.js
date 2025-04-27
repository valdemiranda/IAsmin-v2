"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePdf = analyzePdf;
const config_1 = require("../config");
const pdfUtils_1 = require("./pdfUtils");
const openRouter_1 = require("../services/openRouter");
async function analyzePdf(pdfPath, query) {
    try {
        const model = config_1.config.openRouter.defaultModel;
        const filename = pdfPath.split('/').pop() || 'document.pdf';
        const pdfDataUrl = await (0, pdfUtils_1.encodePdfToBase64)(pdfPath);
        const messages = [
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
        ];
        return await openRouter_1.OpenRouterService.document(messages, model);
    }
    catch (error) {
        console.error('Erro ao analisar PDF:', error);
        throw new Error(`Falha ao analisar o PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
}
async function example() {
    try {
        const pdfPath = './documents/exemplo.pdf';
        const query = 'Quais são os principais pontos deste documento?';
        console.log('Analisando PDF...');
        const response = await analyzePdf(pdfPath, query);
        console.log('Resposta da análise:');
        console.log(response);
    }
    catch (error) {
        console.error('Erro no exemplo:', error);
    }
}
//# sourceMappingURL=pdfExample.js.map