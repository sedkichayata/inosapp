import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Image, Dimensions, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft, Share2, Crown, Droplets, Sun, Sparkles,
  Eye, CircleDot, Palette, Layers, Activity, ChevronRight,
  Calendar, User
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore, FullFaceAnalysis, SkinMetric, MetricCondition } from '@/lib/store';
import { useAuthContext } from '@/lib/AuthProvider';
import { analyzeFullFaceWithGemini } from '@/lib/gemini';
import { RadarChart } from '@/components/RadarChart';

const { width } = Dimensions.get('window');

const conditionColors: Record<MetricCondition, string> = {
  excellent: '#22C55E',
  good: '#84CC16',
  rather_bad: '#F59E0B',
  bad: '#EF4444',
};

const conditionLabels: Record<MetricCondition, string> = {
  excellent: 'Excellent',
  good: 'Bon',
  rather_bad: 'À améliorer',
  bad: 'Mauvais',
};

const metricIcons: Record<string, React.ReactNode> = {
  'Acné': <CircleDot size={18} color="#C9A86C" />,
  'Hydratation': <Droplets size={18} color="#C9A86C" />,
  'Rides': <Activity size={18} color="#C9A86C" />,
  'Pigmentation': <Palette size={18} color="#C9A86C" />,
  'Pores': <CircleDot size={18} color="#C9A86C" />,
  'Rougeurs': <Sun size={18} color="#C9A86C" />,
  'Éclat': <Sparkles size={18} color="#C9A86C" />,
  'Uniformité': <Layers size={18} color="#C9A86C" />,
  'Zone Yeux': <Eye size={18} color="#C9A86C" />,
};

function MetricCard({ metric, onPress }: { metric: SkinMetric; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-[#141416] rounded-2xl border border-[#2A2A2E] p-4 mb-3"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-9 h-9 rounded-xl bg-[#C9A86C]/10 items-center justify-center mr-3">
            {metricIcons[metric.name] || <Activity size={18} color="#C9A86C" />}
          </View>
          <View>
            <Text className="text-white font-semibold">{metric.name}</Text>
            <Text className="text-[#666] text-xs">{metric.description}</Text>
          </View>
        </View>
        <ChevronRight size={18} color="#666" />
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-white text-3xl font-bold mr-2">{metric.value}</Text>
          <Text className="text-[#666]">/100</Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: `${conditionColors[metric.condition]}20` }}
        >
          <Text style={{ color: conditionColors[metric.condition] }} className="text-sm font-medium">
            {conditionLabels[metric.condition]}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="mt-3 h-2 bg-[#2A2A2E] rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${metric.value}%`,
            backgroundColor: conditionColors[metric.condition],
          }}
        />
      </View>
    </Pressable>
  );
}

function ScoreCircle({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Animated.View entering={FadeIn.duration(500)}>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-white text-xl font-bold">{score}</Text>
          </View>
        </Animated.View>
      </View>
      <Text className="text-[#888] text-xs mt-1">{label}</Text>
    </View>
  );
}

