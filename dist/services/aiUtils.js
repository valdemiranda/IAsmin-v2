"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAIError = handleAIError;
exports.isOpenRouterResponse = isOpenRouterResponse;
exports.formatOpenRouterResponse = formatOpenRouterResponse;
exports.createSystemInstructions = createSystemInstructions;
exports.addSystemInstructions = addSystemInstructions;
exports.buildOpenRouterFetchOptions = buildOpenRouterFetchOptions;
exports.makeOpenRouterRequest = makeOpenRouterRequest;
async function handleAIError(service, operation, error, defaultMessage) {
    console.error(`${service} ${operation} error:`, error);
    throw new Error(defaultMessage);
}
function isOpenRouterResponse(data) {
    return (typeof data === 'object' &&
        data !== null &&
        'choices' in data &&
        Array.isArray(data.choices));
}
function formatOpenRouterResponse(content, finishReason, annotations) {
    if (!content)
        return 'Desculpe, não consegui processar sua mensagem.';
    let formattedContent = content;
    if (annotations && annotations.length > 0) {
        const annotationsCount = annotations.length;
        formattedContent = `${formattedContent}\n\n(${annotationsCount} anotações foram feitas no documento)`;
    }
    if ((finishReason === null || finishReason === void 0 ? void 0 : finishReason.toLocaleLowerCase()) !== 'stop') {
        return `${formattedContent} **(...)**`;
    }
    return formattedContent;
}
function createSystemInstructions(model) {
    return `
  - If the user asks you to introduce yourself, your name is IAsmin and you are a personal assistant bot on Telegram created by Valdecir with the help of **${model}**.
  - If the request is related to generating an image, please note that this mode cannot generate images, but the user can call the /generate command for this purpose.
  `;
}
function addSystemInstructions(messages, model) {
    const systemMessage = {
        role: 'system',
        content: createSystemInstructions(model)
    };
    return [systemMessage, ...messages];
}
function buildOpenRouterFetchOptions(apiKey, body) {
    return {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'IAsmin v2'
        },
        body: JSON.stringify(body)
    };
}
async function makeOpenRouterRequest(baseUrl, apiKey, messages, model, operation) {
    var _a, _b;
    try {
        const options = buildOpenRouterFetchOptions(apiKey, {
            model,
            messages: addSystemInstructions(messages, model),
            stream: false,
            max_tokens: 900
        });
        const response = await fetch(`${baseUrl}/chat/completions`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!isOpenRouterResponse(data)) {
            throw new Error('Resposta inválida da OpenRouter API');
        }
        const choice = data.choices[0];
        const annotations = (_a = choice === null || choice === void 0 ? void 0 : choice.message) === null || _a === void 0 ? void 0 : _a.annotations;
        return formatOpenRouterResponse((_b = choice === null || choice === void 0 ? void 0 : choice.message) === null || _b === void 0 ? void 0 : _b.content, choice === null || choice === void 0 ? void 0 : choice.finish_reason, annotations);
    }
    catch (error) {
        return handleAIError('OpenRouter', operation, error, `Erro ao processar ${operation} com a OpenRouter API`);
    }
}
//# sourceMappingURL=aiUtils.js.map