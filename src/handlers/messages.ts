import { Message } from '@prisma/client';
import { OpenRouterMessage, TelegramMessage } from '../types';
import { TelegramService } from '../services/telegram';
import { OpenRouterService } from '../services/openRouter';
import {
  ContextRepository,
  MessageRepository,
  ModelRepository,
  UserRepository,
} from '../repositories';

export const MessageHandler = {
  handleMessage: async (msg: TelegramMessage) => {
    try {
      // Garante que o usuário esteja registrado
      const userId = msg.from.id.toString();
      const user = await UserRepository.findOrCreate(userId, msg.from.username);

      if (!user.authorized) {
        await TelegramService.sendMessage(
          userId,
          'Você ainda não está autorizado a interagir comigo. Use /start para ver seu ID e aguarde a aprovação de um administrador.'
        );
        console.log(`Tentativa de interação de usuário não autorizado - ID: ${userId}, Username: ${msg.from.username || 'não informado'}`);
        return;
      }

      // Verifica se é uma resposta a uma mensagem existente
      if (msg.reply_to_message) {
        await handleReplyMessage(msg);
        return;
      }

      // Cria um novo contexto
      await handleNewContext(msg);
    } catch (error) {
      console.error('Error handling message:', error);
      await TelegramService.sendMessage(
        msg.from.id,
        'Desculpe, ocorreu um erro ao processar sua mensagem.'
      );
    }
  },
};

async function handleReplyMessage(msg: TelegramMessage) {
  const previousMessage = await MessageRepository.findByTelegramMessageId(
    msg.reply_to_message!.message_id
  );

  if (!previousMessage || !previousMessage.context) {
    await TelegramService.sendMessage(
      msg.from.id,
      'Não foi possível encontrar o contexto desta mensagem.'
    );
    return;
  }

  const context = previousMessage.context;
  let content = msg.text || '';
  let imageUrl: string | undefined;

  if (msg.photo) {
    const photo = msg.photo[msg.photo.length - 1]; // Pega a maior resolução
    imageUrl = await TelegramService.getFile(photo.file_id);
    content = msg.caption || 'Por favor, analise esta imagem';
  }

  // Salva a mensagem do usuário
  const userMessage = await MessageRepository.create({
    contextId: context.id,
    content,
    role: 'user',
    imageUrl,
    replyToId: previousMessage.id,
    telegramMessageId: msg.messageId,
  });

  // Busca o histórico completo de mensagens mantendo o contexto da conversa
  const { messages: historyMessages, modelName } = await MessageRepository.getMessageHistory(previousMessage.id);
  
  // Converte as mensagens para o formato do OpenRouter
  const messages: OpenRouterMessage[] = historyMessages.map((m: Message) => ({
    role: m.role,
    content: m.imageUrl
      ? [
          { type: 'text', text: m.content },
          { type: 'image_url', image_url: m.imageUrl },
        ]
      : m.content,
  }));

  // Adiciona a mensagem atual ao final do contexto
  messages.push({
    role: 'user',
    content: imageUrl
      ? [
          { type: 'text', text: content },
          { type: 'image_url', image_url: imageUrl },
        ]
      : content,
  });

  const response = imageUrl
    ? await OpenRouterService.vision(messages, modelName)
    : await OpenRouterService.chat(messages, modelName);

  // Envia a resposta e salva com o ID correto do Telegram
  const sentMessage = await TelegramService.sendMessage(msg.from.id, response, msg.messageId);
  
  // Salva a mensagem do bot com o ID correto
  await MessageRepository.create({
    contextId: context.id,
    content: response,
    role: 'assistant',
    replyToId: userMessage.id,
    telegramMessageId: sentMessage.message_id,
  });
}

async function handleNewContext(msg: TelegramMessage) {
  const defaultModel = await ModelRepository.findDefault();
  if (!defaultModel) {
    await TelegramService.sendMessage(
      msg.from.id,
      'Nenhum modelo padrão configurado. Use /model para configurar um modelo.'
    );
    return;
  }

  // Cria um novo contexto
  const context = await ContextRepository.create(msg.from.id.toString(), defaultModel.id);

  // Notifica o usuário sobre o início de um novo contexto
  await TelegramService.sendMessage(
    msg.from.id,
    '🔄 Iniciando um novo contexto de conversa. Para manter o contexto basta responder à mensagem sobre a qual deseja continuar conversando.'
  );

  let content = msg.text || '';
  let imageUrl: string | undefined;

  if (msg.photo) {
    const photo = msg.photo[msg.photo.length - 1]; // Pega a maior resolução
    imageUrl = await TelegramService.getFile(photo.file_id);
    content = msg.caption || 'Por favor, analise esta imagem';
  }

  // Salva a mensagem do usuário
  const userMessage = await MessageRepository.create({
    contextId: context.id,
    content,
    role: 'user',
    imageUrl,
    telegramMessageId: msg.messageId,
  });

  // Processa com o OpenRouter
  const messages: OpenRouterMessage[] = [
    {
      role: 'user',
      content: imageUrl
        ? [
            { type: 'text', text: content },
            { type: 'image_url', image_url: imageUrl },
          ]
        : content,
    },
  ];

  const response = imageUrl
    ? await OpenRouterService.vision(messages, defaultModel.name)
    : await OpenRouterService.chat(messages, defaultModel.name);

  // Envia a resposta e salva com o ID correto do Telegram
  const sentMessage = await TelegramService.sendMessage(msg.from.id, response, msg.messageId);
  
  // Salva a mensagem do bot com o ID correto
  await MessageRepository.create({
    contextId: context.id,
    content: response,
    role: 'assistant',
    replyToId: userMessage.id,
    telegramMessageId: sentMessage.message_id,
  });
}
