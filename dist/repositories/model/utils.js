"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDefaultModel = handleDefaultModel;
async function handleDefaultModel(prisma, userId, defaultModelName = 'google/gemini-pro-1.5') {
    const defaultModel = await prisma.model.findFirst({
        where: { name: defaultModelName }
    });
    if (defaultModel) {
        await prisma.user.update({
            where: { id: userId },
            data: { defaultModelId: defaultModel.id }
        });
        return defaultModel;
    }
    const firstModel = await prisma.model.findFirst({
        orderBy: { name: 'asc' }
    });
    if (firstModel) {
        await prisma.user.update({
            where: { id: userId },
            data: { defaultModelId: firstModel.id }
        });
    }
    return firstModel;
}
//# sourceMappingURL=utils.js.map