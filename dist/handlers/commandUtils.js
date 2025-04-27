"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuthorization = checkAuthorization;
exports.checkModelAvailability = checkModelAvailability;
exports.handleCommandError = handleCommandError;
exports.createModelButtons = createModelButtons;
exports.handleModelSelectionResponse = handleModelSelectionResponse;
const telegram_1 = require("../services/telegram");
const repositories_1 = require("../repositories");
async function checkAuthorization(userId, errorMessage = 'Você ainda não está autorizado a usar este comando.') {
    const isAuthorized = await repositories_1.UserRepository.isAuthorized(userId);
    if (!isAuthorized) {
        await telegram_1.TelegramService.sendMessage(userId, errorMessage);
        return false;
    }
    return true;
}
async function checkModelAvailability(userId) {
    const userModel = await repositories_1.ModelRepository.getUserDefaultOrFirst(userId);
    if (!userModel) {
        await telegram_1.TelegramService.sendMessage(userId, 'Nenhum modelo disponível. Por favor, contate um administrador.');
        return { success: false };
    }
    return { success: true, model: userModel };
}
async function handleCommandError(error, userId, commandName, customErrorMessage) {
    console.error(`Erro ao processar comando /${commandName}:`, error);
    await telegram_1.TelegramService.sendMessage(userId, customErrorMessage || 'Desculpe, ocorreu um erro ao processar seu comando. Tente novamente mais tarde.');
}
async function createModelButtons(userId) {
    const models = await repositories_1.ModelRepository.findAll();
    const currentModel = await repositories_1.ModelRepository.findUserDefault(userId);
    return models.map((model) => [
        {
            text: model.name + (model.id === (currentModel === null || currentModel === void 0 ? void 0 : currentModel.id) ? ' (atual)' : ''),
            callback_data: `model:${model.name}`
        }
    ]);
}
async function handleModelSelectionResponse(userId, modelId, currentModelId) {
    if (currentModelId === modelId) {
        return {
            success: false,
            message: 'Este já é o seu modelo atual.'
        };
    }
    await repositories_1.ModelRepository.setUserDefault({ userId, modelId });
    return {
        success: true,
        message: `Seu modelo foi alterado com sucesso.`
    };
}
//# sourceMappingURL=commandUtils.js.map