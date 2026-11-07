import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/context/AuthContext';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { AppNavigator } from './AppNavigator';
import { FlashcardStudyScreen } from '../features/study/screens/FlashcardStudyScreen';
import { DeckDetailScreen } from '../features/decks/screens/DeckDetailScreen';
import { QuizListScreen } from '../features/quiz/screens/QuizListScreen';
import { QuizExamScreen } from '../features/quiz/screens/QuizExamScreen';
import { QuizResultScreen } from '../features/quiz/screens/QuizResultScreen';
import { AssessmentCenterScreen } from '../features/quiz/screens/AssessmentCenterScreen';
import { AssessmentHistoryScreen } from '../features/study/screens/AssessmentHistoryScreen';
import { AssessmentReviewDetailScreen } from '../features/study/screens/AssessmentReviewDetailScreen';
import { WordRainDeckSelectScreen } from '../features/study/screens/WordRainDeckSelectScreen';
import { WordRainGameScreen } from '../features/study/screens/WordRainGameScreen';
import { VoiceScenarioSelectScreen } from '../features/study/screens/VoiceScenarioSelectScreen';
import { VoiceConversationScreen } from '../features/study/screens/VoiceConversationScreen';
import { VoiceReportScreen } from '../features/study/screens/VoiceReportScreen';
import SubscriptionPlansScreen from '../features/payment/screens/SubscriptionPlansScreen';
import PaymentQrScreen from '../features/payment/screens/PaymentQrScreen';
import { SubscriptionManagementScreen } from '../features/payment/screens/SubscriptionManagementScreen';
import { LeaderboardScreen } from '../features/profile/screens/LeaderboardScreen';
import { StudyStatsScreen } from '../features/profile/screens/StudyStatsScreen';
import NotificationSettingsScreen from '../features/profile/screens/NotificationSettingsScreen';
import { EditProfileScreen } from '../features/profile/screens/EditProfileScreen';
import { AppSettingsScreen } from '../features/profile/screens/AppSettingsScreen';
import { SupportChatScreen } from '../features/chat/screens/SupportChatScreen';
import { Ionicons } from '@expo/vector-icons';
import {
  CheckoutResponse,
  DeckResponse,
  QuizAttemptDetailResponse,
  TypingRunResponse,
  VoiceStartResponse,
  VoiceReportResponse,
} from '../types';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  FlashcardStudy: { deckId?: number; deckTitle?: string } | undefined;
  DeckDetail: { deckId: number; initialDeck?: DeckResponse };
  QuizList: undefined;
  AssessmentCenter: undefined;
  AssessmentHistory: undefined;
  AssessmentReviewDetail: {
    publicId?: string;
    attemptId?: number | string;
    quizTitle?: string;
  };
  QuizExam: { quizId?: number; quizTitle?: string } | undefined;
  QuizResult: { attemptResult: QuizAttemptDetailResponse };
  WordRainDeckSelect: undefined;
  WordRainGame:
    | {
        deckId?: number;
        deckTitle?: string;
        mode?: 'EASY' | 'HARD' | string;
        initialRun?: TypingRunResponse;
      }
    | undefined;
  VoiceScenarioSelect: undefined;
  VoiceConversation:
    | {
        initialSession?: VoiceStartResponse;
        scenarioTitle?: string;
      }
    | undefined;
  VoiceReport: {
    report: VoiceReportResponse;
    scenarioTitle?: string;
  };
  SubscriptionPlans: undefined;
  PaymentQr: {
    checkoutData: CheckoutResponse;
  };
  SubscriptionManagement: undefined;
  Leaderboard: undefined;
  StudyStats: undefined;
  NotificationSettings: undefined;
  EditProfile: undefined;
  AppSettings: undefined;
  SupportChat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Màn hình Splash / Loading khi đang đồng bộ phiên đăng nhập từ SecureStore
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoBadge}>
          <Ionicons name="school" size={48} color="#ea580c" />
        </View>
        <Text style={styles.splashBrand}>LeLa</Text>
        <ActivityIndicator size="large" color="#ea580c" style={styles.spinner} />
        <Text style={styles.splashStatus}>Đang đồng bộ phiên học tập...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={AppNavigator} />
            <Stack.Screen
              name="FlashcardStudy"
              component={FlashcardStudyScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="DeckDetail"
              component={DeckDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="QuizList"
              component={QuizListScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="AssessmentCenter"
              component={AssessmentCenterScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="AssessmentHistory"
              component={AssessmentHistoryScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="AssessmentReviewDetail"
              component={AssessmentReviewDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="QuizExam"
              component={QuizExamScreen}
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            <Stack.Screen
              name="QuizResult"
              component={QuizResultScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen
              name="WordRainDeckSelect"
              component={WordRainDeckSelectScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="WordRainGame"
              component={WordRainGameScreen}
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            <Stack.Screen
              name="VoiceScenarioSelect"
              component={VoiceScenarioSelectScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="VoiceConversation"
              component={VoiceConversationScreen}
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            <Stack.Screen
              name="VoiceReport"
              component={VoiceReportScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen
              name="SubscriptionPlans"
              component={SubscriptionPlansScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="PaymentQr"
              component={PaymentQrScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="SubscriptionManagement"
              component={SubscriptionManagementScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Leaderboard"
              component={LeaderboardScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="StudyStats"
              component={StudyStatsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="AppSettings"
              component={AppSettingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="SupportChat"
              component={SupportChatScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fed7aa',
    marginBottom: 16,
  },
  splashBrand: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ea580c',
    letterSpacing: 1,
  },
  spinner: {
    marginTop: 24,
  },
  splashStatus: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
});
