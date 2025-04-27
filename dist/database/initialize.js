"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const config_1 = require("../config");
const databaseUtils_1 = require("./databaseUtils");
async function initializeDatabase() {
    const databaseUrl = config_1.config.database.url;
    try {
        const exists = await (0, databaseUtils_1.checkDatabaseExists)(databaseUrl);
        if (!exists) {
            console.log('Database does not exist. Creating...');
            await (0, databaseUtils_1.createDatabase)(databaseUrl);
            console.log('Database created successfully');
        }
        console.log('Applying migrations...');
        await (0, databaseUtils_1.applyMigrations)();
        console.log('Migrations applied successfully');
    }
    catch (error) {
        if (error instanceof databaseUtils_1.DatabaseError) {
            console.error((0, databaseUtils_1.formatDatabaseError)(error));
        }
        else {
            console.error('Unexpected error during database initialization:', error);
        }
        throw error;
    }
}
//# sourceMappingURL=initialize.js.map