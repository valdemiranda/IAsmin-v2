"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMessageData = validateMessageData;
exports.orderMessagesByConversation = orderMessagesByConversation;
function validateMessageData(data) {
    if (!data.contextId)
        throw new Error('contextId é obrigatório');
    if (!data.content)
        throw new Error('content é obrigatório');
    if (!data.role)
        throw new Error('role é obrigatório');
}
function orderMessagesByConversation(messages) {
    return messages.reduce((acc, currentMessage) => {
        if (!currentMessage.replyToId) {
            acc.push(currentMessage);
            const addReplies = (msg) => {
                const replies = messages.filter((m) => m.replyToId === msg.id);
                replies.forEach((reply) => {
                    acc.push(reply);
                    addReplies(reply);
                });
            };
            addReplies(currentMessage);
        }
        return acc;
    }, []);
}
//# sourceMappingURL=utils.js.map