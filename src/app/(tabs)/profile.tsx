import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Image, Alert, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  User,
  Settings,
  CreditCard,
  Package,
  Bell,
  HelpCircle,
  ChevronRight,
  LogOut,
  LogIn,
  Shield,
  Star,
  Share2,
  CheckCircle,
  XCircle,
  Cloud,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useAuthContext } from '@/lib/AuthProvider';
import { checkSupabaseSetup, logSetupResult } from '@/lib/supabase-setup';
import { LinearGradient } from 'expo-linear-gradient';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
}

interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  tablesReady: boolean;
  storageReady: boolean;
  errors: string[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const subscription = useAppStore((s) => s.subscription);
  const analyses = useAppStore((s) => s.analyses);
  const reset = useAppStore((s) => s.reset);
  const { isConfigured, isAuthenticated, user: authUser, signOut } = useAuthContext();

  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Check Supabase status on mount
  useEffect(() => {
    checkSupabaseStatus();
  }, []);

  const checkSupabaseStatus = async () => {
    setIsCheckingSupabase(true);
    try {
      const result = await checkSupabaseSetup();
      logSetupResult(result);

      const allTablesReady = Object.values(result.tables).every(Boolean);

      setSupabaseStatus({
        configured: result.configured,
        connected: result.connected,
        tablesReady: allTablesReady,
        storageReady: result.storage.photos,
        errors: result.errors,
      });
    } catch (err) {
      console.log('Supabase check error:', err);
      setSupabaseStatus({
        configured: false,
        connected: false,
        tablesReady: false,
        storageReady: false,
        errors: [String(err)],
      });
    }
    setIsCheckingSupabase(false);
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    console.log('[handleLogout] Starting logout...');

    try {
      await signOut();
      console.log('[handleLogout] SignOut successful');
    } catch (err) {
      console.log('[handleLogout] SignOut error:', err);
    }

    // Reset store
    reset();
    console.log('[handleLogout] Store reset complete');

    // On web, force a page reload to clear all state
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  };

  const confirmLogout = () => {
    console.log('[handleLogout] Starting logout...');
    setShowLogoutModal(false);
    signOut()
      .then(() => {
        console.log('[handleLogout] SignOut successful');
        reset();
        console.log('[handleLogout] Store reset complete');
        router.replace('/onboarding');
      })
      .catch((err) => {
        console.log('[handleLogout] SignOut error:', err);
        // Still reset and navigate even if signOut fails
        reset();
        router.replace('/onboarding');
      });
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Mon compte',
      items: [
        {
          icon: <CreditCard size={20} color="#8B5CF6" />,
          label: 'Abonnement',
          sublabel: subscription.isActive
            ? `Plan ${subscription.plan === 'yearly' ? 'annuel' : 'mensuel'}`
            : 'Aucun abonnement',
          onPress: () => router.push('/subscription'),
          badge: subscription.isActive ? 'Actif' : undefined,
          badgeColor: subscription.isActive ? '#10B981' : undefined,
        },
        {
          icon: <Package size={20} color="#8B5CF6" />,
          label: 'Mes commandes',
          sublabel: 'Historique et suivi',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('Commandes', 'Vous n\'avez pas encore de commandes.');
          },
        },
      ],
    },
    {
      title: 'Paramètres',
      items: [
        {
          icon: <Bell size={20} color="#6B7280" />,
          label: 'Notifications',
          sublabel: 'Rappels et alertes',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          icon: <Shield size={20} color="#6B7280" />,
          label: 'Confidentialité',
          sublabel: 'Données et permissions',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle size={20} color="#6B7280" />,
          label: 'Aide & FAQ',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          icon: <Star size={20} color="#6B7280" />,
          label: 'Noter l\'application',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          icon: <Share2 size={20} color="#6B7280" />,
          label: 'Partager INOS',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ],
    },
  ];

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(500)} className="px-5 pt-4 pb-2">
            <Text className="text-white text-2xl font-semibold">Profil</Text>
          </Animated.View>

          {/* User card */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} className="px-5 py-4">
            <LinearGradient
              colors={['#1A1625', '#12101A']}
              style={{ borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#2D2555' }}
            >
              <View className="flex-row items-center">
                <LinearGradient
                  colors={['#8B5CF630', '#3B82F630']}
                  style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}
                >
                  {user?.avatarUri ? (
                    <Image
                      source={{ uri: user.avatarUri }}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <Text className="text-[#8B5CF6] text-2xl font-bold">
                      {user?.name?.charAt(0).toUpperCase() || authUser?.email?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  )}
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-white text-xl font-semibold">
                    {user?.name || authUser?.email?.split('@')[0] || 'Utilisateur'}
                  </Text>
                  {isAuthenticated && authUser?.email && (
                    <Text className="text-[#8B5CF6] text-sm">{authUser.email}</Text>
                  )}
                  <Text className="text-[#9CA3AF] text-sm mt-1">
                    {analyses.length} analyse{analyses.length !== 1 ? 's' : ''} effectuée{analyses.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="w-10 h-10 rounded-full bg-[#1E1E28] items-center justify-center"
                >
                  <Settings size={18} color="#6B7280" />
                </Pressable>
              </View>

              {/* Auth status */}
              {!isAuthenticated && isConfigured && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/auth');
                  }}
                  className="mt-4 pt-4 border-t border-[#2D2555]"
                >
                  <View className="flex-row items-center justify-between bg-[#1E1E28] p-3 rounded-xl">
                    <View className="flex-row items-center">
                      <LogIn size={18} color="#8B5CF6" />
                      <Text className="text-[#8B5CF6] font-medium ml-2">Se connecter</Text>
                    </View>
                    <Text className="text-[#6B7280] text-xs">Synchroniser vos données</Text>
                  </View>
                </Pressable>
              )}

              {/* Skin type badge */}
              {user?.skinType && (
                <View className="mt-4 pt-4 border-t border-[#2D2555]">
                  <Text className="text-[#6B7280] text-xs mb-2">Type de peau</Text>
                  <View className="flex-row flex-wrap gap-2">
                    <LinearGradient
                      colors={['#8B5CF620', '#3B82F620']}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}
                    >
                      <Text className="text-[#8B5CF6] text-sm font-medium capitalize">
                        {user.skinType === 'dry' && 'Sèche'}
                        {user.skinType === 'oily' && 'Grasse'}
                        {user.skinType === 'combination' && 'Mixte'}
                        {user.skinType === 'normal' && 'Normale'}
                        {user.skinType === 'sensitive' && 'Sensible'}
                      </Text>
                    </LinearGradient>
                  </View>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Subscription CTA if not subscribed */}
          {!subscription.isActive && (
            <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mb-4">
              <Pressable onPress={() => router.push('/subscription')}>
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <View className="flex-row items-center">
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base">Passez à Premium</Text>
                      <Text className="text-white/70 text-sm">
                        Accédez à votre routine personnalisée
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#fff" />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Menu sections */}
          {menuSections.map((section, sectionIndex) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.delay(300 + sectionIndex * 100).duration(500)}
              className="px-5 mb-6"
            >
              <Text className="text-[#6B7280] text-xs font-medium uppercase tracking-wider mb-3">
                {section.title}
              </Text>
              <View className="bg-[#1A1625] rounded-2xl border border-[#2D2555] overflow-hidden">
                {section.items.map((item, index) => (
                  <Pressable
                    key={item.label}
                    onPress={item.onPress}
                    className={`flex-row items-center p-4 ${
                      index < section.items.length - 1 ? 'border-b border-[#2D2555]' : ''
                    }`}
                  >
                    <View className="w-10 h-10 rounded-xl bg-[#12101A] items-center justify-center mr-3">
                      {item.icon}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">{item.label}</Text>
                      {item.sublabel && (
                        <Text className="text-[#6B7280] text-sm">{item.sublabel}</Text>
                      )}
                    </View>
                    {item.badge && (
                      <View
                        className="px-2 py-1 rounded-full mr-2"
                        style={{ backgroundColor: (item.badgeColor || '#8B5CF6') + '20' }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: item.badgeColor || '#8B5CF6' }}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    )}
                    <ChevronRight size={18} color="#4B5563" />
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          ))}

          {/* Supabase Status Card */}
          <Animated.View entering={FadeInDown.delay(550).duration(500)} className="px-5 mb-6">
            <Text className="text-[#6B7280] text-xs font-medium uppercase tracking-wider mb-3">
              Base de données
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                checkSupabaseStatus();
              }}
            >
              <View className="bg-[#1A1625] rounded-2xl border border-[#2D2555] p-4">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-xl bg-[#12101A] items-center justify-center mr-3">
                    <Cloud size={20} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">Supabase</Text>
                    <Text className="text-[#6B7280] text-sm">
                      {isCheckingSupabase ? 'Vérification...' : 'Tap pour rafraîchir'}
                    </Text>
                  </View>
                  {supabaseStatus && (
                    supabaseStatus.connected && supabaseStatus.tablesReady ? (
                      <CheckCircle size={20} color="#10B981" />
                    ) : (
                      <XCircle size={20} color="#F43F5E" />
                    )
                  )}
                </View>

                {supabaseStatus && (
                  <View className="border-t border-[#2D2555] pt-3">
                    <View className="flex-row items-center mb-2">
                      {supabaseStatus.configured ? (
                        <CheckCircle size={14} color="#10B981" />
                      ) : (
                        <XCircle size={14} color="#F43F5E" />
                      )}
                      <Text className="text-[#9CA3AF] text-sm ml-2">Configuré</Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                      {supabaseStatus.connected ? (
                        <CheckCircle size={14} color="#10B981" />
                      ) : (
                        <XCircle size={14} color="#F43F5E" />
                      )}
                      <Text className="text-[#9CA3AF] text-sm ml-2">Connecté</Text>
                    </View>
                    <View className="flex-row items-center mb-2">
                      {supabaseStatus.tablesReady ? (
                        <CheckCircle size={14} color="#10B981" />
                      ) : (
                        <XCircle size={14} color="#F43F5E" />
                      )}
                      <Text className="text-[#9CA3AF] text-sm ml-2">Tables créées</Text>
                    </View>
                    <View className="flex-row items-center">
                      {supabaseStatus.storageReady ? (
                        <CheckCircle size={14} color="#10B981" />
                      ) : (
                        <XCircle size={14} color="#F43F5E" />
                      )}
                      <Text className="text-[#9CA3AF] text-sm ml-2">Stockage photos</Text>
                    </View>

                    {supabaseStatus.errors.length > 0 && (
                      <View className="mt-3 pt-3 border-t border-[#2D2555]">
                        <Text className="text-rose-400 text-xs mb-1">Erreurs:</Text>
                        {supabaseStatus.errors.slice(0, 3).map((err, i) => (
                          <Text key={i} className="text-rose-400/70 text-xs">
                            • {err.substring(0, 60)}{err.length > 60 ? '...' : ''}
                          </Text>
                        ))}
                      </View>
                    )}

                    {isAuthenticated && authUser && (
                      <View className="mt-3 pt-3 border-t border-[#2D2555]">
                        <Text className="text-emerald-400 text-xs">
                          Connecté: {authUser.email}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Pressable>
          </Animated.View>

          {/* Logout / Login button */}
          <Animated.View entering={FadeInDown.delay(600).duration(500)} className="px-5 mb-8">
            {isAuthenticated ? (
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center justify-center py-4 bg-[#1A1625] rounded-2xl border border-[#2D2555]"
              >
                <LogOut size={18} color="#F43F5E" />
                <Text className="text-rose-500 font-medium ml-2">Déconnexion</Text>
              </Pressable>
            ) : isConfigured ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/auth');
                }}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                  <LogIn size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Se connecter / S'inscrire</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center justify-center py-4 bg-[#1A1625] rounded-2xl border border-[#2D2555]"
              >
                <LogOut size={18} color="#F43F5E" />
                <Text className="text-rose-500 font-medium ml-2">Réinitialiser</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* Version */}
          <Animated.View entering={FadeInDown.delay(700).duration(500)} className="items-center pb-4">
            <Text className="text-[#374151] text-xs">INOS v1.0.0</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <LinearGradient
            colors={['#1A1625', '#12101A']}
            style={{ borderRadius: 24, width: '100%', maxWidth: 360, padding: 24, borderWidth: 1, borderColor: '#2D2555' }}
          >
            <Text className="text-white text-xl font-semibold text-center mb-2">
              Déconnexion
            </Text>
            <Text className="text-[#9CA3AF] text-center mb-6">
              Êtes-vous sûr de vouloir vous déconnecter ? Vos données seront conservées.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-[#2D2555] rounded-xl"
              >
                <Text className="text-white font-medium text-center">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={confirmLogout}
                className="flex-1 py-3 bg-rose-500 rounded-xl"
              >
                <Text className="text-white font-semibold text-center">Déconnexion</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}
