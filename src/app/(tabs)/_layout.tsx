import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Home, Camera, TrendingUp, User, ShoppingBag } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0A0A0F',
          borderTopWidth: 0,
          elevation: 0,
          height: 88,
          paddingTop: 6,
        },
        tabBarBackground: () => {
          if (Platform.OS === 'ios') {
            return (
              <BlurView
                intensity={80}
                tint="dark"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            );
          }
          return <View style={{ flex: 1, backgroundColor: '#0A0A0F' }} />;
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan-tab"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={{ marginTop: -12 }}>
              {focused ? (
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 12, borderRadius: 9999 }}
                >
                  <Camera size={24} color="#fff" strokeWidth={2} />
                </LinearGradient>
              ) : (
                <View className="p-3 rounded-full bg-[#1E1E28]">
                  <Camera size={24} color="#6B7280" strokeWidth={2} />
                </View>
              )}
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('scan');
          },
        })}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Suivi',
          tabBarIcon: ({ color, focused }) => (
            <TrendingUp size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
