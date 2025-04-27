"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.AppErrorType = void 0;
exports.formatAppError = formatAppError;
exports.initializeApp = initializeApp;
const telegram_1 = require("../services/telegram");
const commands_1 = require("../handlers/commands");
const messages_1 = require("../handlers/messages");
const initialize_1 = require("../database/initialize");
const config_1 = require("../config");
var AppErrorType;
(function (AppErrorType) {
    AppErrorType["DATABASE"] = "DATABASE";
    AppErrorType["BOT_SETUP"] = "BOT_SETUP";
    AppErrorType["COMMAND"] = "COMMAND";
})(AppErrorType || (exports.AppErrorType = AppErrorType = {}));
class AppError extends Error {
    constructor(type, message, originalError) {
        super(message);
        this.type = type;
        this.originalError = originalError;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function formatAppError(error) {
    let message = `Application Error (${error.type}): ${error.message}`;
    if (error.originalError instanceof Error) {
        message += `\nCause: ${error.originalError.message}`;
    }
    return message;
}
function mapToTelegramMessage(msg) {
    var _a, _b;
    return {
        messageId: msg.message_id,
        from: {
            id: ((_a = msg.from) === null || _a === void 0 ? void 0 : _a.id) || 0,
            username: (_b = msg.from) === null || _b === void 0 ? void 0 : _b.username
        },
        text: msg.text,
        caption: msg.caption,
        photo: msg.photo,
        reply_to_message: msg.reply_to_message ? { message_id: msg.reply_to_message.message_id } : undefined,
        document: msg.document
            ? {
                file_id: msg.document.file_id,
                file_name: msg.document.file_name,
                mime_type: msg.document.mime_type
            }
            : undefined
    };
}
async function setupBot() {
    try {
        await telegram_1.TelegramService.setCommands(commands_1.commands.map(({ command, description }) => ({
            command,
            description
        })));
        for (const { command, handler } of commands_1.commands) {
            telegram_1.TelegramService.bot.onText(new RegExp(`^/${command}`), async (msg) => {
                try {
                    await handler(mapToTelegramMessage(msg));
                }
                catch (error) {
                    const appError = new AppError(AppErrorType.COMMAND, `Error handling /${command} command`, error);
                    console.error(formatAppError(appError));
                }
            });
        }
        telegram_1.TelegramService.onMessage(messages_1.MessageHandler.handleMessage);
        console.log('IAsmin iniciada com sucesso!');
    }
    catch (error) {
        throw new AppError(AppErrorType.BOT_SETUP, 'Failed to set up bot', error);
    }
}
async function cleanup() {
    try {
        await config_1.prisma.$disconnect();
        await telegram_1.TelegramService.bot.close();
    }
    catch (error) {
        console.error('Error during cleanup:', error);
    }
}
async function initializeApp() {
    try {
        console.log('Inicializando banco de dados...');
        await (0, initialize_1.initializeDatabase)();
        console.log('Configurando bot...');
        await setupBot();
        process.on('SIGINT', async () => {
            console.log('\nReceived SIGINT. Cleaning up...');
            await cleanup();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('\nReceived SIGTERM. Cleaning up...');
            await cleanup();
            process.exit(0);
        });
        process.on('uncaughtException', async (error) => {
            console.error('Uncaught Exception:', error);
            await cleanup();
            process.exit(1);
        });
        process.on('unhandledRejection', async (error) => {
            console.error('Unhandled Rejection:', error);
            await cleanup();
            process.exit(1);
        });
    }
    catch (error) {
        if (error instanceof AppError) {
            console.error(formatAppError(error));
        }
        else {
            console.error('Error starting application:', error);
        }
        process.exit(1);
    }
}
//# sourceMappingURL=appUtils.js.map