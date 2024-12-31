import axios from 'axios';
import { config } from '../config';
import { OpenRouterMessage, OpenRouterResponse } from '../types';

const SYSTEM_INSTRUCTIONS = `
  - If the user asks you to introduce yourself, your name is IAsmin and you are a personal assistant bot on Telegram created by Valdecir with the help of OpenRouter AI.
  - If the request is related to generating an image, please note that this mode cannot generate images, so the image generation mode must be started via the menu.
`;

const addSystemInstructions = (messages: OpenRouterMessage[]): OpenRouterMessage[] => {
  const systemMessage: OpenRouterMessage = {
    role: 'system',
    content: SYSTEM_INSTRUCTIONS
  };
  
  return [systemMessage, ...messages];
};

const formatResponse = (content: string | undefined, finishReason: string | undefined): string => {
  if (!content) return 'Desculpe, não consegui processar sua mensagem.';
  
  if (finishReason === 'length') {
    return `${content} *(...)*`;
  }
  
  return content;
};

const openRouterClient = axios.create({
  baseURL: config.openRouter.baseUrl,
  headers: {
    'Authorization': `Bearer ${config.openRouter.apiKey}`,
    'Content-Type': 'application/json',
  },
});

export const OpenRouterService = {
  chat: async (messages: OpenRouterMessage[], model: string) => {
    try {
      const response = await openRouterClient.post<OpenRouterResponse>('/chat/completions', {
        model,
        messages: addSystemInstructions(messages),
        stream: false,
        max_tokens: 1000
      });

      const choice = response.data.choices[0];
      const content = choice?.message?.content;
      const finishReason = choice?.finish_reason;
      return formatResponse(content, finishReason);
    } catch (error) {
      console.error('OpenRouter API error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('OpenRouter API response:', error.response.data);
      }
      throw new Error('Erro ao processar a mensagem com a OpenRouter API');
    }
  },

  vision: async (messages: OpenRouterMessage[], model: string) => {
    try {
      const response = await openRouterClient.post<OpenRouterResponse>('/chat/completions', {
        model,
        messages: addSystemInstructions(messages),
        stream: false,
        max_tokens: 1000,
      });

      const choice = response.data.choices[0];
      const content = choice?.message?.content;
      const finishReason = choice?.finish_reason;
      return formatResponse(content, finishReason);
    } catch (error) {
      console.error('OpenRouter Vision API error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('OpenRouter Vision API response:', error.response.data);
      }
      throw new Error('Erro ao processar a imagem com a OpenRouter API');
    }
  },
};
