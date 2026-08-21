import { useAiChatContext } from '../context/AiChatContext';

export const useAiStream = () => {
  return useAiChatContext();
};
