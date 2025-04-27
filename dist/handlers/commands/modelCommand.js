"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupModelCallbacks = exports.modelCommand = void 0;
const telegram_1 = require("../../services/telegram");
const repositories_1 = require("../../repositories");
const commandUtils_1 = require("../commandUtils");
exports.modelCommand = {
    command: 'model',
    description: 'Escolher ou visualizar o modelo atual',
    handler: async (msg) => {
        const userId = msg.from.id.toString();
        if (!(await (0, commandUtils_1.checkAuthorization)(userId))) {
            return;
        }
        const userModel = await repositories_1.ModelRepository.findUserDefault(userId);
        const modelButtons = await (0, commandUtils_1.createModelButtons)(userId);
        await telegram_1.TelegramService.sendMessage(userId, userModel
            ? `Modelo atual: ${userModel.name}\n\nEscolha um modelo para usar:`
            : 'Escolha um modelo para usar:', {
            inlineKeyboard: modelButtons
        });
    }
};
const setupModelCallbacks = () => {
    telegram_1.TelegramService.onCallbackQuery(async (query) => {
        var _a, _b, _c, _d;
        if (!((_a = query.data) === null || _a === void 0 ? void 0 : _a.startsWith('model:')))
            return;
        const modelName = query.data.replace('model:', '');
        const userId = query.from.id.toString();
        if (!(await (0, commandUtils_1.checkAuthorization)(userId))) {
            await telegram_1.TelegramService.bot.answerCallbackQuery(query.id, {
                text: 'Você não está autorizado a usar este comando.',
                show_alert: true
            });
            return;
        }
        const model = await repositories_1.ModelRepository.findByName({ name: modelName });
        if (!model) {
            await telegram_1.TelegramService.bot.answerCallbackQuery(query.id, {
                text: 'Modelo não encontrado.',
                show_alert: true
            });
            return;
        }
        const currentDefault = await repositories_1.ModelRepository.findUserDefault(userId);
        const result = await (0, commandUtils_1.handleModelSelectionResponse)(userId, model.id, currentDefault === null || currentDefault === void 0 ? void 0 : currentDefault.id);
        await telegram_1.TelegramService.bot.answerCallbackQuery(query.id, {
            text: result.success ? `Seu modelo foi alterado para: ${model.name}` : result.message
        });
        if (result.success && query.message) {
            try {
                const modelButtons = await (0, commandUtils_1.createModelButtons)(userId);
                await telegram_1.TelegramService.bot.editMessageText(`Modelo atual: ${model.name}\n\nEscolha um modelo para usar:`, {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                    reply_markup: {
                        inline_keyboard: modelButtons
                    }
                });
            }
            catch (error) {
                if ((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.body) === null || _c === void 0 ? void 0 : _c.description) === null || _d === void 0 ? void 0 : _d.includes('message is not modified')) {
                    return;
                }
                throw error;
            }
        }
    });
};
exports.setupModelCallbacks = setupModelCallbacks;
//# sourceMappingURL=modelCommand.js.map