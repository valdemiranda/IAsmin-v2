"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRepository = void 0;
const config_1 = require("../../config");
const errorHandler_1 = require("../utils/errorHandler");
const utils_1 = require("./utils");
exports.ModelRepository = {
    findUserDefault: async (userId) => {
        try {
            const user = await config_1.prisma.user.findUnique({
                where: { id: userId },
                include: { defaultModel: true }
            });
            return user === null || user === void 0 ? void 0 : user.defaultModel;
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('find user default model', error, 'Erro ao buscar modelo padrão');
        }
    },
    findByName: async ({ name }) => {
        try {
            return await config_1.prisma.model.findUnique({
                where: { name }
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('find model by name', error, 'Erro ao buscar modelo');
        }
    },
    create: async (data) => {
        try {
            return await config_1.prisma.model.create({ data });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('create model', error, 'Erro ao criar modelo');
        }
    },
    setUserDefault: async ({ userId, modelId }) => {
        try {
            return await config_1.prisma.user.update({
                where: { id: userId },
                data: { defaultModelId: modelId },
                include: { defaultModel: true }
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('set user default model', error, 'Erro ao definir modelo padrão');
        }
    },
    findAll: async () => {
        try {
            return await config_1.prisma.model.findMany({
                orderBy: { name: 'asc' }
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('find all models', error, 'Erro ao buscar modelos');
        }
    },
    getUserDefaultOrFirst: async (userId) => {
        try {
            const userDefault = await config_1.prisma.user.findUnique({
                where: { id: userId },
                include: { defaultModel: true }
            });
            if (userDefault === null || userDefault === void 0 ? void 0 : userDefault.defaultModel) {
                return userDefault.defaultModel;
            }
            return (0, utils_1.handleDefaultModel)(config_1.prisma, userId);
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('get user default model', error, 'Erro ao buscar modelo do usuário');
        }
    }
};
//# sourceMappingURL=repository.js.map