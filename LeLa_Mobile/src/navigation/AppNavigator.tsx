import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../features/decks/screens/HomeScreen';
import { DeckListScreen } from '../features/decks/screens/DeckListScreen';
import { PracticeMenuScreen } from '../features/study/screens/PracticeMenuScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export type AppTabParamList = {
  HomeTab: undefined;
  DecksTab: undefined;
  PracticeTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#ea580c',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.tabBorder,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'DecksTab':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'PracticeTab':
              iconName = focused ? 'game-controller' : 'game-controller-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Tổng quan' }}
      />
      <Tab.Screen
        name="DecksTab"
        component={DeckListScreen}
        options={{ tabBarLabel: 'Bộ thẻ' }}
      />
      <Tab.Screen
        name="PracticeTab"
        component={PracticeMenuScreen}
        options={{ tabBarLabel: 'Luyện tập' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Tài khoản' }}
      />
    </Tab.Navigator>
  );
};

