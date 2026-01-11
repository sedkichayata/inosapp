import { useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInUp,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Scan, TrendingUp, Sparkles, ChevronRight, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';

const { width, height } = Dimensions.get('window');

const Logo = require('../../assets/logoinos.png');

interface IntroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string[];
}

const slides: IntroSlide[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur INOS',
    subtitle: 'Skin Intelligence',
    description: 'Découvrez la science derrière votre regard grâce à notre technologie d\'analyse avancée.',
    icon: <View />,
    gradient: ['#8B5CF6', '#6366F1'],
  },
  {
    id: 'scan',
    title: 'Analysez vos cernes',
    subtitle: 'Scan intelligent',
    description: 'Notre IA analyse votre visage pour identifier le type de cernes et leur origine : vasculaires, pigmentaires, structurels ou mixtes.',
    icon: <Scan size={48} color="#8B5CF6" />,
    gradient: ['#8B5CF6', '#3B82F6'],
  },
  {
    id: 'progress',
    title: 'Suivez vos progrès',
    subtitle: 'Évolution visible',
    description: 'Comparez vos analyses au fil du temps et observez l\'amélioration de votre regard grâce à nos recommandations personnalisées.',
    icon: <TrendingUp size={48} color="#8B5CF6" />,
    gradient: ['#6366F1', '#8B5CF6'],
  },
  {
    id: 'routine',
    title: 'Routine sur mesure',
    subtitle: 'Conseils experts',
    description: 'Recevez des conseils adaptés à votre type de cernes et découvrez les produits les plus efficaces pour votre peau.',
    icon: <Sparkles size={48} color="#8B5CF6" />,
    gradient: ['#3B82F6', '#8B5CF6'],
  },
];

function SlideItem({ item, index, scrollX }: { item: IntroSlide; index: number; scrollX: Animated.SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={{ width, paddingHorizontal: 24 }}>
      <View className="flex-1 items-center justify-center">
        {/* Icon container */}
        <Animated.View style={animatedStyle}>
          {index === 0 ? (
            <View className="mb-8">
              <LinearGradient
                colors={['#8B5CF620', '#3B82F620']}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={Logo}
                  style={{ width: 100, height: 100, tintColor: '#8B5CF6' }}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
          ) : (
            <View className="mb-8">
              <LinearGradient
                colors={['#1A1625', '#12101A']}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#2D2555',
                }}
              >
                {item.icon}
              </LinearGradient>
            </View>
          )}
        </Animated.View>

        {/* Text content */}
        <Animated.View style={animatedStyle} className="items-center">
          <Text className="text-[#8B5CF6] text-sm font-medium tracking-widest uppercase mb-2">
            {item.subtitle}
          </Text>
          <Text className="text-white text-3xl font-bold text-center mb-4">
            {item.title}
          </Text>
          <Text className="text-[#9CA3AF] text-base text-center leading-6 px-4">
            {item.description}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function PaginationDot({ index, scrollX }: { index: number; scrollX: Animated.SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return {
      width: dotWidth,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[animatedStyle, { height: 8, borderRadius: 4 }]}
    >
      <LinearGradient
        colors={['#8B5CF6', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, borderRadius: 4 }}
      />
    </Animated.View>
  );
}

function Pagination({ scrollX, total }: { scrollX: Animated.SharedValue<number>; total: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <PaginationDot key={index} index={index} scrollX={scrollX} />
      ))}
    </View>
  );
}

export default function IntroScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const setHasSeenIntro = useAppStore((s) => s.setHasSeenIntro);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleGetStarted();
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasSeenIntro(true);
    router.replace('/onboarding');
  };

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
  };

  const handleMomentumScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      {/* Background gradient */}
      <LinearGradient
        colors={['#0A0A0F', '#12101A', '#0A0A0F']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Ambient glow */}
      <View
        style={{
          position: 'absolute',
          top: height * 0.2,
          left: width / 2 - 150,
          width: 300,
          height: 300,
          borderRadius: 150,
        }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(139, 92, 246, 0.08)', 'transparent']}
          style={{ flex: 1, borderRadius: 150 }}
        />
      </View>

      <SafeAreaView className="flex-1">
        {/* Header with skip button */}
        <Animated.View entering={FadeIn.delay(300)} className="flex-row justify-end px-5 pt-2">
          <Pressable
            onPress={handleSkip}
            className="py-2 px-4"
          >
            <Text className="text-[#9CA3AF] font-medium">Passer</Text>
          </Pressable>
        </Animated.View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <SlideItem item={item} index={index} scrollX={scrollX} />
          )}
          contentContainerStyle={{ alignItems: 'center' }}
          style={{ flexGrow: 0, height: height * 0.6 }}
        />

        {/* Bottom section */}
        <Animated.View entering={FadeInUp.delay(500)} className="flex-1 justify-end pb-8 px-6">
          {/* Pagination */}
          <View className="mb-8">
            <Pagination scrollX={scrollX} total={slides.length} />
          </View>

          {/* Action button */}
          <Pressable onPress={handleNext}>
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              }}
            >
              <Text className="text-white text-lg font-semibold mr-2">
                {isLastSlide ? 'Commencer le diagnostic' : 'Suivant'}
              </Text>
              {isLastSlide ? (
                <ArrowRight size={20} color="#fff" />
              ) : (
                <ChevronRight size={20} color="#fff" />
              )}
            </LinearGradient>
          </Pressable>

          {/* Already have account */}
          {isLastSlide && (
            <Animated.View entering={FadeIn.delay(200)} className="mt-4">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHasSeenIntro(true);
                  router.replace('/onboarding');
                }}
                className="py-3"
              >
                <Text className="text-[#9CA3AF] text-center">
                  Déjà un compte ? <Text className="text-[#8B5CF6] font-medium">Se connecter</Text>
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
