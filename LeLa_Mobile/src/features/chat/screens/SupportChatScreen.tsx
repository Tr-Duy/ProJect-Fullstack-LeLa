import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import chatService, {
  AiChatMessage,
  ChatMessage,
  ChatConversation,
} from '../services/chatService';
import { useAuth } from '../../auth/context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

type ChatTab = 'AI' | 'ADMIN';

const AI_QUICK_PROMPTS = [
  {
    label: '📚 Giải thích từ vựng',
    prompt: 'Hãy giải thích nghĩa, cách phát âm, ví dụ câu và từ đồng nghĩa của từ vựng này trong đề thi TOEIC: ',
  },
  {
    label: '✍️ Sửa câu & Ngữ pháp',
    prompt: 'Hãy kiểm tra và sửa lỗi ngữ pháp giúp tôi trong câu tiếng Anh sau: ',
  },
  {
    label: '🧠 5 cụm từ Collocation',
    prompt: 'Cho tôi 5 cụm Collocations thông dụng nhất trong Part 5 TOEIC kèm giải thích và ví dụ.',
  },
  {
    label: '💬 Luyện phản xạ hội thoại',
    prompt: 'Hãy đóng vai đồng nghiệp người Mỹ trò chuyện ngắn với tôi tại văn phòng làm việc nhé!',
  },
];

const ADMIN_FAQ_TOPICS = [
  'Tôi đã chuyển khoản VietQR SePay nhưng tài khoản chưa được kích hoạt gói Pro?',
  'Làm sao để làm lại bài thi TOEIC khi chưa hết thời gian chờ cooldown?',
  'Hướng dẫn cách ôn tập theo thuật toán ngắt quãng Spaced Repetition (SRS)?',
  'Tôi muốn cập nhật email và số điện thoại liên kết tài khoản?',
];

