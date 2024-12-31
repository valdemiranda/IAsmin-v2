import { prisma } from '../config';
import { Prisma } from '@prisma/client';

export const UserRepository = {
  findOrCreate: async (id: string, username?: string) => {
    return await prisma.user.upsert({
      where: { id },
      update: { username },
      create: { id, username },
    });
  },

  updateAuthorization: async (id: string, authorized: boolean) => {
    return await prisma.user.update({
      where: { id },
      data: { authorized },
    });
  },

  isAuthorized: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    return user?.authorized ?? false;
  },
};

export const ModelRepository = {
  findDefault: async () => {
    return await prisma.model.findFirst({
      where: { isDefault: true },
    });
  },

  findByName: async (name: string) => {
    return await prisma.model.findUnique({
      where: { name },
    });
  },

  create: async (data: Prisma.ModelCreateInput) => {
    return await prisma.model.create({ data });
  },

  setDefault: async (id: string) => {
    await prisma.$transaction([
      prisma.model.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      }),
      prisma.model.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);
  },
};

export const ContextRepository = {
  create: async (userId: string, modelId: string) => {
    return await prisma.context.create({
      data: { userId, modelId },
      include: {
        messages: true,
      },
    });
  },

  findById: async (id: string) => {
    return await prisma.context.findUnique({
      where: { id },
      include: {
        model: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },
};

export const MessageRepository = {
  create: async (data: {
    contextId: string;
    content: string;
    role: string;
    imageUrl?: string;
    replyToId?: string;
    telegramMessageId?: number;
  }) => {
    return await prisma.message.create({
      data: {
        contextId: data.contextId,
        content: data.content,
        role: data.role,
        imageUrl: data.imageUrl,
        replyToId: data.replyToId,
        telegramMessageId: data.telegramMessageId,
      },
      include: {
        context: {
          include: {
            model: true,
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
  },

  findByTelegramMessageId: async (telegramMessageId: number) => {
    const message = await prisma.message.findFirst({
      where: { telegramMessageId },
      include: {
        context: {
          include: {
            model: true,
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    return message;
  },

  getMessageHistory: async (messageId: string): Promise<{ messages: any[]; modelName: string }> => {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        context: {
          include: {
            model: true,
            messages: {
              orderBy: { createdAt: 'asc' },
              include: {
                replies: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!message || !message.context) {
      throw new Error('Message or context not found');
    }

    // Organiza as mensagens em ordem cronológica mantendo o contexto da conversa
    const orderedMessages = message.context.messages.reduce((acc: any[], currentMessage: any) => {
      // Se a mensagem não é uma resposta a outra, é uma mensagem raiz
      if (!currentMessage.replyToId) {
        acc.push(currentMessage);
        // Adiciona recursivamente todas as respostas a esta mensagem
        const addReplies = (msg: any) => {
          const replies = message.context.messages.filter(m => m.replyToId === msg.id);
          replies.forEach(reply => {
            acc.push(reply);
            addReplies(reply);
          });
        };
        addReplies(currentMessage);
      }
      return acc;
    }, []);

    return {
      messages: orderedMessages,
      modelName: message.context.model.name,
    };
  },
};
