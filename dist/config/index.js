"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const configUtils_1 = require("./configUtils");
dotenv_1.default.config();
const requiredEnvVars = ['DATABASE_URL', 'TELEGRAM_BOT_TOKEN', 'OPENROUTER_API_KEY'];
(0, configUtils_1.validateEnvVars)(requiredEnvVars);
exports.config = (0, configUtils_1.createConfig)();
exports.prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: exports.config.database.url
        }
    }
});
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
});
process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await exports.prisma.$disconnect();
    process.exit(1);
});
process.on('unhandledRejection', async (error) => {
    console.error('Unhandled Rejection:', error);
    await exports.prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=index.js.map