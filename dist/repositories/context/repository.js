"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextRepository = void 0;
const config_1 = require("../../config");
const errorHandler_1 = require("../utils/errorHandler");
const types_1 = require("./types");
exports.ContextRepository = {
    create: async ({ userId, modelId, type = 'chat' }) => {
        try {
            return await config_1.prisma.context.create({
                data: { userId, modelId, type },
                include: types_1.contextInclude
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('create context', error, 'Erro ao criar contexto');
        }
    },
    findById: async (id) => {
        try {
            return await config_1.prisma.context.findUnique({
                where: { id },
                include: types_1.contextInclude
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('find context', error, 'Erro ao buscar contexto');
        }
    }
};
//# sourceMappingURL=repository.js.map