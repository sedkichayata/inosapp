import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore, SkinMetric, MetricCondition, ZoneScore } from '@/lib/store';

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

const zoneLabels: Record<string, string> = {
  forehead: 'Front',
  leftCheek: 'Joue gauche',
  rightCheek: 'Joue droite',
  nose: 'Nez',
  chin: 'Menton',
  leftEyeArea: 'Zone œil gauche',
  rightEyeArea: 'Zone œil droit',
};

const metricDescriptions: Record<string, string> = {
  'Acné': 'Ce score évalue la présence d\'imperfections cutanées telles que les boutons, points noirs et microkystes. Un score élevé indique une peau claire et sans imperfections.',
  'Hydratation': 'Mesure le niveau d\'hydratation de votre peau. Une bonne hydratation est essentielle pour maintenir l\'élasticité et l\'éclat de la peau. Un score bas indique une peau déshydratée.',
  'Rides': 'Évalue la présence de rides et ridules sur votre visage. Un score élevé signifie peu ou pas de rides visibles. Les rides apparaissent naturellement avec l\'âge et l\'exposition au soleil.',
  'Pigmentation': 'Analyse l\'uniformité de votre teint et la présence de taches pigmentaires. Un score élevé indique un teint uniforme sans taches brunes ou zones d\'hyperpigmentation.',
  'Pores': 'Mesure la visibilité et la taille de vos pores. Un score élevé signifie des pores peu visibles. Les pores dilatés sont souvent liés à une production excessive de sébum.',
  'Rougeurs': 'Évalue la présence de rougeurs et d\'inflammations sur votre peau. Un score élevé indique une peau calme sans rougeurs. Les rougeurs peuvent être causées par la rosacée ou la sensibilité.',
  'Éclat': 'Mesure la luminosité et le rayonnement de votre peau. Un score élevé indique une peau éclatante et lumineuse. L\'éclat est lié à une bonne hydratation et circulation sanguine.',
  'Uniformité': 'Analyse la texture générale de votre peau. Un score élevé signifie une peau lisse et uniforme sans irrégularités de texture.',
  'Zone Yeux': 'Évalue l\'état du contour des yeux incluant les cernes, poches et ridules. Cette zone est particulièrement sensible et révélatrice de l\'état général de la peau.',
};

function ZoneCard({ zoneName, zoneScore }: { zoneName: string; zoneScore: ZoneScore }) {
  return (
    <View className="bg-[#1A1A1E] rounded-xl p-4 mb-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-white font-medium">{zoneLabels[zoneName] || zoneName}</Text>
        <View className="flex-row items-center">
          <Text className="text-white text-xl font-bold mr-2">{zoneScore.score}</Text>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: `${conditionColors[zoneScore.condition]}20` }}
          >
            <Text
              style={{ color: conditionColors[zoneScore.condition] }}
              className="text-xs font-medium"
            >
              {conditionLabels[zoneScore.condition]}
            </Text>
          </View>
        </View>
      </View>
      {/* Progress bar */}
      <View className="mt-2 h-1.5 bg-[#2A2A2E] rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${zoneScore.score}%`,
            backgroundColor: conditionColors[zoneScore.condition],
          }}
        />
      </View>
    </View>
  );
}

