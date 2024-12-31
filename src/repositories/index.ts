import { prisma } from '../config'
import { Prisma } from '@prisma/client'

export const UserRepository = {
  findOrCreate: async (id: string, username?: string) => {
    return await prisma.user.upsert({
      where: { id },
      update: { username },
      create: { id, username }
    })
  },

  updateAuthorization: async (id: string, authorized: boolean) => {
    return await prisma.user.update({
      where: { id },
      data: { authorized }
    })
  },

  isAuthorized: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } })
    return user?.authorized ?? false
  }
}

export const ModelRepository = {
  findUserDefault: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { defaultModel: true }
    })
    return user?.defaultModel
  },

  findByName: async (name: string) => {
    return await prisma.model.findUnique({
      where: { name }
    })
  },

  create: async (data: Prisma.ModelCreateInput) => {
    return await prisma.model.create({ data })
  },

  setUserDefault: async (userId: string, modelId: string) => {
    return await prisma.user.update({
      where: { id: userId },
      data: { defaultModelId: modelId },
      include: { defaultModel: true }
    })
  },

  findAll: async () => {
    return await prisma.model.findMany({
      orderBy: { name: 'asc' }
    })
  },

  getUserDefaultOrFirst: async (userId: string) => {
    const userDefault = await prisma.user.findUnique({
      where: { id: userId },
      include: { defaultModel: true }
    })

    if (userDefault?.defaultModel) {
      return userDefault.defaultModel
    }

    // Se o usuário não tem modelo padrão, usa o google/gemini-pro-1.5
    const defaultModel = await prisma.model.findFirst({
      where: { name: 'google/gemini-pro-1.5' }
    })

    if (defaultModel) {
      // Define o modelo como padrão para o usuário
      await prisma.user.update({
        where: { id: userId },
        data: { defaultModelId: defaultModel.id }
      })
      return defaultModel
    }

    // Se por algum motivo o modelo padrão não existir, pega o primeiro disponível
    const firstModel = await prisma.model.findFirst({
      orderBy: { name: 'asc' }
    })

    if (firstModel) {
      await prisma.user.update({
        where: { id: userId },
        data: { defaultModelId: firstModel.id }
      })
    }

    return firstModel
  }
}

export const ContextRepository = {
  create: async (userId: string, modelId: string) => {
    return await prisma.context.create({
      data: { userId, modelId },
      include: {
        messages: true
      }
    })
  },

  findById: async (id: string) => {
    return await prisma.context.findUnique({
      where: { id },
      include: {
        model: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })
  }
}

export const MessageRepository = {
  create: async (data: {
    contextId: string
    content: string
    role: string
    imageUrl?: string
    replyToId?: string
    telegramMessageId?: number
  }) => {
    return await prisma.message.create({
      data: {
        contextId: data.contextId,
        content: data.content,
        role: data.role,
        imageUrl: data.imageUrl,
        replyToId: data.replyToId,
        telegramMessageId: data.telegramMessageId
      },
      include: {
        context: {
          include: {
            model: true,
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    })
  },

  findByTelegramMessageId: async (telegramMessageId: number) => {
    const message = await prisma.message.findFirst({
      where: { telegramMessageId },
      include: {
        context: {
          include: {
            model: true,
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    })

    return message
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
                  orderBy: { createdAt: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    if (!message || !message.context) {
      throw new Error('Message or context not found')
    }

    // Organiza as mensagens em ordem cronológica mantendo o contexto da conversa
    const orderedMessages = message.context.messages.reduce((acc: any[], currentMessage: any) => {
      // Se a mensagem não é uma resposta a outra, é uma mensagem raiz
      if (!currentMessage.replyToId) {
        acc.push(currentMessage)
        // Adiciona recursivamente todas as respostas a esta mensagem
        const addReplies = (msg: any) => {
          const replies = message.context.messages.filter((m) => m.replyToId === msg.id)
          replies.forEach((reply) => {
            acc.push(reply)
            addReplies(reply)
          })
        }
        addReplies(currentMessage)
      }
      return acc
    }, [])

    return {
      messages: orderedMessages,
      modelName: message.context.model.name
    }
  }
}
