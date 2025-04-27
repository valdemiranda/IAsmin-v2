"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRepositoryError = handleRepositoryError;
const client_1 = require("@prisma/client");
async function handleRepositoryError(operation, error, defaultMessage) {
    console.error(`Repository ${operation} error:`, error);
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                throw new Error('Registro duplicado encontrado.');
            case 'P2025':
                throw new Error('Registro não encontrado.');
            default:
                throw new Error(defaultMessage);
        }
    }
    throw new Error(defaultMessage);
}
//# sourceMappingURL=errorHandler.js.map