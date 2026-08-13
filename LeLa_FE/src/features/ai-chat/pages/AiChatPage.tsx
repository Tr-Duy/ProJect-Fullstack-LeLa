import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAiStream } from '../hooks/useAiStream';
import { profileApi } from '../../users/api/profile.api';
import { AiTutorHeader } from '../components/AiTutorHeader';
import { AiTutorNavigationTabs, type AiMode } from '../components/AiTutorNavigationTabs';
import { TranslationTool } from '../components/TranslationTool';
import { VocabularyTool } from '../components/VocabularyTool';
import { SentenceCorrectionTool } from '../components/SentenceCorrectionTool';
import { GrammarCoachTool } from '../components/GrammarCoachTool';
import { ConversationPracticeTool } from '../components/ConversationPracticeTool';
import { LeLaSupportTool } from '../components/LeLaSupportTool';
import { AiChatWindow } from '../components/AiChatWindow';

export const AiChatPage: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AiMode>('chat');
  const [lastToolResponse, setLastToolResponse] = useState<string>('');
  const streamState = useAiStream();

  const { data: profileResponse } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMe,
    staleTime: 5 * 60 * 1000,
  });

  const currentLevelName = profileResponse?.data?.currentLevel?.name;

  const handleToolSubmit = async (promptText: string) => {
    setLastToolResponse('');
    streamState.sendMessage(promptText);
  };

  // Sync streamState.messages last response to active tool view
  const lastAiMessage = [...streamState.messages].reverse().find((m) => m.role === 'ai');
  const displayResult = lastAiMessage?.content || lastToolResponse;

  return (
    <div className="min-h-screen bg-[#F4F3EE] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <AiTutorHeader currentLevelName={currentLevelName} />

        {/* Navigation Tabs */}
        <AiTutorNavigationTabs activeMode={activeMode} onModeChange={setActiveMode} />

        {/* Mode Content Workspace */}
        {activeMode === 'chat' && (
          <div className="bg-white rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_#000] h-[calc(100vh-16rem)] min-h-[550px] overflow-hidden">
            <AiChatWindow {...streamState} />
          </div>
        )}

        {activeMode === 'translation' && <TranslationTool />}

        {activeMode === 'vocabulary' && (
          <VocabularyTool
            onAnalyze={handleToolSubmit}
            isLoading={streamState.isLoading || streamState.isGenerating}
            resultText={displayResult}
          />
        )}

        {activeMode === 'sentence' && (
          <SentenceCorrectionTool
            onCorrect={handleToolSubmit}
            isLoading={streamState.isLoading || streamState.isGenerating}
            resultText={displayResult}
          />
        )}

        {activeMode === 'grammar' && (
          <GrammarCoachTool
            onExplain={handleToolSubmit}
            isLoading={streamState.isLoading || streamState.isGenerating}
            resultText={displayResult}
          />
        )}

        {activeMode === 'conversation' && (
          <div>
            <ConversationPracticeTool onStartRoleplay={handleToolSubmit} />
            {streamState.messages.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_0px_#000] h-[450px] overflow-hidden">
                <AiChatWindow {...streamState} />
              </div>
            )}
          </div>
        )}

        {activeMode === 'support' && <LeLaSupportTool />}
      </div>
    </div>
  );
};
