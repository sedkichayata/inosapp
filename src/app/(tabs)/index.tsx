import { View, Text, Pressable, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Camera, TrendingDown, TrendingUp, Calendar, ChevronRight, Sparkles, Bell, Eye, Crown, Lock, Droplets, Activity, Palette, CircleDot, Layers, Sun } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore, DarkCircleType } from '@/lib/store';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const { width } = Dimensions.get('window');

const typeNames: Record<DarkCircleType, string> = {
  vascular: 'Vasculaires',
  pigmented: 'Pigmentaires',
  structural: 'Structurels',
  mixed: 'Mixtes',
};

const typeColors: Record<DarkCircleType, string> = {
  vascular: '#8B5CF6',
  pigmented: '#EC4899',
  structural: '#3B82F6',
  mixed: '#6366F1',
};

export default function HomeScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const analyses = useAppStore((s) => s.analyses);
  const subscription = useAppStore((s) => s.subscription);

  const latestAnalysis = analyses[0];
  const previousAnalysis = analyses[1];

  const scoreDiff = latestAnalysis && previousAnalysis
    ? previousAnalysis.score - latestAnalysis.score
    : 0;

  const daysSinceLastScan = latestAnalysis
    ? differenceInDays(new Date(), parseISO(latestAnalysis.date))
    : null;

  const handleNewScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scan');
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(500)} className="px-5 pt-4 pb-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[#9CA3AF] text-sm">{greeting()}</Text>
                <Text className="text-white text-2xl font-semibold mt-1">
                  {user?.name || 'Utilisateur'}
                </Text>
              </View>
              <Pressable className="w-10 h-10 rounded-full bg-[#1E1E28] items-center justify-center">
                <Bell size={20} color="#6B7280" />
              </Pressable>
            </View>
          </Animated.View>

          {/* Main score card */}
          {latestAnalysis ? (
            <Animated.View entering={FadeInDown.delay(100).duration(500)} className="px-5 mb-6">
              <Pressable onPress={() => router.push('/progress')}>
                <LinearGradient
                  colors={['#1A1625', '#12101A']}
                  style={{ borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#2D2555' }}
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View>
                      <Text className="text-[#9CA3AF] text-sm mb-1">Score actuel</Text>
                      <View className="flex-row items-baseline">
                        <Text className="text-white text-5xl font-bold">{latestAnalysis.score}</Text>
                        <Text className="text-[#6B7280] text-lg ml-1">/100</Text>
                      </View>
                    </View>
                    {scoreDiff !== 0 && (
                      <View
                        className={`flex-row items-center px-3 py-1.5 rounded-full ${
                          scoreDiff > 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                        }`}
                      >
                        {scoreDiff > 0 ? (
                          <TrendingDown size={16} color="#10B981" />
                        ) : (
                          <TrendingUp size={16} color="#F43F5E" />
                        )}
                        <Text
                          className={`ml-1 font-semibold ${
                            scoreDiff > 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {`${scoreDiff > 0 ? '-' : '+'}${Math.abs(scoreDiff)}`}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center gap-4 mb-4">
                    <View className="flex-row items-center">
                      <View
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: typeColors[latestAnalysis.darkCircleType] }}
                      />
                      <Text className="text-[#D1D5DB] text-sm">
                        {typeNames[latestAnalysis.darkCircleType]}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Calendar size={14} color="#6B7280" />
                      <Text className="text-[#6B7280] text-sm ml-1">
                        {daysSinceLastScan === 0
                          ? "Aujourd'hui"
                          : daysSinceLastScan === 1
                          ? 'Hier'
                          : `Il y a ${daysSinceLastScan} jours`}
                      </Text>
                    </View>
                  </View>

                  {/* Mini progress bar */}
                  <View className="h-2 bg-[#2D2555] rounded-full overflow-hidden">
                    <LinearGradient
                      colors={['#8B5CF6', '#6366F1', '#3B82F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: '100%',
                        width: `${100 - latestAnalysis.score}%`,
                        borderRadius: 9999,
                      }}
                    />
                  </View>
                  <Text className="text-[#6B7280] text-xs mt-2">Plus bas = meilleur</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(100).duration(500)} className="px-5 mb-6">
              <LinearGradient
                colors={['#1A1625', '#12101A']}
                style={{ borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2D2555', alignItems: 'center' }}
              >
                <View className="w-16 h-16 rounded-full bg-[#8B5CF6]/10 items-center justify-center mb-4">
                  <Eye size={32} color="#8B5CF6" />
                </View>
                <Text className="text-white text-lg font-semibold mb-2">Aucune analyse</Text>
                <Text className="text-[#9CA3AF] text-center mb-4">
                  Effectuez votre premier scan pour découvrir votre type de cernes
                </Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Quick actions */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mb-6">
            <Pressable onPress={handleNewScan}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 20, padding: 20 }}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
                    <Camera size={24} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">Nouveau scan</Text>
                    <Text className="text-white/70 text-sm">
                      {latestAnalysis
                        ? 'Suivez vos progrès'
                        : 'Analysez vos cernes'}
                    </Text>
                  </View>
                  <ChevronRight size={24} color="#fff" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Premium Full Face Scan */}
          <Animated.View entering={FadeInDown.delay(250).duration(500)} className="px-5 mb-6">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (subscription.isActive) {
                  router.push('/scan?mode=fullface');
                } else {
                  router.push('/subscription');
                }
              }}
            >
              <LinearGradient
                colors={['#1A1625', '#12101A']}
                style={{ borderRadius: 20, borderWidth: 1, borderColor: '#8B5CF640', overflow: 'hidden' }}
              >
                {/* Header */}
                <View className="flex-row items-center justify-between p-4 border-b border-[#2D2555]">
                  <View className="flex-row items-center">
                    <LinearGradient
                      colors={['#8B5CF620', '#3B82F620']}
                      style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                    >
                      <Crown size={20} color="#8B5CF6" />
                    </LinearGradient>
                    <View>
                      <Text className="text-white font-bold text-base">Scan Complet Premium</Text>
                      <Text className="text-[#9CA3AF] text-xs">Analyse complète du visage</Text>
                    </View>
                  </View>
                  {subscription.isActive ? (
                    <LinearGradient
                      colors={['#8B5CF6', '#3B82F6']}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}
                    >
                      <Text className="text-white text-xs font-bold">ACTIF</Text>
                    </LinearGradient>
                  ) : (
                    <View className="flex-row items-center">
                      <Lock size={14} color="#8B5CF6" />
                      <Text className="text-[#8B5CF6] text-xs font-medium ml-1">Premium</Text>
                    </View>
                  )}
                </View>

                {/* Preview metrics grid */}
                <View className="p-4">
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {[
                      { Icon: Droplets, label: 'Hydratation', value: subscription.isActive ? '78' : '??' },
                      { Icon: Activity, label: 'Rides', value: subscription.isActive ? '85' : '??' },
                      { Icon: Palette, label: 'Pigmentation', value: subscription.isActive ? '72' : '??' },
                      { Icon: CircleDot, label: 'Pores', value: subscription.isActive ? '81' : '??' },
                      { Icon: Layers, label: 'Uniformité', value: subscription.isActive ? '76' : '??' },
                      { Icon: Sun, label: 'Éclat', value: subscription.isActive ? '69' : '??' },
                    ].map((metric, index) => (
                      <View
                        key={index}
                        className="bg-[#0D0B14]/60 rounded-xl p-3"
                        style={{ width: (width - 56) / 3 - 6 }}
                      >
                        <View className="flex-row items-center mb-2">
                          <metric.Icon size={14} color={subscription.isActive ? '#8B5CF6' : '#4B5563'} />
                          <Text className={`text-xs ml-1.5 ${subscription.isActive ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
                            {metric.label}
                          </Text>
                        </View>
                        <Text className={`text-xl font-bold ${subscription.isActive ? 'text-white' : 'text-[#374151]'}`}>
                          {metric.value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* CTA */}
                  {!subscription.isActive && (
                    <View className="mt-4 bg-[#8B5CF6]/10 rounded-xl p-4 border border-[#8B5CF6]/30">
                      <View className="flex-row items-center">
                        <Sparkles size={20} color="#8B5CF6" />
                        <View className="flex-1 ml-3">
                          <Text className="text-white font-semibold">Débloquez l'analyse complète</Text>
                          <Text className="text-[#9CA3AF] text-xs">9 métriques détaillées + recommandations IA</Text>
                        </View>
                        <ChevronRight size={20} color="#8B5CF6" />
                      </View>
                    </View>
                  )}

                  {subscription.isActive && (
                    <View className="mt-4 flex-row items-center justify-center">
                      <Camera size={16} color="#8B5CF6" />
                      <Text className="text-[#8B5CF6] text-sm font-medium ml-2">Lancer un scan complet</Text>
                      <ChevronRight size={16} color="#8B5CF6" />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Subscription CTA */}
          {!subscription.isActive && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} className="px-5 mb-6">
              <Pressable onPress={() => router.push('/subscription')}>
                <View className="bg-[#1A1625] rounded-2xl p-5 border border-[#2D2555]">
                  <View className="flex-row items-center">
                    <LinearGradient
                      colors={['#8B5CF620', '#3B82F620']}
                      style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}
                    >
                      <Sparkles size={24} color="#8B5CF6" />
                    </LinearGradient>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base">Routine personnalisée</Text>
                      <Text className="text-[#9CA3AF] text-sm">
                        Découvrez nos soins adaptés à vos cernes
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#6B7280" />
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* Recent analyses */}
          {analyses.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(500)} className="mb-6">
              <View className="flex-row items-center justify-between px-5 mb-4">
                <Text className="text-white text-lg font-semibold">Historique récent</Text>
                <Pressable onPress={() => router.push('/progress')}>
                  <Text className="text-[#8B5CF6] text-sm">Tout voir</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                style={{ flexGrow: 0 }}
              >
                {analyses.slice(0, 5).map((analysis, index) => (
                  <Animated.View
                    key={analysis.id}
                    entering={FadeInRight.delay(index * 100).duration(400)}
                  >
                    <Pressable
                      className="mr-3"
                      onPress={() => router.push({ pathname: '/results', params: { photoUri: analysis.photoUri } })}
                    >
                      <View className="w-28 bg-[#1A1625] rounded-2xl overflow-hidden border border-[#2D2555]">
                        {analysis.photoUri && (
                          <Image
                            source={{ uri: analysis.photoUri }}
                            className="w-full h-32"
                            resizeMode="cover"
                          />
                        )}
                        <View className="p-3">
                          <Text className="text-white font-bold text-lg">{analysis.score}</Text>
                          <Text className="text-[#6B7280] text-xs">
                            {format(parseISO(analysis.date), 'dd MMM', { locale: fr })}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Tips section */}
          <Animated.View entering={FadeInDown.delay(500).duration(500)} className="px-5">
            <Text className="text-white text-lg font-semibold mb-4">Conseils du jour</Text>
            <LinearGradient
              colors={['#1A1625', '#12101A']}
              style={{ borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2D2555' }}
            >
              <View className="flex-row items-start">
                <LinearGradient
                  colors={['#8B5CF620', '#3B82F620']}
                  style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                >
                  <Droplets size={20} color="#3B82F6" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-white font-medium mb-1">Hydratation</Text>
                  <Text className="text-[#9CA3AF] text-sm leading-relaxed">
                    Buvez au moins 2L d'eau par jour pour améliorer l'apparence de votre contour des yeux.
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
