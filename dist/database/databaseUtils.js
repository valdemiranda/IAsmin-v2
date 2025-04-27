"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = exports.DatabaseErrorType = void 0;
exports.parseDatabaseUrl = parseDatabaseUrl;
exports.checkDatabaseExists = checkDatabaseExists;
exports.createDatabase = createDatabase;
exports.applyMigrations = applyMigrations;
exports.formatDatabaseError = formatDatabaseError;
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
var DatabaseErrorType;
(function (DatabaseErrorType) {
    DatabaseErrorType["CONNECTION"] = "CONNECTION";
    DatabaseErrorType["CREATION"] = "CREATION";
    DatabaseErrorType["MIGRATION"] = "MIGRATION";
    DatabaseErrorType["URL_PARSING"] = "URL_PARSING";
})(DatabaseErrorType || (exports.DatabaseErrorType = DatabaseErrorType = {}));
class DatabaseError extends Error {
    constructor(type, message, originalError) {
        super(message);
        this.type = type;
        this.originalError = originalError;
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
function parseDatabaseUrl(url) {
    try {
        const matches = url.match(/\/([^/?]+)(\?|$)/);
        if (!matches) {
            throw new DatabaseError(DatabaseErrorType.URL_PARSING, 'Invalid database URL format');
        }
        const databaseName = matches[1];
        const baseUrl = url.replace(`/${databaseName}`, '/postgres');
        return { baseUrl, databaseName };
    }
    catch (error) {
        throw new DatabaseError(DatabaseErrorType.URL_PARSING, 'Failed to parse database URL', error);
    }
}
async function checkDatabaseExists(url) {
    const client = new client_1.PrismaClient({ datasourceUrl: url });
    try {
        await client.$connect();
        await client.$disconnect();
        return true;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('does not exist')) {
            return false;
        }
        throw new DatabaseError(DatabaseErrorType.CONNECTION, 'Failed to check database existence', error);
    }
}
async function createDatabase(url) {
    const { baseUrl, databaseName } = parseDatabaseUrl(url);
    const client = new client_1.PrismaClient({ datasourceUrl: baseUrl });
    try {
        await client.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    }
    catch (error) {
        throw new DatabaseError(DatabaseErrorType.CREATION, 'Failed to create database', error);
    }
    finally {
        await client.$disconnect();
    }
}
async function applyMigrations() {
    try {
        await execAsync('npx prisma migrate deploy');
    }
    catch (error) {
        throw new DatabaseError(DatabaseErrorType.MIGRATION, 'Failed to apply migrations', error);
    }
}
function formatDatabaseError(error) {
    let message = `Database Error (${error.type}): ${error.message}`;
    if (error.originalError instanceof Error) {
        message += `\nCause: ${error.originalError.message}`;
    }
    return message;
}
//# sourceMappingURL=databaseUtils.js.map