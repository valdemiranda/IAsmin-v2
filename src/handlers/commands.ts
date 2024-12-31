import { TelegramMessage } from '../types';
import { TelegramService } from '../services/telegram';
import { ModelRepository, UserRepository } from '../repositories';

export const startCommand = {
  command: 'start',
  description: 'Iniciar o bot',
  handler: async (msg: TelegramMessage) => {
    try {
      // Garante que o ID do usuário seja uma string
      const userId = msg.from.id.toString();
      
      // Cria ou atualiza o usuário no banco
      const user = await UserRepository.findOrCreate(
        userId,
        msg.from.username
      );

      const welcomeMessage = user.authorized
        ? `Bem-vindo de volta! Você está autorizado e pode começar a conversar comigo.\nSeu ID: ${userId}`
        : `Olá! Seu cadastro foi realizado com o ID: ${userId}\nVocê precisa de autorização para interagir comigo. Por favor, aguarde a aprovação de um administrador.`;

      await TelegramService.sendMessage(userId, welcomeMessage);
      
      if (!user.authorized) {
        console.log(`Novo usuário registrado - ID: ${userId}, Username: ${msg.from.username || 'não informado'}`);
      }
    } catch (error) {
      console.error('Erro ao processar comando /start:', error);
      await TelegramService.sendMessage(
        msg.from.id,
        'Desculpe, ocorreu um erro ao processar seu cadastro. Tente novamente mais tarde.'
      );
    }
  },
};

export const modelCommand = {
  command: 'model',
  description: 'Escolher ou visualizar o modelo atual',
  handler: async (msg: TelegramMessage) => {
    const isAuthorized = await UserRepository.isAuthorized(msg.from.id.toString());
    if (!isAuthorized) {
      await TelegramService.sendMessage(
        msg.from.id,
        'Você ainda não está autorizado a usar este comando.'
      );
      return;
    }

    const args = msg.text?.split(' ').slice(1);
    const modelName = args?.[0];

    if (!modelName) {
      const defaultModel = await ModelRepository.findDefault();
      await TelegramService.sendMessage(
        msg.from.id,
        defaultModel
          ? `O modelo padrão atual é: ${defaultModel.name}`
          : 'Nenhum modelo padrão configurado.'
      );
      return;
    }

    const model = await ModelRepository.findByName(modelName);
    if (!model) {
      await TelegramService.sendMessage(
        msg.from.id,
        'Modelo não encontrado. Por favor, use um modelo válido.'
      );
      return;
    }

    await ModelRepository.setDefault(model.id);
    await TelegramService.sendMessage(
      msg.from.id,
      `Modelo padrão alterado para: ${model.name}`
    );
  },
};

export const helpCommand = {
  command: 'help',
  description: 'Mostrar ajuda sobre os comandos',
  handler: async (msg: TelegramMessage) => {
    const helpText = `
Comandos disponíveis:

/start - Iniciar o bot e registrar usuário
/model - Escolher ou visualizar o modelo atual
/help - Mostrar esta mensagem de ajuda

Para conversar, simplesmente envie uma mensagem.
Para continuar um contexto, responda a uma mensagem anterior.
Para incluir uma imagem na conversa, envie a imagem com uma descrição.

Seu ID: ${msg.from.id}
    `.trim();

    await TelegramService.sendMessage(msg.from.id, helpText);
  },
};

export const commands = [
  startCommand,
  modelCommand,
  helpCommand,
];
