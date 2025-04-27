"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const config_1 = require("../../config");
const errorHandler_1 = require("../utils/errorHandler");
exports.UserRepository = {
    findOrCreate: async ({ id, username }) => {
        try {
            return await config_1.prisma.user.upsert({
                where: { id },
                update: { username },
                create: { id, username }
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('create/update user', error, 'Erro ao criar/atualizar usuário');
        }
    },
    updateAuthorization: async ({ id, authorized }) => {
        try {
            return await config_1.prisma.user.update({
                where: { id },
                data: { authorized }
            });
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('update user authorization', error, 'Erro ao atualizar autorização');
        }
    },
    isAuthorized: async (id) => {
        var _a;
        try {
            const user = await config_1.prisma.user.findUnique({ where: { id } });
            return (_a = user === null || user === void 0 ? void 0 : user.authorized) !== null && _a !== void 0 ? _a : false;
        }
        catch (error) {
            return (0, errorHandler_1.handleRepositoryError)('check user authorization', error, 'Erro ao verificar autorização');
        }
    }
};
//# sourceMappingURL=repository.js.map