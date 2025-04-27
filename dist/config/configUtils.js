"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvVars = validateEnvVars;
exports.getEnvVar = getEnvVar;
exports.createConfig = createConfig;
function validateEnvVars(requiredVars) {
    const missingVars = requiredVars.filter((envVar) => !process.env[envVar]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
}
function getEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function createConfig() {
    return {
        telegram: {
            token: getEnvVar('TELEGRAM_BOT_TOKEN')
        },
        openRouter: {
            apiKey: getEnvVar('OPENROUTER_API_KEY'),
            baseUrl: 'https://openrouter.ai/api/v1',
            defaultModel: 'google/gemini-pro-1.5'
        },
        database: {
            url: getEnvVar('DATABASE_URL')
        }
    };
}
//# sourceMappingURL=configUtils.js.map