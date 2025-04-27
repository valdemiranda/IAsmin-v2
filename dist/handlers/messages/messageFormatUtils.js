"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFormatUtils = exports.MessageFormatError = exports.MessageFormatErrorType = void 0;
const telegram_1 = require("../../services/telegram");
const pdfUtils_1 = require("../../utils/pdfUtils");
var MessageFormatErrorType;
(function (MessageFormatErrorType) {
    MessageFormatErrorType["CONTENT_EXTRACTION"] = "CONTENT_EXTRACTION";
    MessageFormatErrorType["FORMAT_CONVERSION"] = "FORMAT_CONVERSION";
    MessageFormatErrorType["FILE_PROCESSING"] = "FILE_PROCESSING";
})(MessageFormatErrorType || (exports.MessageFormatErrorType = MessageFormatErrorType = {}));
class MessageFormatError extends Error {
    constructor(type, message, originalError) {
        super(message);
        this.type = type;
        this.originalError = originalError;
        this.name = 'MessageFormatError';
    }
}
exports.MessageFormatError = MessageFormatError;
exports.MessageFormatUtils = {
    extractMessageContent: async (msg) => {
        try {
            let content = msg.text || '';
            let imageUrl;
            let pdfUrl;
            let filename;
            if (msg.photo) {
                const photo = msg.photo[msg.photo.length - 1];
                imageUrl = await telegram_1.TelegramService.getFile(photo.file_id);
                content = msg.caption || 'Por favor, analise esta imagem';
            }
            else if (msg.document) {
                const fileUrl = await telegram_1.TelegramService.getFile(msg.document.file_id);
                const mimeType = msg.document.mime_type;
                if (mimeType === 'application/pdf') {
                    filename = msg.document.file_name;
                    content =
                        msg.caption ||
                            'Por favor, analise o conteúdo deste PDF e me forneça um resumo dos principais pontos';
                    try {
                        pdfUrl = await (0, pdfUtils_1.downloadAndEncodePdf)(fileUrl);
                    }
                    catch (downloadError) {
                        console.error('Erro ao baixar e codificar PDF:', downloadError);
                        pdfUrl = fileUrl;
                    }
                }
            }
            return { content, imageUrl, pdfUrl, filename };
        }
        catch (error) {
            console.error('Erro ao extrair conteúdo da mensagem:', error);
            throw new MessageFormatError(MessageFormatErrorType.CONTENT_EXTRACTION, 'Failed to extract message content', error);
        }
    },
    convertToOpenRouterFormat: (messages) => {
        try {
            return messages.map((m) => {
                const message = {
                    role: m.role,
                    content: m.content
                };
                const contentParts = [];
                contentParts.push({ type: 'text', text: m.content });
                if (m.imageUrl) {
                    contentParts.push({ type: 'image_url', image_url: m.imageUrl });
                }
                if (m.pdfUrl) {
                    contentParts.push({
                        type: 'file',
                        file: {
                            filename: m.pdfUrl.includes(';base64,')
                                ? 'document.pdf'
                                : m.pdfUrl.split('/').pop() || 'document.pdf',
                            file_data: m.pdfUrl
                        }
                    });
                }
                if (m.imageUrl || m.pdfUrl) {
                    message.content = contentParts;
                }
                return message;
            });
        }
        catch (error) {
            throw new MessageFormatError(MessageFormatErrorType.FORMAT_CONVERSION, 'Failed to convert messages to OpenRouter format', error);
        }
    },
    createOpenRouterMessage: (content, imageUrl, pdfUrl, filename) => {
        try {
            const message = {
                role: 'user',
                content: content
            };
            if (imageUrl || pdfUrl) {
                const contentParts = [{ type: 'text', text: content }];
                if (imageUrl) {
                    contentParts.push({ type: 'image_url', image_url: imageUrl });
                }
                if (pdfUrl && filename) {
                    contentParts.push({
                        type: 'file',
                        file: {
                            filename: filename,
                            file_data: pdfUrl
                        }
                    });
                }
                message.content = contentParts;
            }
            return message;
        }
        catch (error) {
            throw new MessageFormatError(MessageFormatErrorType.FORMAT_CONVERSION, 'Failed to create OpenRouter message', error);
        }
    },
    createPdfOpenRouterMessage: (query, pdfDataUrl, filename) => {
        try {
            return {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: query
                    },
                    {
                        type: 'file',
                        file: {
                            filename: filename,
                            file_data: pdfDataUrl
                        }
                    }
                ]
            };
        }
        catch (error) {
            throw new MessageFormatError(MessageFormatErrorType.FILE_PROCESSING, 'Failed to create PDF OpenRouter message', error);
        }
    },
    formatError: (error) => {
        let message = `Message Format Error (${error.type}): ${error.message}`;
        if (error.originalError instanceof Error) {
            message += `\nCause: ${error.originalError.message}`;
        }
        return message;
    }
};
//# sourceMappingURL=messageFormatUtils.js.map