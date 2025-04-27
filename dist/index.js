"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appUtils_1 = require("./utils/appUtils");
(0, appUtils_1.initializeApp)().catch((error) => {
    console.error('Fatal error during application initialization:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map