"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageWithRepliesInclude = exports.messageWithContextInclude = void 0;
exports.messageWithContextInclude = {
    context: {
        include: {
            model: true,
            messages: {
                orderBy: {
                    createdAt: 'asc'
                }
            }
        }
    }
};
exports.messageWithRepliesInclude = {
    context: {
        include: {
            model: true,
            messages: {
                orderBy: {
                    createdAt: 'asc'
                },
                include: {
                    replies: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                }
            }
        }
    }
};
//# sourceMappingURL=types.js.map