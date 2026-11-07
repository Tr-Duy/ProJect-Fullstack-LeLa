import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { voiceService } from '../services/voiceService';
import {
  VoiceStartResponse,
  VoiceTurnResponse,
  VoiceTargetWordDto,
} from '../../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'VoiceConversation'>;
type RouteProps = RouteProp<RootStackParamList, 'VoiceConversation'>;

interface MessageItem {
  id: string;
  sender: 'AI' | 'USER';
  text: string;
  timestamp: Date;
  grammarErrors?: string[];
  correctedSentence?: string;
  quickSuggestion?: string;
}

export const VoiceConversationScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { initialSession, scenarioTitle } = route.params || {};

  // Trạng thái phiên đàm thoại
  const [loading, setLoading] = useState<boolean>(!initialSession);
  const [session, setSession] = useState<VoiceStartResponse | null>(initialSession || null);
  const [targetWords, setTargetWords] = useState<VoiceTargetWordDto[]>(initialSession?.targetWords || []);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  // Trạng thái nhập liệu và giọng nói
  const [inputText, setInputText] = useState<string>('');
  const [isKeyboardMode, setIsKeyboardMode] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeakingAi, setIsSpeakingAi] = useState<boolean>(false);

  // Animation hiệu ứng xung nhịp nút Micro
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<any>(null);
  const turnStartTimeRef = useRef<number>(Date.now());

  // 1. Khởi tạo phiên đàm thoại và phát lời chào AI
  useEffect(() => {
    let isMounted = true;

    const initConversation = async () => {
      let currentSession = initialSession;
      if (!currentSession) {
        try {
          setLoading(true);
          currentSession = await voiceService.startSession();
          if (!isMounted) return;
          setSession(currentSession);
          setTargetWords(currentSession.targetWords || []);
        } catch (error: any) {
          console.error('Lỗi khởi tạo hội thoại:', error);
          Alert.alert(
            'Lỗi kết nối',
            error?.response?.data?.message || 'Không thể tạo phòng đàm thoại với AI Tutor.',
            [{ text: 'Quay lại', onPress: () => navigation.goBack() }]
          );
          return;
        } finally {
          if (isMounted) setLoading(false);
        }
      }

      // Thêm câu chào mở đầu của AI vào luồng tin nhắn
      if (currentSession && currentSession.openingLine) {
        const welcomeMessage: MessageItem = {
          id: 'opening_ai',
          sender: 'AI',
          text: currentSession.openingLine,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);

        // Tự động phát âm lời chào bằng tiếng Anh bản xứ
        playSpeech(currentSession.openingLine);
      }
    };

    initConversation();

    return () => {
      isMounted = false;
      Speech.stop();
    };
  }, [initialSession]);

  // 2. Quản lý hiệu ứng xung nhịp (Pulsing Animation) của Micro
  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      loopAnim.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (loopAnim) loopAnim.stop();
    };
  }, [isRecording]);

  // 3. Hàm phát âm bản xứ câu thoại AI
  const playSpeech = (text: string) => {
    try {
      Speech.stop();
      setIsSpeakingAi(true);
      Speech.speak(text, {
        language: 'en-US',
        rate: 0.95,
        onDone: () => setIsSpeakingAi(false),
        onStopped: () => setIsSpeakingAi(false),
        onError: () => setIsSpeakingAi(false),
      });
    } catch (e) {
      setIsSpeakingAi(false);
    }
  };

  // 4. Xử lý gửi lượt thoại
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || !session || isAiResponding) return;

    // Ngắt âm thanh đang đọc nếu có
    Speech.stop();
    setIsSpeakingAi(false);

    // 1. Thêm tin nhắn của User vào khung chat
    const userMsgId = `user_${Date.now()}`;
    const userMessage: MessageItem = {
      id: userMsgId,
      sender: 'USER',
      text: content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsAiResponding(true);

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - turnStartTimeRef.current) / 1000));
    turnStartTimeRef.current = Date.now();

    // Cuộn xuống tin nhắn mới nhất
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // 2. Gửi lên Backend Spring Boot
      const turnResponse: VoiceTurnResponse = await voiceService.sendTurn(
        session.publicId,
        content,
        elapsedSeconds
      );

      // Cập nhật trạng thái Target Words nếu có
      if (turnResponse.updatedTargetWords && turnResponse.updatedTargetWords.length > 0) {
        setTargetWords(turnResponse.updatedTargetWords);
      }

      // Gắn thông tin sửa lỗi / gợi ý vào tin nhắn User vừa gửi
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMsgId
            ? {
                ...msg,
                grammarErrors: turnResponse.grammarErrors,
                correctedSentence: turnResponse.correctedSentence,
                quickSuggestion: turnResponse.quickSuggestion,
              }
            : msg
        )
      );

      // 3. Thêm phản hồi của AI vào khung chat
      const aiMessage: MessageItem = {
        id: `ai_${Date.now()}`,
        sender: 'AI',
        text: turnResponse.aiReply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setCurrentTurn(turnResponse.turnNumber || currentTurn + 1);

      // 4. Phát âm thanh đọc phản hồi AI
      playSpeech(turnResponse.aiReply);

      // Cuộn xuống tin nhắn mới
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);

      // Kiểm tra nếu phiên kết thúc tự động từ Backend
      if (turnResponse.sessionEnded) {
        Alert.alert(
          'Hoàn thành tình huống',
          'Bạn đã hoàn thành đủ số lượt trao đổi của tình huống này. Hãy xem kết quả đánh giá nhé!',
          [{ text: 'Xem kết quả', onPress: () => handleFinishSession() }]
        );
      }
    } catch (error: any) {
      console.error('Lỗi khi gửi lượt thoại:', error);
      Alert.alert(
        'Lỗi gửi tin nhắn',
        error?.response?.data?.message || 'AI Tutor đang bận. Vui lòng thử gửi lại câu nói của bạn.'
      );
    } finally {
      setIsAiResponding(false);
    }
  };

  // 5. Xử lý mô phỏng thu âm giọng nói (Speech-to-Text)
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // Kết thúc thu âm -> tự động gửi tin nhắn nếu có nội dung
      if (inputText.trim().length > 0) {
        handleSendMessage();
      }
    } else {
      // Bắt đầu ghi nhận giọng nói
      Speech.stop();
      setIsRecording(true);
    }
  };

  // 6. Kết thúc cuộc gọi và chuyển sang màn hình Báo cáo
  const handleFinishSession = () => {
    Alert.alert(
      'Kết thúc đàm thoại',
      'Bạn có muốn kết thúc phiên đàm thoại và nhận báo cáo đánh giá năng lực từ AI Tutor không?',
      [
        { text: 'Tiếp tục nói', style: 'cancel' },
        {
          text: 'Kết thúc & Nhận điểm',
          style: 'default',
          onPress: async () => {
            if (!session) return;
            try {
              setIsFinishing(true);
              Speech.stop();
              const report = await voiceService.finishSession(session.publicId, 'COMFORTABLE');

              navigation.replace('VoiceReport', {
                report,
                scenarioTitle: session.scenarioTitle || scenarioTitle || 'Luyện nói AI',
              });
            } catch (error: any) {
              console.error('Lỗi kết thúc phiên đàm thoại:', error);
              Alert.alert(
                'Lỗi kết thúc',
                error?.response?.data?.message || 'Không thể tổng kết phiên đàm thoại. Vui lòng thử lại.'
              );
            } finally {
              setIsFinishing(false);
            }
          },
        },
      ]
    );
  };

  // 7. Thoát giữa chừng
  const handleExit = () => {
    Alert.alert(
      'Thoát phòng luyện nói?',
      'Nếu thoát bây giờ, lượt đàm thoại này sẽ bị hủy bỏ.',
      [
        { text: 'Ở lại', style: 'cancel' },
        {
          text: 'Thoát ra',
          style: 'destructive',
          onPress: async () => {
            Speech.stop();
            if (session) {
              await voiceService.abandonSession(session.publicId);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Đang kết nối phòng đàm thoại AI Tutor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. Header cuộc gọi đàm thoại */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={handleExit} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color="#334155" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {session?.scenarioTitle || scenarioTitle || 'Luyện nói AI Tutor'}
          </Text>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AI Online • Lượt {currentTurn}/{session?.maxTurns || 8}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.finishCallBtn}
          onPress={handleFinishSession}
          disabled={isFinishing}
          activeOpacity={0.8}
        >
          {isFinishing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="call" size={14} color="#ffffff" />
              <Text style={styles.finishCallBtnText}>Kết thúc</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Dải từ vựng mục tiêu (Target Words Bar) */}
      {targetWords.length > 0 && (
        <View style={styles.targetWordsBar}>
          <Text style={styles.targetWordsLabel}>Từ mục tiêu:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.targetWordsScroll}>
            {targetWords.map((tw, idx) => (
              <View
                key={tw.flashcardId || idx}
                style={[
                  styles.targetWordPill,
                  tw.usedCorrectly && styles.targetWordPillUsed,
                ]}
              >
                <Text
                  style={[
                    styles.targetWordPillText,
                    tw.usedCorrectly && styles.targetWordPillTextUsed,
                  ]}
                >
                  {tw.word}
                </Text>
                {tw.usedCorrectly && (
                  <Ionicons name="checkmark-circle" size={13} color="#16a34a" style={{ marginLeft: 3 }} />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 3. Danh sách bong bóng tin nhắn (Chat Transcript Area) */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.chatScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isAI = msg.sender === 'AI';

          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isAI ? styles.messageRowAi : styles.messageRowUser,
              ]}
            >
              {isAI && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={18} color="#8B5CF6" />
                </View>
              )}

              <View style={[styles.bubbleWrapper, isAI ? styles.bubbleWrapperAi : styles.bubbleWrapperUser]}>
                <View
                  style={[
                    styles.bubble,
                    isAI ? styles.bubbleAi : styles.bubbleUser,
                  ]}
                >
                  <Text style={[styles.bubbleText, isAI ? styles.bubbleTextAi : styles.bubbleTextUser]}>
                    {msg.text}
                  </Text>

                  {/* Nút nghe lại lời thoại AI */}
                  {isAI && (
                    <TouchableOpacity
                      style={styles.speakerBtn}
                      onPress={() => playSpeech(msg.text)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSpeakingAi ? 'volume-high' : 'volume-medium-outline'}
                        size={18}
                        color="#16a34a"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Thẻ gợi ý / Sửa lỗi ngữ pháp của AI bên dưới câu nói của user */}
                {!isAI && (msg.correctedSentence || (msg.grammarErrors && msg.grammarErrors.length > 0)) && (
                  <View style={styles.correctionCard}>
                    <View style={styles.correctionHeader}>
                      <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                      <Text style={styles.correctionTitle}>Góp ý ngữ pháp từ AI:</Text>
                    </View>

                    {msg.correctedSentence ? (
                      <Text style={styles.correctedText}>"{msg.correctedSentence}"</Text>
                    ) : null}

                    {msg.grammarErrors && msg.grammarErrors.length > 0 ? (
                      <View style={styles.errorTagsRow}>
                        {msg.grammarErrors.map((err, errIdx) => (
                          <View key={errIdx} style={styles.errorTag}>
                            <Text style={styles.errorTagText}>{err}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {msg.quickSuggestion ? (
                      <TouchableOpacity
                        style={styles.suggestionBtn}
                        onPress={() => handleSendMessage(msg.quickSuggestion)}
                      >
                        <Text style={styles.suggestionBtnText}>
                          Gợi ý đáp lại: "{msg.quickSuggestion}"
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Trạng thái AI đang suy nghĩ */}
        {isAiResponding && (
          <View style={[styles.messageRow, styles.messageRowAi]}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={16} color="#16a34a" />
            </View>
            <View style={[styles.bubble, styles.bubbleAi, styles.aiThinkingBubble]}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={styles.aiThinkingText}>AI Tutor đang lắng nghe và suy nghĩ...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 4. Thanh tương tác giọng nói ở chân màn hình (KeyboardAvoidingView) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.footerContainer}
      >
        {isKeyboardMode ? (
          // Chế độ gõ phím nếu môi trường xung quanh ồn ào
          <View style={styles.keyboardInputRow}>
            <TouchableOpacity
              style={styles.modeSwitchBtn}
              onPress={() => setIsKeyboardMode(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="mic-outline" size={22} color="#16a34a" />
            </TouchableOpacity>

            <TextInput
              style={styles.keyboardTextInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập câu trả lời bằng tiếng Anh..."
              placeholderTextColor="#94a3b8"
              autoFocus={true}
              multiline={false}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
            />

            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isAiResponding}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          // Chế độ nút Micro lớn với hiệu ứng xung nhịp (Pulsing Animation)
          <View style={styles.voiceControlBar}>
            <TouchableOpacity
              style={styles.modeSwitchBtn}
              onPress={() => setIsKeyboardMode(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="keypad-outline" size={22} color="#64748b" />
            </TouchableOpacity>

            {/* Nút Micro lớn ở giữa */}
            <View style={styles.micWrapper}>
              <Animated.View
                style={[
                  styles.micPulseRing,
                  isRecording && styles.micPulseRingActive,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />

              <TouchableOpacity
                style={[styles.micBigBtn, isRecording && styles.micBigBtnActive]}
                onPress={handleToggleRecord}
                activeOpacity={0.8}
                disabled={isAiResponding}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={32}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>

            {/* Gợi ý nhập nhanh hoặc gửi */}
            <TouchableOpacity
              style={styles.quickVoiceSendBtn}
              onPress={() => {
                // Nhấn nút để gửi câu mẫu hoặc nhập nhanh
                Alert.prompt
                  ? Alert.prompt(
                      'Nhập câu đàm thoại',
                      'Nhập câu tiếng Anh bạn muốn nói với AI:',
                      (text) => text && handleSendMessage(text)
                    )
                  : setIsKeyboardMode(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="text-outline" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        {!isKeyboardMode && (
          <Text style={styles.voiceInstructionText}>
            {isRecording ? 'Đang lắng nghe... Nhấn dừng để gửi' : 'Nhấn vào Micro để bắt đầu nói'}
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 5,
  },
  liveText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  finishCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  finishCallBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  targetWordsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  targetWordsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 8,
  },
  targetWordsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  targetWordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  targetWordPillUsed: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  targetWordPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  targetWordPillTextUsed: {
    color: '#16a34a',
    fontWeight: '700',
  },
  chatScrollContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    borderWidth: 1.5,
    borderColor: '#D8B4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubbleWrapper: {
    maxWidth: '82%',
  },
  bubbleWrapperAi: {
    alignItems: 'flex-start',
  },
  bubbleWrapperUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  bubbleAi: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#16a34a',
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextAi: {
    color: '#0f172a',
    fontWeight: '500',
  },
  bubbleTextUser: {
    color: '#ffffff',
    fontWeight: '600',
  },
  speakerBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
    padding: 4,
  },
  aiThinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiThinkingText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  correctionCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3.5,
    borderLeftColor: '#8B5CF6',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    width: '100%',
  },
  correctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  correctionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    marginLeft: 6,
  },
  correctedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4C1D95',
    fontStyle: 'italic',
  },
  errorTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  errorTag: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  errorTagText: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '600',
  },
  suggestionBtn: {
    marginTop: 6,
    paddingVertical: 4,
  },
  suggestionBtnText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
  },
  footerContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  keyboardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyboardTextInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    maxHeight: 100,
  },
  modeSwitchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  voiceControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  micWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 80,
    height: 80,
  },
  micPulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(22, 163, 74, 0.25)',
  },
  micPulseRingActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
  },
  micBigBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  micBigBtnActive: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  quickVoiceSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceInstructionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 6,
  },
});
