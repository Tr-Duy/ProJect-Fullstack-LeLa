import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer } from 'antd';
import { useAiStream } from '../hooks/useAiStream';
import { AiChatProvider } from '../context/AiChatContext';
import { profileApi } from '../../users/api/profile.api';
import { deckEnrollmentsApi } from '../../study-content/api/deck-enrollments.api';
import { TutorHeader } from '../components/TutorHeader';
import { MessageList } from '../components/MessageList';
import { Composer } from '../components/Composer';
import { ContextPanel } from '../components/ContextPanel';
import type { AiMode } from '../components/AiTutorNavigationTabs';

const formatPromptByMode = (text: string, mode: AiMode): string => {
  const clean = text.trim();
  switch (mode) {
    case 'translation':
      return `Bạn là chuyên gia dịch thuật Tiếng Anh - Tiếng Việt chuyên nghiệp. Hãy dịch chuẩn xác đoạn văn sau sang ngôn ngữ tương ứng (nếu tiếng Anh thì dịch sang tiếng Việt tự nhiên, nếu tiếng Việt thì dịch sang tiếng Anh chuẩn), kèm lưu ý nếu có:\n\n"${clean}"`;

    case 'vocabulary':
      return `Bạn là Chuyên gia Từ vựng LeLa. Hãy phân tích chuyên sâu cho từ vựng Tiếng Anh: "${clean}".

Yêu cầu định dạng phản hồi:
1. **Từ vựng & Phiên âm IPA:**
2. **Loại từ & Định nghĩa Tiếng Việt:**
3. **2 Câu ví dụ thực tế kèm dịch nghĩa:**
4. **Từ đồng nghĩa (Synonyms) & Từ trái nghĩa (Antonyms):**
5. **Collocations (Từ kết hợp phổ biến):**
6. **Mẹo ghi nhớ nhanh:**`;

    case 'sentence':
      return `Bạn là Chuyên gia Ngữ pháp & Biên tập Tiếng Anh LeLa. Hãy sửa lỗi cho câu sau:

"${clean}"

Yêu cầu định dạng phản hồi:
1. **❌ Câu gốc của bạn:** (Chỉ ra lỗi sai nếu có)
2. **✅ Câu chuẩn ngữ pháp:**
3. **💡 Diễn đạt tự nhiên hơn (Natural Version):**
4. **🧠 Giải thích ngắn gọn lỗi sai & lý do sửa:**`;

    case 'grammar':
      return `Bạn là Giảng viên Ngữ pháp Tiếng Anh LeLa. Hãy giải thích chi tiết điểm ngữ pháp hoặc cấu trúc sau:

"${clean}"

Yêu cầu định dạng phản hồi:
1. **Tên cấu trúc & Công thức tổng quát:**
2. **Khi nào sử dụng (Ngữ cảnh chính):**
3. **3 Câu ví dụ minh họa thực tế kèm dịch nghĩa:**
4. **Các lỗi sai thường gặp của người học (Common Pitfalls):**
5. **Mẹo nhớ nhanh:**`;

    case 'conversation':
      return `Chúng ta hãy bắt đầu một phiên LUYỆN HỘI THOẠI TIẾNG ANH (ROLEPLAY) về chủ đề: "${clean}".

Quy tắc đối thoại:
1. Bạn đóng vai nhân vật đối thoại tự nhiên, thân thiện.
2. Mỗi lần tôi trả lời, hãy nhận xét ngắn gọn về câu của tôi (diễn đạt có tự nhiên không, ngữ pháp đúng chưa) rồi gửi câu hỏi tiếp theo.
3. Hãy bắt đầu ngay bây giờ bằng 1 câu chào và đặt 1 câu hỏi đầu tiên!`;

    case 'chat':
    default:
      return clean;
  }
};

const AiChatPageContent: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AiMode>('chat');
  const [inputValue, setInputValue] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('lela_ai_sound_enabled') !== 'false';
  });

  const streamState = useAiStream();

  // Profile
  const { data: profileResponse } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMe,
    staleTime: 5 * 60 * 1000,
  });
  const currentLevelName = profileResponse?.data?.currentLevel?.name;

  // Enrolled deck for dynamic card suggestion
  const { data: enrollmentsResponse } = useQuery({
    queryKey: ['my-enrollments-summary'],
    queryFn: () => deckEnrollmentsApi.getMyList({ size: 1 }),
    staleTime: 2 * 60 * 1000,
  });
  const firstDeck = enrollmentsResponse?.data?.content?.[0];
  const suggestedDeck = useMemo(() => {
    if (!firstDeck) return undefined;
    return {
      title: firstDeck.deckTitle || `Bộ thẻ #${firstDeck.deckId}`,
    };
  }, [firstDeck]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('lela_ai_sound_enabled', String(next));
      if (!next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  const handleSend = (text: string) => {
    const formattedPrompt = formatPromptByMode(text, activeMode);
    streamState.sendMessage(formattedPrompt);
  };

  const handleQuickAsk = (prompt: string) => {
    setIsDrawerOpen(false);
    streamState.sendMessage(prompt);
  };

  const handleSelectSuggestion = (text: string, mode: AiMode) => {
    setActiveMode(mode);
    setInputValue(text);
  };

  const handleRegenerate = () => {
    if (streamState.isGenerating) return;
    const lastUserMessage = [...streamState.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      streamState.sendMessage(lastUserMessage.content);
    }
  };

  const handleNewChat = () => {
    streamState.stopGeneration();
    streamState.clearMessages();
    setInputValue('');
    setActiveMode('chat');
  };

  return (
    <div className="flex h-full min-h-0 gap-5">
      {/* Main Chat Column */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] sm:rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
        {/* Header (56px) */}
        <TutorHeader
          currentLevelName={currentLevelName}
          isGenerating={streamState.isLoading || streamState.isGenerating}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onNewChat={handleNewChat}
          onClearChat={handleNewChat}
          onOpenContext={() => setIsDrawerOpen(true)}
        />

        {/* Message List (Scrolls independently) */}
        <MessageList
          messages={streamState.messages}
          isLoading={streamState.isLoading}
          isGenerating={streamState.isGenerating}
          error={streamState.error}
          onRegenerate={handleRegenerate}
          onSelectSuggestion={handleSelectSuggestion}
          suggestedDeck={suggestedDeck}
        />

        {/* Composer with mode chips and auto-expanding input */}
        <Composer
          inputValue={inputValue}
          setInputValue={setInputValue}
          activeMode={activeMode}
          onModeChange={setActiveMode}
          isGenerating={streamState.isLoading || streamState.isGenerating}
          onSend={handleSend}
          onStop={streamState.stopGeneration}
        />
      </section>

      {/* Desktop Context Column (>= 1280px) */}
      <aside className="hidden w-[296px] shrink-0 flex-col gap-4 overflow-y-auto xl:flex">
        <ContextPanel onQuickAsk={handleQuickAsk} />
      </aside>

      {/* Mobile / Tablet Context Drawer (< 1280px) */}
      <Drawer
        title={
          <span className="font-heading font-semibold text-[15px] text-[var(--text)]">
            Bối cảnh học tập
          </span>
        }
        placement="right"
        width={320}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        styles={{
          body: {
            padding: '16px',
            backgroundColor: 'var(--bg)',
          },
        }}
      >
        <ContextPanel onQuickAsk={handleQuickAsk} />
      </Drawer>
    </div>
  );
};

export const AiChatPage: React.FC = () => {
  return (
    <AiChatProvider>
      <AiChatPageContent />
    </AiChatProvider>
  );
};

export default AiChatPage;