export const SupportChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isDark, colors } = useTheme();

  const [activeTab, setActiveTab] = useState<ChatTab>('AI');

  // State phân hệ AI
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // State phân hệ Admin
  const [adminConversation, setAdminConversation] = useState<ChatConversation | null>(null);
  const [adminMessages, setAdminMessages] = useState<ChatMessage[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(false);
  const [isAdminConnecting, setIsAdminConnecting] = useState<boolean>(true);

  // Ô nhập văn bản
  const [inputText, setInputText] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Khởi tạo dữ liệu
  useEffect(() => {
    loadAiHistory();
    initAdminChat();

    return () => {
      stopPolling();
      Speech.stop();
    };
  }, []);

  // Xử lý Polling tin nhắn Admin khi chuyển tab
  useEffect(() => {
    if (activeTab === 'ADMIN' && adminConversation) {
      startPolling(adminConversation.id);
    } else {
      stopPolling();
      Speech.stop();
    }
  }, [activeTab, adminConversation]);

  const loadAiHistory = async () => {
    const history = await chatService.getAiHistory();
    if (history.length > 0) {
      setAiMessages(history);
    } else {
      // Tin nhắn chào mặc định từ AI Tutor
      const welcome: AiChatMessage = {
        id: 'ai-welcome',
        role: 'ai',
        content: `Xin chào ${user?.fullName || user?.username || 'bạn'}! 👋 Mình là LeLa AI Tutor.\n\nMình có thể giải đáp chi tiết từ vựng, ngữ pháp TOEIC, chấm bài viết và luyện phản xạ giao tiếp tiếng Anh 24/7 cùng bạn. Bạn muốn học nội dung gì hôm nay?`,
        timestamp: new Date().toISOString(),
      };
      setAiMessages([welcome]);
      await chatService.saveAiHistory([welcome]);
    }
  };

  const initAdminChat = async () => {
    setIsAdminConnecting(true);
    try {
      const conv = await chatService.startOrGetLearnerChat();
      setAdminConversation(conv);
      if (conv?.id) {
        const msgs = await chatService.getAdminChatMessages(conv.id);
        setAdminMessages(msgs);
      }
    } catch (e) {
      console.warn('[SupportChatScreen] Lỗi kết nối phiên chat Admin:', e);
    } finally {
      setIsAdminConnecting(false);
    }
  };

  const startPolling = (convId: number) => {
    stopPolling();
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const latest = await chatService.getAdminChatMessages(convId);
        if (latest && latest.length > 0) {
          setAdminMessages(latest);
        }
      } catch {
        // Ignored polling errors
      }
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');

    if (activeTab === 'AI') {
      await handleSendAi(text);
    } else {
      await handleSendAdmin(text);
    }
  };

  // Gửi tin nhắn đến Gia sư AI
  const handleSendAi = async (text: string) => {
    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const tempAiId = `ai-${Date.now()}`;
    const initialAiMsg: AiChatMessage = {
      id: tempAiId,
      role: 'ai',
      content: 'Đang suy nghĩ...',
      timestamp: new Date().toISOString(),
    };

    const updatedList = [...aiMessages, userMsg, initialAiMsg];
    setAiMessages(updatedList);
    setIsAiLoading(true);

    try {
      const finalReply = await chatService.sendAiMessage(text, (streamed) => {
        setAiMessages((prev) =>
          prev.map((m) => (m.id === tempAiId ? { ...m, content: streamed } : m))
        );
      });

      const finalList = updatedList.map((m) =>
        m.id === tempAiId ? { ...m, content: finalReply } : m
      );
      setAiMessages(finalList);
      await chatService.saveAiHistory(finalList);
    } catch (error: any) {
      const errorMsg =
        error?.message || 'Gia sư AI đang quá tải tạm thời. Vui lòng thử lại sau giây lát.';
      setAiMessages((prev) =>
        prev.map((m) => (m.id === tempAiId ? { ...m, content: errorMsg } : m))
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Gửi tin nhắn đến Hỗ trợ Admin
  const handleSendAdmin = async (text: string) => {
    if (!adminConversation?.id) {
      Alert.alert('Chưa kết nối', 'Đang thiết lập phiên hỗ trợ với Admin. Vui lòng chờ 2 giây.');
      return;
    }

    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: adminConversation.id,
      senderType: 'LEARNER',
      content: text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setAdminMessages((prev) => [...prev, optimisticMsg]);
    setIsAdminLoading(true);

    try {
      const sent = await chatService.sendMessageToAdmin(adminConversation.id, text);
      if (sent) {
        setAdminMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? sent : m))
        );
      }
    } catch (err: any) {
      Alert.alert('Lỗi gửi tin', err?.message || 'Không thể gửi tin nhắn đến ban quản trị.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Phát âm thanh tin nhắn bằng expo-speech
  const handleToggleSpeak = async (msgId: string, content: string) => {
    if (speakingMessageId === msgId) {
      await Speech.stop();
      setSpeakingMessageId(null);
      return;
    }

    await Speech.stop();
    setSpeakingMessageId(msgId);

    // Lọc bỏ ký tự markdown thừa trước khi đọc
    const cleanText = content.replace(/[*_#`~]/g, '');

    Speech.speak(cleanText, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  };

  const userInitial = (user?.fullName || user?.username || 'H').trim().charAt(0).toUpperCase();

  // Render bong bóng tin nhắn AI
  const renderAiItem = ({ item }: { item: AiChatMessage }) => {
    const isUser = item.role === 'user';
    const isSpeaking = speakingMessageId === item.id;

    return (
      <View style={[styles.messageRow, isUser ? styles.rowUser : styles.rowBot]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={17} color="#FFFFFF" />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser
              ? styles.bubbleUser
              : [styles.bubbleBot, { backgroundColor: colors.card, borderColor: colors.border }],
          ]}
        >
          {/* Header trong bong bóng AI */}
          {!isUser && (
            <View style={styles.aiLabelRow}>
              <Ionicons name="sparkles" size={12} color="#8B5CF6" />
              <Text style={styles.aiSenderLabel}>Gia Sư AI LeLa</Text>
            </View>
          )}

          <Text
            style={[
              styles.messageText,
              isUser ? styles.textUser : [styles.textBot, { color: colors.text }],
            ]}
          >
            {item.content}
          </Text>

          {/* Công cụ tiện ích cho tin nhắn AI */}
          {!isUser && (
            <View style={[styles.aiMessageFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.speakerBtn,
                  { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: colors.border },
                  isSpeaking && styles.speakerBtnActive,
                ]}
                onPress={() => handleToggleSpeak(item.id, item.content)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                  size={15}
                  color={isSpeaking ? '#EA580C' : '#8B5CF6'}
                />
                <Text
                  style={[
                    styles.speakerText,
                    { color: isDark ? '#CBD5E1' : '#64748B' },
                    isSpeaking && styles.speakerTextActive,
                  ]}
                >
                  {isSpeaking ? 'Đang phát...' : 'Nghe đọc'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{userInitial}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render bong bóng tin nhắn Admin
  const renderAdminItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.senderType === 'LEARNER' || item.senderType === 'GUEST';

    return (
      <View style={[styles.messageRow, isUser ? styles.rowUser : styles.rowBot]}>
        {!isUser && (
          <View style={[styles.botAvatar, { backgroundColor: '#0284C7' }]}>
            <Ionicons name="headset" size={17} color="#FFFFFF" />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser
              ? styles.bubbleUser
              : [styles.bubbleAdmin, { backgroundColor: colors.card, borderColor: isDark ? '#0369A1' : '#BAE6FD' }],
          ]}
        >
          {!isUser && <Text style={styles.senderLabel}>Quản Trị Viên LeLa</Text>}
          <Text
            style={[
              styles.messageText,
              isUser ? styles.textUser : [styles.textBot, { color: colors.text }],
            ]}
          >
            {item.content}
          </Text>
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{userInitial}</Text>
          </View>
        )}
      </View>
    );
  };

  const isSending = activeTab === 'AI' ? isAiLoading : isAdminLoading;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: activeTab === 'AI' ? '#7C3AED' : '#EA580C' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>
            {activeTab === 'AI' ? 'Gia Sư AI LeLa' : 'Trung Tâm Hỗ Trợ Admin'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'AI'
              ? 'Giải đáp ngữ pháp & từ vựng thông minh 24/7'
              : isAdminConnecting
              ? 'Đang kết nối ban quản trị...'
              : '🟢 Hỗ trợ trực tuyến 24/7'}
          </Text>
        </View>

        {activeTab === 'AI' && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              Alert.alert('Xóa hội thoại AI', 'Bạn có muốn làm mới phiên trò chuyện cùng Gia sư AI?', [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Xóa làm mới',
                  style: 'destructive',
                  onPress: async () => {
                    await chatService.clearAiHistory();
                    await loadAiHistory();
                  },
                },
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Top Segmented Tab Switcher */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'AI' && [
              styles.tabButtonActiveAi,
              { backgroundColor: isDark ? '#3B0764' : '#F3E8FF', borderColor: '#8B5CF6' },
            ],
          ]}
          onPress={() => setActiveTab('AI')}
          activeOpacity={0.8}
        >
          <View style={[styles.tabIconCircle, activeTab === 'AI' && { backgroundColor: '#8B5CF6' }]}>
            <Ionicons
              name="sparkles"
              size={14}
              color={activeTab === 'AI' ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.tabText,
              activeTab === 'AI' && { color: isDark ? '#E9D5FF' : '#7C3AED', fontWeight: '800' },
            ]}
          >
            Gia Sư AI Tutor
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'ADMIN' && [
              styles.tabButtonActiveAdmin,
              { backgroundColor: isDark ? '#431407' : '#FFF7ED', borderColor: '#EA580C' },
            ],
          ]}
          onPress={() => setActiveTab('ADMIN')}
          activeOpacity={0.8}
        >
          <View style={[styles.tabIconCircle, activeTab === 'ADMIN' && { backgroundColor: '#EA580C' }]}>
            <Ionicons
              name="headset"
              size={14}
              color={activeTab === 'ADMIN' ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <Text
            style={[
              styles.tabText,
              activeTab === 'ADMIN' && { color: '#EA580C', fontWeight: '800' },
            ]}
          >
            Hỗ Trợ Admin
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Khu vực danh sách tin nhắn */}
        {activeTab === 'AI' ? (
          <FlatList
            ref={flatListRef}
            data={aiMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderAiItem}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              isAiLoading ? (
                <View style={[styles.typingIndicator, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={[styles.typingText, { color: colors.subtext }]}>Gia sư AI đang suy nghĩ câu trả lời...</Text>
                </View>
              ) : undefined
            }
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={adminMessages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAdminItem}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={[styles.emptyAdminBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="chatbubbles-outline" size={44} color="#94A3B8" />
                <Text style={[styles.emptyAdminTitle, { color: colors.text }]}>Kênh Hỗ Trợ Học Viên Trực Tuyến</Text>
                <Text style={[styles.emptyAdminDesc, { color: colors.subtext }]}>
                  Bạn đang gặp thắc mắc về khóa học, bài thi TOEIC hay nạp tiền kích hoạt gói? Hãy gửi tin nhắn cho Ban quản trị ngay bên dưới:
                </Text>

                <View style={styles.faqList}>
                  {ADMIN_FAQ_TOPICS.map((faq, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.faqItem,
                        { backgroundColor: isDark ? '#082F49' : '#F0F9FF', borderColor: isDark ? '#0369A1' : '#BAE6FD' },
                      ]}
                      onPress={() => setInputText(faq)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="help-circle-outline" size={16} color="#0284C7" />
                      <Text style={[styles.faqText, { color: isDark ? '#BAE6FD' : '#0369A1' }]}>{faq}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
          />
        )}

        {/* Thanh gợi ý câu hỏi nhanh (Quick Prompts) cho AI */}
        {activeTab === 'AI' && aiMessages.length <= 4 && !isAiLoading && (
          <View style={[styles.quickPromptsWrap, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.quickPromptsHeader}>
              <Ionicons name="sparkles" size={13} color="#8B5CF6" />
              <Text style={[styles.quickPromptsTitle, { color: colors.subtext }]}>Gợi ý câu hỏi nhanh cho AI:</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={AI_QUICK_PROMPTS}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.promptChip,
                    { backgroundColor: isDark ? '#334155' : '#F8FAFC', borderColor: colors.border },
                  ]}
                  onPress={() => setInputText(item.prompt)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.promptChipText, { color: colors.text }]}>{item.label}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.promptsContent}
            />
          </View>
        )}

        {/* Thanh nhập liệu (Input Bar) */}
        <View style={[styles.inputBarContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#334155' : '#F8FAFC',
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              activeTab === 'AI'
                ? 'Hỏi AI về từ vựng, ngữ pháp TOEIC...'
                : 'Nhập nội dung cần Admin hỗ trợ...'
            }
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: activeTab === 'AI' ? '#8B5CF6' : '#EA580C' },
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flexOne: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  clearBtn: {
    padding: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  tabButtonActiveAi: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
  },
  tabButtonActiveAdmin: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#EA580C',
  },
  tabIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowBot: {
    justifyContent: 'flex-start',
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: '#EA580C',
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  bubbleAdmin: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  aiSenderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  textBot: {
    color: '#0F172A',
    fontWeight: '400',
  },
  aiMessageFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  speakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  speakerBtnActive: {
    backgroundColor: '#FFEDD5',
    borderColor: '#FED7AA',
  },
  speakerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  speakerTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  emptyAdminBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyAdminTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 6,
  },
  emptyAdminDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  faqList: {
    width: '100%',
    gap: 8,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  faqText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
    flex: 1,
  },
  quickPromptsWrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
  },
  quickPromptsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  quickPromptsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  promptsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  promptChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 14,
    color: '#0F172A',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
});

export default SupportChatScreen;
