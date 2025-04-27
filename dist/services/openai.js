"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const aiUtils_1 = require("./aiUtils");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
exports.OpenAIService = {
    generateImage: async (prompt) => {
        try {
            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt,
                n: 1,
                size: '1024x1024',
                quality: 'hd',
                response_format: 'url'
            });
            if (!response.data[0].url) {
                throw new Error('URL da imagem não encontrada na resposta');
            }
            return response.data[0].url;
        }
        catch (error) {
            return (0, aiUtils_1.handleAIError)('OpenAI', 'generate image', error, 'Falha ao gerar imagem. Por favor, tente novamente.');
        }
    }
};
//# sourceMappingURL=openai.js.map