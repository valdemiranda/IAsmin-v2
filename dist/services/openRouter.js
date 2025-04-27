"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterService = void 0;
const config_1 = require("../config");
const aiUtils_1 = require("./aiUtils");
exports.OpenRouterService = {
    chat: async (messages, model) => {
        return (0, aiUtils_1.makeOpenRouterRequest)(config_1.config.openRouter.baseUrl, config_1.config.openRouter.apiKey, messages, model, 'chat');
    },
    vision: async (messages, model) => {
        return (0, aiUtils_1.makeOpenRouterRequest)(config_1.config.openRouter.baseUrl, config_1.config.openRouter.apiKey, messages, model, 'vision');
    },
    document: async (messages, model) => {
        return (0, aiUtils_1.makeOpenRouterRequest)(config_1.config.openRouter.baseUrl, config_1.config.openRouter.apiKey, messages, model, 'document');
    }
};
//# sourceMappingURL=openRouter.js.map