export default function FullFaceResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<FullFaceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFullFaceAnalysis = useAppStore((s) => s.addFullFaceAnalysis);
  const getLatestFullFaceAnalysis = useAppStore((s) => s.getLatestFullFaceAnalysis);
  const { saveFullFaceAnalysis, isConfigured } = useAuthContext();

  useEffect(() => {
    const runAnalysis = async () => {
      const photoUri = params.photoUri;

      if (!photoUri) {
        // Try to get latest analysis from store
        const latest = getLatestFullFaceAnalysis();
        if (latest) {
          setAnalysis(latest);
          setIsLoading(false);
          return;
        }
        setError('Aucune photo à analyser');
        setIsLoading(false);
        return;
      }

      try {
        // Convert image to base64
        let base64Image: string;
        let mimeType = 'image/jpeg';

        if (Platform.OS === 'web') {
          const response = await fetch(photoUri);
          const blob = await response.blob();
          mimeType = blob.type || 'image/jpeg';
          base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          const FileSystem = await import('expo-file-system');
          base64Image = await FileSystem.readAsStringAsync(photoUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        const result = await analyzeFullFaceWithGemini(base64Image, mimeType);

        if (result.success && result.data) {
          const analysisWithPhoto = {
            ...result.data,
            photoUri,
          };
          setAnalysis(analysisWithPhoto);
          addFullFaceAnalysis(analysisWithPhoto);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Save to Supabase if configured
          if (isConfigured) {
            saveFullFaceAnalysis(analysisWithPhoto, photoUri).catch((err) => {
              console.log('Failed to save full face analysis to Supabase:', err);
            });
          }
        } else {
          setError(result.error || 'Erreur d\'analyse');
        }
      } catch (err) {
        console.error('Full face analysis error:', err);
        setError('Erreur lors de l\'analyse');
      } finally {
        setIsLoading(false);
      }
    };

    runAnalysis();
  }, [params.photoUri]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#0A0A0B] items-center justify-center">
        <Animated.View entering={FadeIn.duration(500)} className="items-center">
          <View className="w-24 h-24 rounded-full bg-[#C9A86C]/20 items-center justify-center mb-6">
            <Crown size={48} color="#C9A86C" />
          </View>
          <Text className="text-white text-xl font-semibold mb-2">Analyse Premium</Text>
          <Text className="text-[#888] text-center px-12">
            Notre IA analyse votre visage en détail...
          </Text>
          <View className="mt-8 flex-row">
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                entering={FadeIn.delay(i * 200).duration(500)}
                className="w-3 h-3 rounded-full bg-[#C9A86C] mx-1"
              />
            ))}
          </View>
        </Animated.View>
      </View>
    );
  }

  if (error || !analysis) {
    return (
      <View className="flex-1 bg-[#0A0A0B] items-center justify-center px-8">
        <Text className="text-white text-xl font-semibold mb-2">Erreur</Text>
        <Text className="text-[#888] text-center mb-6">{error || 'Une erreur est survenue'}</Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-[#C9A86C] px-6 py-3 rounded-xl"
        >
          <Text className="text-black font-semibold">Retour</Text>
        </Pressable>
      </View>
    );
  }

  const radarData = [
    { label: 'Hydratation', value: analysis.hydrationScore.value },
    { label: 'Acné', value: analysis.acneScore.value },
    { label: 'Uniformité', value: analysis.uniformnessScore.value },
    { label: 'Pores', value: analysis.poresScore.value },
    { label: 'Rides', value: analysis.linesScore.value },
    { label: 'Éclat', value: analysis.translucencyScore.value },
    { label: 'Rougeurs', value: analysis.rednessScore.value },
    { label: 'Pigmentation', value: analysis.pigmentationScore.value },
  ];

  const allMetrics = [
    analysis.acneScore,
    analysis.hydrationScore,
    analysis.linesScore,
    analysis.pigmentationScore,
    analysis.poresScore,
    analysis.rednessScore,
    analysis.translucencyScore,
    analysis.uniformnessScore,
    analysis.eyeAreaCondition,
  ];

  const skinToneLabels: Record<string, string> = {
    very_light: 'Très clair',
    light: 'Clair',
    intermediate: 'Intermédiaire',
    tan: 'Mat',
    brown: 'Foncé',
    dark: 'Très foncé',
  };

  return (
    <View className="flex-1 bg-[#0A0A0B]">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-full bg-[#1A1A1E] items-center justify-center"
          >
            <ArrowLeft size={20} color="#888" />
          </Pressable>
          <View className="flex-row items-center">
            <Crown size={16} color="#C9A86C" />
            <Text className="text-[#C9A86C] text-sm font-medium ml-1">Analyse Premium</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/share-diagnosis');
            }}
            className="w-10 h-10 rounded-full bg-[#1A1A1E] items-center justify-center"
          >
            <Share2 size={20} color="#888" />
          </Pressable>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Photo and Overall Score */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} className="px-5 mb-6">
            <View className="bg-[#141416] rounded-3xl border border-[#2A2A2E] overflow-hidden">
              {/* Photo */}
              {analysis.photoUri && (
                <Image
                  source={{ uri: analysis.photoUri }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
              )}

              {/* Overall Score */}
              <View className="p-5">
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-[#888] text-sm">Score global</Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-white text-5xl font-bold">{analysis.overallScore}</Text>
                      <Text className="text-[#666] text-lg ml-1">/100</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center mb-1">
                      <Calendar size={14} color="#888" />
                      <Text className="text-[#888] text-xs ml-1">
                        {new Date(analysis.date).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <User size={14} color="#888" />
                      <Text className="text-[#888] text-xs ml-1">
                        Âge perçu: {analysis.perceivedAge} ans
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Quick stats */}
                <View className="flex-row justify-between bg-[#1A1A1E] rounded-xl p-3">
                  <View className="items-center flex-1">
                    <Text className="text-white font-bold">{analysis.eyeAge}</Text>
                    <Text className="text-[#666] text-xs">Âge yeux</Text>
                  </View>
                  <View className="w-px bg-[#2A2A2E]" />
                  <View className="items-center flex-1">
                    <Text className="text-white font-bold">{skinToneLabels[analysis.skinTone]}</Text>
                    <Text className="text-[#666] text-xs">Teint</Text>
                  </View>
                  <View className="w-px bg-[#2A2A2E]" />
                  <View className="items-center flex-1">
                    <Text className="text-white font-bold">{analysis.itaScore}°</Text>
                    <Text className="text-[#666] text-xs">ITA Score</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Radar Chart */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Vue d'ensemble</Text>
            <View className="bg-[#141416] rounded-2xl border border-[#2A2A2E] p-4 items-center">
              <RadarChart data={radarData} size={width - 80} />
            </View>
          </Animated.View>

          {/* Priority Areas */}
          {analysis.priorityAreas.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} className="px-5 mb-6">
              <Text className="text-white text-lg font-semibold mb-3">Zones prioritaires</Text>
              <View className="flex-row flex-wrap gap-2">
                {analysis.priorityAreas.map((area, index) => (
                  <View
                    key={index}
                    className="bg-[#EF4444]/20 px-4 py-2 rounded-full"
                  >
                    <Text className="text-[#EF4444] font-medium">{area}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Detailed Metrics */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} className="px-5 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Analyse détaillée</Text>
            {allMetrics.map((metric, index) => (
              <Animated.View key={metric.name} entering={FadeInUp.delay(index * 50)}>
                <MetricCard
                  metric={metric}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: '/metric-detail',
                      params: { metricName: metric.name, analysisId: analysis.id }
                    });
                  }}
                />
              </Animated.View>
            ))}
          </Animated.View>

          {/* Recommendations */}
          <Animated.View entering={FadeInDown.delay(500).duration(500)} className="px-5 mb-8">
            <Text className="text-white text-lg font-semibold mb-4">Recommandations</Text>
            <View className="bg-[#141416] rounded-2xl border border-[#2A2A2E] p-4">
              {analysis.recommendations.map((rec, index) => (
                <View
                  key={index}
                  className={`flex-row items-start py-3 ${
                    index < analysis.recommendations.length - 1 ? 'border-b border-[#2A2A2E]' : ''
                  }`}
                >
                  <View className="w-6 h-6 rounded-full bg-[#C9A86C]/20 items-center justify-center mr-3 mt-0.5">
                    <Text className="text-[#C9A86C] text-xs font-bold">{index + 1}</Text>
                  </View>
                  <Text className="text-[#CCC] flex-1 leading-5">{rec}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Bottom padding for tab bar */}
          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
