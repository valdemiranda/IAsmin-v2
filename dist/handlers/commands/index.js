"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const startCommand_1 = require("./startCommand");
const modelCommand_1 = require("./modelCommand");
const helpCommand_1 = require("./helpCommand");
const generateCommand_1 = require("./generateCommand");
(0, modelCommand_1.setupModelCallbacks)();
exports.commands = [startCommand_1.startCommand, modelCommand_1.modelCommand, helpCommand_1.helpCommand, generateCommand_1.generateCommand];
//# sourceMappingURL=index.js.map