// Face mask SVG component showing zones
function FaceMask({ metric, activeZone }: { metric: SkinMetric; activeZone?: string }) {
  const zones = metric.zones;

  const getZoneColor = (zone: ZoneScore | undefined) => {
    if (!zone) return '#2A2A2E';
    return conditionColors[zone.condition];
  };

  return (
    <View className="items-center mb-6">
      <View className="relative" style={{ width: 200, height: 260 }}>
        {/* Simple face outline representation */}
        <View className="absolute inset-0 items-center">
          {/* Face shape */}
          <View
            className="rounded-[100px] border-2 border-[#2A2A2E]"
            style={{ width: 160, height: 200, marginTop: 30 }}
          >
            {/* Forehead */}
            {zones.forehead && (
              <View
                className="absolute top-4 left-8 right-8 h-12 rounded-t-full"
                style={{ backgroundColor: `${getZoneColor(zones.forehead)}40` }}
              />
            )}

            {/* Left Cheek */}
            {zones.leftCheek && (
              <View
                className="absolute top-20 left-2 w-12 h-14 rounded-full"
                style={{ backgroundColor: `${getZoneColor(zones.leftCheek)}40` }}
              />
            )}

            {/* Right Cheek */}
            {zones.rightCheek && (
              <View
                className="absolute top-20 right-2 w-12 h-14 rounded-full"
                style={{ backgroundColor: `${getZoneColor(zones.rightCheek)}40` }}
              />
            )}

            {/* Nose */}
            {zones.nose && (
              <View
                className="absolute top-16 left-1/2 -translate-x-1/2 w-8 h-16 rounded-full"
                style={{ backgroundColor: `${getZoneColor(zones.nose)}40` }}
              />
            )}

            {/* Chin */}
            {zones.chin && (
              <View
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-10 rounded-full"
                style={{ backgroundColor: `${getZoneColor(zones.chin)}40` }}
              />
            )}

            {/* Left Eye Area */}
            {zones.leftEyeArea && (
              <View
                className="absolute top-12 left-6 w-10 h-6 rounded-full"
                style={{ backgroundColor: `${getZoneColor(zones.leftEyeArea)}40` }}
              />
            )}

            {/* Right Eye Area */}
            {zones.rightEyeArea && (
              <View
                className="absolute top-12 right-6 w-10 h-6 rounded-full"
                style={{ backgroundColor: `${getZoneColor(zones.rightEyeArea)}40` }}
              />
            )}
          </View>
        </View>
      </View>

      {/* Legend */}
      <View className="flex-row flex-wrap justify-center gap-3 mt-2">
        {Object.entries(conditionLabels).map(([key, label]) => (
          <View key={key} className="flex-row items-center">
            <View
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: conditionColors[key as MetricCondition] }}
            />
            <Text className="text-[#888] text-xs">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MetricDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ metricName?: string; analysisId?: string }>();

  const fullFaceAnalyses = useAppStore((s) => s.fullFaceAnalyses);

  // Find the analysis and metric
  const analysis = fullFaceAnalyses.find((a) => a.id === params.analysisId);

  const getMetricFromAnalysis = (): SkinMetric | null => {
    if (!analysis || !params.metricName) return null;

    const metricMap: Record<string, SkinMetric> = {
      'Acné': analysis.acneScore,
      'Hydratation': analysis.hydrationScore,
      'Rides': analysis.linesScore,
      'Pigmentation': analysis.pigmentationScore,
      'Pores': analysis.poresScore,
      'Rougeurs': analysis.rednessScore,
      'Éclat': analysis.translucencyScore,
      'Uniformité': analysis.uniformnessScore,
      'Zone Yeux': analysis.eyeAreaCondition,
    };

    return metricMap[params.metricName] || null;
  };

  const metric = getMetricFromAnalysis();

  if (!metric) {
    return (
      <View className="flex-1 bg-[#0A0A0B] items-center justify-center">
        <Text className="text-white">Métrique non trouvée</Text>
        <Pressable onPress={() => router.back()} className="mt-4 bg-[#C9A86C] px-6 py-3 rounded-xl">
          <Text className="text-black font-semibold">Retour</Text>
        </Pressable>
      </View>
    );
  }

  // Get zones that have data
  const activeZones = Object.entries(metric.zones).filter(
    (entry) => entry[1] !== undefined
  ) as [string, ZoneScore][];

  return (
    <View className="flex-1 bg-[#0A0A0B]">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} className="flex-row items-center px-5 pt-2 pb-4">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-full bg-[#1A1A1E] items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color="#888" />
          </Pressable>
          <Text className="text-white text-lg font-semibold flex-1">{metric.name}</Text>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Main Score */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} className="items-center px-5 mb-6">
            <View className="bg-[#141416] rounded-3xl border border-[#2A2A2E] p-6 w-full items-center">
              <Text className="text-[#888] text-sm mb-2">Score global</Text>
              <View className="flex-row items-baseline mb-2">
                <Text className="text-white text-6xl font-bold">{metric.value}</Text>
                <Text className="text-[#666] text-2xl ml-1">/100</Text>
              </View>
              <View
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: `${conditionColors[metric.condition]}20` }}
              >
                <Text
                  style={{ color: conditionColors[metric.condition] }}
                  className="text-lg font-semibold"
                >
                  {conditionLabels[metric.condition]}
                </Text>
              </View>

              {/* Progress bar */}
              <View className="w-full mt-4 h-3 bg-[#2A2A2E] rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${metric.value}%`,
                    backgroundColor: conditionColors[metric.condition],
                  }}
                />
              </View>
            </View>
          </Animated.View>

          {/* Face Visualization */}
          {activeZones.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Analyse par zone</Text>
              <View className="bg-[#141416] rounded-2xl border border-[#2A2A2E] p-4">
                <FaceMask metric={metric} />
              </View>
            </Animated.View>
          )}

          {/* Zone Details */}
          {activeZones.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} className="px-5 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Détail par zone</Text>
              <View className="bg-[#141416] rounded-2xl border border-[#2A2A2E] p-4">
                {activeZones.map(([zoneName, zoneScore], index) => (
                  <ZoneCard key={zoneName} zoneName={zoneName} zoneScore={zoneScore} />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} className="px-5 mb-8">
            <View className="bg-[#141416] rounded-2xl border border-[#2A2A2E] p-4">
              <View className="flex-row items-center mb-3">
                <Info size={18} color="#C9A86C" />
                <Text className="text-white font-semibold ml-2">À propos de cette métrique</Text>
              </View>
              <Text className="text-[#CCC] leading-6">
                {metricDescriptions[metric.name] || metric.description}
              </Text>
            </View>
          </Animated.View>

          {/* Bottom padding */}
          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
