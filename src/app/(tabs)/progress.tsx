import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, ArrowRight, TrendingDown, TrendingUp, Calendar, Camera, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore, DarkCircleType, SkinAnalysis } from '@/lib/store';
import { format, parseISO } from 'date-fns';
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

export default function ProgressScreen() {
  const router = useRouter();
  const analyses = useAppStore((s) => s.analyses);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState<number | null>(null);

  const selectedAnalysis = analyses[selectedIndex];
  const compareAnalysis = compareIndex !== null ? analyses[compareIndex] : null;

  const scoreTrend = analyses.length >= 2
    ? analyses[analyses.length - 1].score - analyses[0].score
    : 0;

  const handlePrevious = () => {
    if (selectedIndex < analyses.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleCompare = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompareIndex(index);
    setCompareMode(true);
  };

  if (analyses.length === 0) {
    return (
      <View className="flex-1 bg-[#0A0A0F]">
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <LinearGradient
            colors={['#8B5CF620', '#3B82F620']}
            style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}
          >
            <Calendar size={40} color="#8B5CF6" />
          </LinearGradient>
          <Text className="text-white text-2xl font-semibold text-center mb-3">
            Aucun historique
          </Text>
          <Text className="text-[#9CA3AF] text-base text-center mb-8">
            Effectuez votre premier scan pour commencer à suivre l'évolution de vos cernes.
          </Text>
          <Pressable onPress={() => router.push('/scan')}>
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              <Camera size={20} color="#fff" />
              <Text className="text-white font-semibold text-lg ml-2">Premier scan</Text>
            </LinearGradient>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} className="px-5 pt-4 pb-4">
          <Text className="text-white text-2xl font-semibold">Suivi</Text>
          <Text className="text-[#9CA3AF] text-sm mt-1">
            {analyses.length} analyse{analyses.length > 1 ? 's' : ''} enregistrée{analyses.length > 1 ? 's' : ''}
          </Text>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Overall trend */}
          {analyses.length >= 2 && (
            <Animated.View entering={FadeInDown.delay(100).duration(500)} className="px-5 mb-6">
              <LinearGradient
                colors={['#1A1625', '#12101A']}
                style={{ borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2D2555' }}
              >
                <Text className="text-[#9CA3AF] text-sm mb-2">Évolution globale</Text>
                <View className="flex-row items-center">
                  {scoreTrend < 0 ? (
                    <>
                      <TrendingDown size={24} color="#10B981" />
                      <Text className="text-emerald-500 text-2xl font-bold ml-2">
                        {Math.abs(scoreTrend)} points
                      </Text>
                    </>
                  ) : scoreTrend > 0 ? (
                    <>
                      <TrendingUp size={24} color="#F43F5E" />
                      <Text className="text-rose-500 text-2xl font-bold ml-2">
                        +{scoreTrend} points
                      </Text>
                    </>
                  ) : (
                    <Text className="text-[#9CA3AF] text-2xl font-bold">Stable</Text>
                  )}
                </View>
                <Text className="text-[#6B7280] text-xs mt-2">
                  Depuis votre première analyse
                </Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Before/After comparison */}
          {compareMode && compareAnalysis ? (
            <Animated.View entering={FadeIn.duration(300)} className="px-5 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-semibold">Comparaison</Text>
                <Pressable
                  onPress={() => {
                    setCompareMode(false);
                    setCompareIndex(null);
                  }}
                  className="py-2 px-4 bg-[#1A1625] rounded-full"
                >
                  <Text className="text-[#9CA3AF] text-sm">Fermer</Text>
                </Pressable>
              </View>

              <View className="flex-row gap-3">
                {/* Before */}
                <View className="flex-1">
                  <Text className="text-[#9CA3AF] text-xs mb-2 text-center">AVANT</Text>
                  <View className="bg-[#1A1625] rounded-2xl overflow-hidden border border-[#2D2555]">
                    {compareAnalysis.photoUri && (
                      <Image
                        source={{ uri: compareAnalysis.photoUri }}
                        className="w-full aspect-[3/4]"
                        resizeMode="cover"
                      />
                    )}
                    <View className="p-3 items-center">
                      <Text className="text-white font-bold text-xl">{compareAnalysis.score}</Text>
                      <Text className="text-[#6B7280] text-xs">
                        {format(parseISO(compareAnalysis.date), 'dd MMM yyyy', { locale: fr })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* After */}
                <View className="flex-1">
                  <Text className="text-[#9CA3AF] text-xs mb-2 text-center">APRÈS</Text>
                  <View className="bg-[#1A1625] rounded-2xl overflow-hidden border border-[#8B5CF6]/30">
                    {selectedAnalysis?.photoUri && (
                      <Image
                        source={{ uri: selectedAnalysis.photoUri }}
                        className="w-full aspect-[3/4]"
                        resizeMode="cover"
                      />
                    )}
                    <View className="p-3 items-center">
                      <Text className="text-white font-bold text-xl">{selectedAnalysis?.score}</Text>
                      <Text className="text-[#6B7280] text-xs">
                        {selectedAnalysis && format(parseISO(selectedAnalysis.date), 'dd MMM yyyy', { locale: fr })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Score difference */}
              {selectedAnalysis && (
                <View className="mt-4 items-center">
                  <View
                    className={`px-4 py-2 rounded-full ${
                      compareAnalysis.score > selectedAnalysis.score
                        ? 'bg-emerald-500/20'
                        : compareAnalysis.score < selectedAnalysis.score
                        ? 'bg-rose-500/20'
                        : 'bg-[#1A1625]'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        compareAnalysis.score > selectedAnalysis.score
                          ? 'text-emerald-500'
                          : compareAnalysis.score < selectedAnalysis.score
                          ? 'text-rose-500'
                          : 'text-[#9CA3AF]'
                      }`}
                    >
                      {compareAnalysis.score > selectedAnalysis.score
                        ? `Amélioration de ${compareAnalysis.score - selectedAnalysis.score} points`
                        : compareAnalysis.score < selectedAnalysis.score
                        ? `Détérioration de ${selectedAnalysis.score - compareAnalysis.score} points`
                        : 'Score identique'}
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          ) : (
            /* Current analysis viewer */
            selectedAnalysis && (
              <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mb-6">
                <View className="bg-[#1A1625] rounded-3xl overflow-hidden border border-[#2D2555]">
                  {/* Photo with navigation */}
                  <View className="relative">
                    {selectedAnalysis.photoUri && (
                      <Image
                        source={{ uri: selectedAnalysis.photoUri }}
                        className="w-full aspect-[3/4]"
                        resizeMode="cover"
                      />
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(18,16,26,0.95)']}
                      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 }}
                    />

                    {/* Navigation arrows */}
                    <View className="absolute top-1/2 left-0 right-0 flex-row justify-between px-3 -translate-y-1/2">
                      <Pressable
                        onPress={handlePrevious}
                        disabled={selectedIndex >= analyses.length - 1}
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          selectedIndex >= analyses.length - 1 ? 'bg-black/20' : 'bg-black/50'
                        }`}
                      >
                        <ArrowLeft
                          size={20}
                          color={selectedIndex >= analyses.length - 1 ? '#4B5563' : '#fff'}
                        />
                      </Pressable>
                      <Pressable
                        onPress={handleNext}
                        disabled={selectedIndex <= 0}
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          selectedIndex <= 0 ? 'bg-black/20' : 'bg-black/50'
                        }`}
                      >
                        <ArrowRight
                          size={20}
                          color={selectedIndex <= 0 ? '#4B5563' : '#fff'}
                        />
                      </Pressable>
                    </View>

                    {/* Score overlay */}
                    <View className="absolute bottom-4 left-4 right-4">
                      <View className="flex-row items-end justify-between">
                        <View>
                          <Text className="text-[#9CA3AF] text-sm mb-1">Score</Text>
                          <View className="flex-row items-baseline">
                            <Text className="text-white text-4xl font-bold">{selectedAnalysis.score}</Text>
                            <Text className="text-[#6B7280] text-lg ml-1">/100</Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <View
                            className="px-3 py-1 rounded-full mb-2"
                            style={{ backgroundColor: typeColors[selectedAnalysis.darkCircleType] + '20' }}
                          >
                            <Text
                              style={{ color: typeColors[selectedAnalysis.darkCircleType] }}
                              className="font-medium text-sm"
                            >
                              {typeNames[selectedAnalysis.darkCircleType]}
                            </Text>
                          </View>
                          <Text className="text-[#9CA3AF] text-xs">
                            {format(parseISO(selectedAnalysis.date), 'dd MMMM yyyy', { locale: fr })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Pagination dots */}
                  <View className="flex-row justify-center py-3 gap-1.5">
                    {analyses.slice(0, 7).map((_, i) => (
                      <Pressable
                        key={i}
                        onPress={() => setSelectedIndex(i)}
                      >
                        <View
                          className="h-2 rounded-full"
                          style={{
                            width: i === selectedIndex ? 24 : 8,
                            backgroundColor: i === selectedIndex ? '#8B5CF6' : '#2D2555',
                          }}
                        />
                      </Pressable>
                    ))}
                    {analyses.length > 7 && (
                      <Text className="text-[#6B7280] text-xs ml-1">+{analyses.length - 7}</Text>
                    )}
                  </View>
                </View>
              </Animated.View>
            )
          )}

          {/* Action buttons */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} className="px-5 mb-6">
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => router.push('/scan')}
                className="flex-1"
              >
                <LinearGradient
                  colors={['#8B5CF6', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Camera size={20} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Nouveau scan</Text>
                </LinearGradient>
              </Pressable>
              {selectedAnalysis && (
                <Pressable
                  onPress={() => router.push({
                    pathname: '/share-diagnosis',
                    params: { analysisId: selectedAnalysis.id }
                  })}
                  className="w-14 bg-[#1A1625] rounded-2xl items-center justify-center border border-[#2D2555]"
                >
                  <Share2 size={20} color="#8B5CF6" />
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* History list */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} className="px-5">
            <Text className="text-white text-lg font-semibold mb-4">Historique complet</Text>
            <View className="gap-3">
              {analyses.map((analysis, index) => (
                <Pressable
                  key={analysis.id}
                  onPress={() => setSelectedIndex(index)}
                  onLongPress={() => handleCompare(index)}
                  className={`bg-[#1A1625] rounded-2xl p-4 border flex-row items-center ${
                    index === selectedIndex ? 'border-[#8B5CF6]/50' : 'border-[#2D2555]'
                  }`}
                >
                  {analysis.photoUri && (
                    <Image
                      source={{ uri: analysis.photoUri }}
                      className="w-14 h-14 rounded-xl mr-4"
                      resizeMode="cover"
                    />
                  )}
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-bold text-lg mr-2">{analysis.score}</Text>
                      <View
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: typeColors[analysis.darkCircleType] }}
                      />
                    </View>
                    <Text className="text-[#9CA3AF] text-sm">
                      {format(parseISO(analysis.date), 'dd MMMM yyyy', { locale: fr })}
                    </Text>
                  </View>
                  {index > 0 && (
                    <View
                      className={`px-2 py-1 rounded-full ${
                        analyses[index - 1].score > analysis.score
                          ? 'bg-rose-500/20'
                          : analyses[index - 1].score < analysis.score
                          ? 'bg-emerald-500/20'
                          : 'bg-[#2D2555]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          analyses[index - 1].score > analysis.score
                            ? 'text-rose-500'
                            : analyses[index - 1].score < analysis.score
                            ? 'text-emerald-500'
                            : 'text-[#9CA3AF]'
                        }`}
                      >
                        {analyses[index - 1].score > analysis.score
                          ? `+${analysis.score - analyses[index - 1].score}`
                          : analyses[index - 1].score < analysis.score
                          ? `-${analyses[index - 1].score - analysis.score}`
                          : '='}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
            <Text className="text-[#6B7280] text-xs text-center mt-4">
              Maintenez appuyé pour comparer
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
