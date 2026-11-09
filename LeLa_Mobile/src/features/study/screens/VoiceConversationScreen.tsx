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
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { voiceService } from '../services/voiceService';
import { useTheme } from '../../../context/ThemeContext';
import {
  VoiceStartResponse,
  VoiceTurnResponse,
  VoiceTargetWordDto,
} from '../../../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'VoiceConversation'>;
type RouteProps = RouteProp<RootStackParamList, 'VoiceConversation'>;

export type TurnTakingState =
  | 'IDLE'
  | 'AI_SPEAKING'
  | 'WAITING_BUFFER'
  | 'USER_LISTENING'
  | 'PROCESSING';

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
  const { colors, isDark } = useTheme();
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

  // FSM State quản lý luồng âm thanh đàm thoại 2 chiều
  const [turnState, setTurnState] = useState<TurnTakingState>('IDLE');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  // Trạng thái nhập liệu và giọng nói
  const [inputText, setInputText] = useState<string>('');
  const [isKeyboardMode, setIsKeyboardMode] = useState<boolean>(false);
  const [isSpeakingAi, setIsSpeakingAi] = useState<boolean>(false);

  // Refs quản lý Audio Session & Hardware
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnStartTimeRef = useRef<number>(Date.now());
  const scrollViewRef = useRef<any>(null);

  // Animation hiệu ứng xung nhịp nút Micro
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 1. Cấu hình Audio Mode chuẩn cho đàm thoại 2 chiều (Không chiếm quyền độc chiếm)
  const configureAudioSession = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.warn('[VoiceConversation] Audio.setAudioModeAsync error:', error);
    }
  };

  // 2. Khởi tạo phiên đàm thoại và phát lời chào AI
  useEffect(() => {
    let isMounted = true;

    const initConversation = async () => {
      await configureAudioSession();

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
      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      Speech.stop().catch(() => {});
    };
  }, [initialSession]);

  // 3. Quản lý hiệu ứng xung nhịp (Pulsing Animation) & Bộ đếm giây của Micro
  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation | null = null;
    if (turnState === 'USER_LISTENING') {
      loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.28,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loopAnim.start();

      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (loopAnim) loopAnim.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [turnState]);

  // 4. Phát âm thanh bản xứ câu thoại AI với Turn-Taking State Machine và khoảng đệm 300ms
  const playSpeech = async (text: string) => {
    if (!text) return;

    try {
      // Dọn dẹp recording cũ nếu có trước khi phát âm thanh AI
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {}
        recordingRef.current = null;
      }

      await configureAudioSession();
      await Speech.stop();

      setTurnState('AI_SPEAKING');
      setIsSpeakingAi(true);

      Speech.speak(text, {
        language: 'en-US',
        rate: 0.95,
        onDone: () => {
          setIsSpeakingAi(false);
          setTurnState('WAITING_BUFFER');
          if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
          // Khoảng đệm an toàn 300ms để Android giải phóng hoàn toàn Audio Track
          waitingTimerRef.current = setTimeout(() => {
            setTurnState('IDLE');
          }, 300);
        },
        onStopped: () => {
          setIsSpeakingAi(false);
          setTurnState('IDLE');
        },
        onError: (err) => {
          console.warn('[VoiceConversation] Speech.speak onError:', err);
          setIsSpeakingAi(false);
          setTurnState('IDLE');
        },
      });
    } catch (e) {
      console.warn('[VoiceConversation] playSpeech error:', e);
      setIsSpeakingAi(false);
      setTurnState('IDLE');
    }
  };

  // 5. Bắt đầu ghi nhận giọng nói người dùng với expo-av
  const startRecording = async () => {
    if (turnState === 'AI_SPEAKING') {
      await Speech.stop();
      setIsSpeakingAi(false);
    }

    try {
      // Dọn dẹp instance cũ hoàn toàn để tránh rò rỉ bộ nhớ
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {}
        recordingRef.current = null;
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền Micro', 'Vui lòng cấp quyền micro để sử dụng tính năng luyện nói.');
        return;
      }

      await configureAudioSession();

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      recordingStartTimeRef.current = Date.now();
      setTurnState('USER_LISTENING');
    } catch (error) {
      console.error('[VoiceConversation] startRecording error:', error);
      setTurnState('IDLE');
      Alert.alert('Lỗi micro', 'Không thể khởi động micro. Vui lòng thử lại.');
    }
  };

  // 6. Dừng ghi âm và kiểm tra điều kiện tối thiểu 0.6 giây
  const stopRecording = async () => {
    if (!recordingRef.current) {
      setTurnState('IDLE');
      return;
    }

    const durationMs = Date.now() - recordingStartTimeRef.current;

    // Bộ đếm thời gian tối thiểu: nếu bản thu âm < 0.6 giây, coi như tiếng động phụ
    if (durationMs < 600) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
      setTurnState('IDLE');
      Alert.alert(
        'Bản ghi quá ngắn',
        'Bản thu âm của bạn dưới 0.6 giây. Hãy giữ nút Micro và nói câu hoàn chỉnh nhé!'
      );
      return;
    }

    try {
      setTurnState('PROCESSING');
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      console.log('[VoiceConversation] Ghi âm thành công, URI:', uri, 'Thời lượng:', durationMs);

      // Nếu người dùng đã gõ sẵn văn bản:
      if (inputText.trim().length > 0) {
        await handleSendMessage(inputText.trim());
      } else {
        // Kiểm tra câu gợi ý gần nhất từ AI hoặc từ mục tiêu
        const lastAiMsg = [...messages].reverse().find((m) => m.sender === 'AI');
        const fallbackText =
          lastAiMsg?.quickSuggestion ||
          targetWords.find((tw) => !tw.usedCorrectly)?.word;

        if (fallbackText) {
          Alert.alert(
            'Xác nhận câu đàm thoại',
            `Bạn có muốn gửi câu trả lời: "${fallbackText}" lên AI Tutor không?`,
            [
              {
                text: 'Nhập tay',
                style: 'cancel',
                onPress: () => {
                  setTurnState('IDLE');
                  setIsKeyboardMode(true);
                },
              },
              {
                text: 'Gửi câu này',
                style: 'default',
                onPress: () => handleSendMessage(fallbackText),
              },
            ]
          );
        } else {
          Alert.prompt
            ? Alert.prompt(
                'Nội dung đàm thoại',
                'Nhập câu tiếng Anh bạn vừa nói để AI đánh giá:',
                (text) => {
                  if (text && text.trim()) {
                    handleSendMessage(text.trim());
                  } else {
                    setTurnState('IDLE');
                  }
                }
              )
            : (() => {
                setTurnState('IDLE');
                setIsKeyboardMode(true);
              })();
        }
      }
    } catch (error) {
      console.error('[VoiceConversation] stopRecording error:', error);
      setTurnState('IDLE');
      recordingRef.current = null;
    }
  };

  // 7. Xử lý chạm nút Micro chính
  const handleToggleRecord = () => {
    if (turnState === 'PROCESSING' || isAiResponding) return;

    if (turnState === 'AI_SPEAKING') {
      // AI đang nói: ngắt lời AI, tạo khoảng đệm 250ms rồi bắt đầu thu âm
      Speech.stop();
      setIsSpeakingAi(false);
      setTurnState('WAITING_BUFFER');
      setTimeout(() => {
        startRecording();
      }, 250);
      return;
    }

    if (turnState === 'USER_LISTENING') {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 8. Xử lý gửi lượt thoại lên Backend Spring Boot
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || !session || isAiResponding) return;

    // Ngắt âm thanh đang đọc nếu có
    Speech.stop();
    setIsSpeakingAi(false);

    // Thêm tin nhắn của User vào khung chat
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
    setTurnState('PROCESSING');

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - turnStartTimeRef.current) / 1000));
    turnStartTimeRef.current = Date.now();

    // Cuộn xuống tin nhắn mới nhất
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
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

      // Thêm phản hồi của AI vào khung chat
      const aiMessage: MessageItem = {
        id: `ai_${Date.now()}`,
        sender: 'AI',
        text: turnResponse.aiReply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setCurrentTurn(turnResponse.turnNumber || currentTurn + 1);

      // Phát âm thanh đọc phản hồi AI qua turn-taking
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
      setTurnState('IDLE');
    } finally {
      setIsAiResponding(false);
    }
  };

  // 9. Kết thúc cuộc gọi và chuyển sang màn hình Báo cáo
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
              if (recordingRef.current) {
                try {
                  await recordingRef.current.stopAndUnloadAsync();
                } catch {}
                recordingRef.current = null;
              }
              const report = await voiceService.finishSession(session.publicId, 'COMFORTABLE');
              voiceService.getVoiceStatus().catch(() => {});

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

  // 10. Thoát giữa chừng
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
            if (recordingRef.current) {
              try {
                await recordingRef.current.stopAndUnloadAsync();
              } catch {}
              recordingRef.current = null;
            }
            if (session) {
              await voiceService.abandonSession(session.publicId);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  // Gợi ý nhanh từ câu gần nhất của AI
  const lastAiSuggestion = [...messages].reverse().find((m) => m.sender === 'AI')?.quickSuggestion;

  // Lấy nội dung hiển thị nút Micro theo FSM State
  const getMicButtonUi = () => {
    if (turnState === 'PROCESSING' || isAiResponding) {
      return {
        bgColor: '#64748b',
        icon: <ActivityIndicator size="small" color="#ffffff" />,
        text: 'AI đang phân tích câu nói của bạn...',
        ringColor: 'rgba(100, 116, 139, 0.2)',
      };
    }
    if (turnState === 'AI_SPEAKING') {
      return {
        bgColor: '#8B5CF6',
        icon: <Ionicons name="volume-high" size={28} color="#ffffff" />,
        text: 'AI Tutor đang nói... (Chạm để ngắt lời)',
        ringColor: 'rgba(139, 92, 246, 0.3)',
      };
    }
    if (turnState === 'WAITING_BUFFER') {
      return {
        bgColor: '#D97706',
        icon: <Ionicons name="mic-outline" size={28} color="#ffffff" />,
        text: 'Đang kết nối âm thanh...',
        ringColor: 'rgba(217, 119, 6, 0.25)',
      };
    }
    if (turnState === 'USER_LISTENING') {
      return {
        bgColor: '#dc2626',
        icon: <Ionicons name="stop" size={28} color="#ffffff" />,
        text: `Đang nghe bạn nói (${recordingSeconds}s)... Chạm để dừng & gửi`,
        ringColor: 'rgba(220, 38, 38, 0.35)',
      };
    }
    return {
      bgColor: '#16a34a',
      icon: <Ionicons name="mic" size={30} color="#ffffff" />,
      text: 'Nhấn vào Micro để bắt đầu nói',
      ringColor: 'rgba(22, 163, 74, 0.25)',
    };
  };

  const micUi = getMicButtonUi();

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={[styles.loadingText, { color: colors.subtext }]}>
          Đang kết nối phòng đàm thoại AI Tutor...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 1. Header cuộc gọi đàm thoại */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.headerBackBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
          onPress={handleExit}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {session?.scenarioTitle || scenarioTitle || 'Luyện nói AI Tutor'}
          </Text>
          <View style={styles.liveIndicatorRow}>
            <View
              style={[
                styles.liveDot,
                { backgroundColor: turnState === 'USER_LISTENING' ? '#dc2626' : '#16a34a' },
              ]}
            />
            <Text style={[styles.liveText, { color: colors.subtext }]}>
              {turnState === 'USER_LISTENING' ? 'Đang thu âm • ' : 'AI Online • '}
              Lượt {currentTurn}/{session?.maxTurns || 8}
            </Text>
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
        <View style={[styles.targetWordsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.targetWordsLabel, { color: colors.subtext }]}>Từ mục tiêu:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.targetWordsScroll}>
            {targetWords.map((tw, idx) => (
              <View
                key={tw.flashcardId || idx}
                style={[
                  styles.targetWordPill,
                  { backgroundColor: isDark ? '#1E293B' : '#f1f5f9', borderColor: colors.border },
                  tw.usedCorrectly && (isDark ? styles.targetWordPillUsedDark : styles.targetWordPillUsed),
                ]}
              >
                <Text
                  style={[
                    styles.targetWordPillText,
                    { color: colors.text },
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
                <View style={[styles.aiAvatar, { backgroundColor: isDark ? '#3B0764' : '#F3E8FF', borderColor: isDark ? '#7C3AED' : '#D8B4FE' }]}>
                  <Ionicons name="sparkles" size={18} color="#8B5CF6" />
                </View>
              )}

              <View style={[styles.bubbleWrapper, isAI ? styles.bubbleWrapperAi : styles.bubbleWrapperUser]}>
                <View
                  style={[
                    styles.bubble,
                    isAI
                      ? [styles.bubbleAi, { backgroundColor: colors.card, borderColor: colors.border }]
                      : styles.bubbleUser,
                  ]}
                >
                  <Text style={[styles.bubbleText, isAI ? [styles.bubbleTextAi, { color: colors.text }] : styles.bubbleTextUser]}>
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
                        color={isDark ? '#A78BFA' : '#16a34a'}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Thẻ gợi ý / Sửa lỗi ngữ pháp của AI bên dưới câu nói của user */}
                {!isAI && (msg.correctedSentence || (msg.grammarErrors && msg.grammarErrors.length > 0)) && (
                  <View
                    style={[
                      styles.correctionCard,
                      {
                        backgroundColor: isDark ? '#2E1065' : '#FAF5FF',
                        borderColor: isDark ? '#6B21A8' : '#E9D5FF',
                      },
                    ]}
                  >
                    <View style={styles.correctionHeader}>
                      <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                      <Text style={[styles.correctionTitle, { color: isDark ? '#C084FC' : '#7C3AED' }]}>
                        Góp ý ngữ pháp từ AI:
                      </Text>
                    </View>

                    {msg.correctedSentence ? (
                      <Text style={[styles.correctedText, { color: isDark ? '#E9D5FF' : '#4C1D95' }]}>
                        "{msg.correctedSentence}"
                      </Text>
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
            <View style={[styles.aiAvatar, { backgroundColor: isDark ? '#3B0764' : '#F3E8FF', borderColor: isDark ? '#7C3AED' : '#D8B4FE' }]}>
              <Ionicons name="sparkles" size={16} color="#8B5CF6" />
            </View>
            <View style={[styles.bubble, styles.bubbleAi, styles.aiThinkingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={[styles.aiThinkingText, { color: colors.subtext }]}>
                AI Tutor đang lắng nghe và phân tích...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 4. Thanh tương tác giọng nói ở chân màn hình (KeyboardAvoidingView) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.footerContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}
      >
        {/* Gợi ý trả lời nhanh dạng pill nếu có */}
        {!isKeyboardMode && lastAiSuggestion && turnState !== 'USER_LISTENING' && (
          <TouchableOpacity
            style={[
              styles.quickSuggestionBar,
              {
                backgroundColor: isDark ? '#3B0764' : '#F5F3FF',
                borderColor: isDark ? '#7C3AED' : '#DDD6FE',
              },
            ]}
            onPress={() => handleSendMessage(lastAiSuggestion)}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={14} color="#8B5CF6" />
            <Text
              style={[
                styles.quickSuggestionBarText,
                { color: isDark ? '#E9D5FF' : '#6D28D9' },
              ]}
              numberOfLines={1}
            >
              Gợi ý đáp lại: "{lastAiSuggestion}"
            </Text>
            <Ionicons name="arrow-up-circle" size={18} color="#8B5CF6" />
          </TouchableOpacity>
        )}

        {isKeyboardMode ? (
          // Chế độ gõ phím nếu môi trường xung quanh ồn ào
          <View style={styles.keyboardInputRow}>
            <TouchableOpacity
              style={[styles.modeSwitchBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
              onPress={() => setIsKeyboardMode(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="mic-outline" size={22} color="#16a34a" />
            </TouchableOpacity>

            <TextInput
              style={[
                styles.keyboardTextInput,
                {
                  backgroundColor: isDark ? '#1E293B' : '#f1f5f9',
                  color: colors.text,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập câu trả lời bằng tiếng Anh..."
              placeholderTextColor={colors.placeholder}
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
          // Chế độ nút Micro lớn với máy trạng thái FSM rõ ràng
          <View style={styles.voiceControlBar}>
            <TouchableOpacity
              style={[styles.modeSwitchBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
              onPress={() => setIsKeyboardMode(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="keypad-outline" size={22} color={colors.subtext} />
            </TouchableOpacity>

            {/* Nút Micro lớn ở giữa với Waveform / Pulse Ring */}
            <View style={styles.micWrapper}>
              <Animated.View
                style={[
                  styles.micPulseRing,
                  {
                    backgroundColor: micUi.ringColor,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />

              <TouchableOpacity
                style={[
                  styles.micBigBtn,
                  { backgroundColor: micUi.bgColor },
                ]}
                onPress={handleToggleRecord}
                activeOpacity={0.8}
                disabled={turnState === 'PROCESSING' || isAiResponding}
              >
                {micUi.icon}
              </TouchableOpacity>
            </View>

            {/* Gợi ý nhập nhanh hoặc chọn câu mẫu */}
            <TouchableOpacity
              style={[styles.quickVoiceSendBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
              onPress={() => {
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
              <Ionicons name="text-outline" size={22} color={colors.subtext} />
            </TouchableOpacity>
          </View>
        )}

        {!isKeyboardMode && (
          <Text style={[styles.voiceInstructionText, { color: colors.subtext }]}>
            {micUi.text}
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
  targetWordPillUsedDark: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
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
  quickSuggestionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 6,
  },
  quickSuggestionBarText: {
    flex: 1,
    fontSize: 12,
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
    width: 84,
    height: 84,
  },
  micPulseRing: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  micBigBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
    fontWeight: '500',
    marginTop: 6,
  },
});
