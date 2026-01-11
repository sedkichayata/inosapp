import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Dimensions, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { ChevronRight, Scan, Sparkles, TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Height for bottom controls (buttons + dots + padding)
const BOTTOM_CONTROLS_HEIGHT = 180;

// Logos
const IconLogo = require('../../assets/iconinos.png');
const TextLogo = require('../../assets/logoinos.png');

interface SplashSlide {
  id: string;
  type: 'logo' | 'feature';
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
}

const slides: SplashSlide[] = [
  {
    id: 'logo',
    type: 'logo',
  },
  {
    id: 'scan',
    type: 'feature',
    title: 'Analysez vos cernes',
    subtitle: 'Scan intelligent',
    description: 'Notre IA analyse votre visage pour identifier le type de cernes et leur origine.',
    icon: <Scan size={48} color="#8B5CF6" />,
  },
  {
    id: 'track',
    type: 'feature',
    title: 'Suivez vos progrès',
    subtitle: 'Évolution visible',
    description: 'Comparez vos analyses dans le temps et visualisez votre amélioration.',
    icon: <TrendingUp size={48} color="#8B5CF6" />,
  },
  {
    id: 'routine',
    type: 'feature',
    title: 'Routine personnalisée',
    subtitle: 'Conseils experts',
    description: 'Recevez des recommandations adaptées à votre type de cernes.',
    icon: <Sparkles size={48} color="#8B5CF6" />,
  },
];

function LogoSlide() {
  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const textLogoOpacity = useSharedValue(0);
  const textLogoTranslateY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    // Icon animation
    iconOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    iconScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // Glow effect
    glowOpacity.value = withDelay(200, withTiming(0.8, { duration: 800 }));
    glowScale.value = withDelay(200, withSpring(1.2, { damping: 10, stiffness: 60 }));

    // Ring pulse
    ringOpacity.value = withDelay(400, withTiming(0.6, { duration: 600 }));
    ringScale.value = withDelay(400,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1500, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic) })
        ),
        -1,
        true
      )
    );

    // Text logo
    textLogoOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    textLogoTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 100 }));

    // Tagline
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));

    // Continuous glow pulse
    setTimeout(() => {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 2000 }),
          withTiming(0.8, { duration: 2000 })
        ),
        -1,
        true
      );
    }, 1000);
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const textLogoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textLogoOpacity.value,
    transform: [{ translateY: textLogoTranslateY.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={{ width, height: height - BOTTOM_CONTROLS_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
      {/* Ambient glow */}
      <Animated.View
        style={[
          glowAnimatedStyle,
          {
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: 140,
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)', 'transparent']}
          style={{ flex: 1, borderRadius: 140 }}
        />
      </Animated.View>

      {/* Pulsing ring */}
      <Animated.View
        style={[
          ringAnimatedStyle,
          {
            position: 'absolute',
            width: 160,
            height: 160,
            borderRadius: 80,
            borderWidth: 1,
            borderColor: 'rgba(139, 92, 246, 0.3)',
          },
        ]}
      />

      {/* Icon Logo */}
      <Animated.View style={iconAnimatedStyle}>
        <View
          style={{
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 30,
            elevation: 20,
          }}
        >
          <Image
            source={IconLogo}
            style={{ width: 120, height: 120, borderRadius: 24 }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* Text Logo */}
      <Animated.View style={[textLogoAnimatedStyle, { marginTop: 40 }]}>
        <Image
          source={TextLogo}
          style={{ width: width * 0.5, height: 50 }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[taglineAnimatedStyle, { marginTop: 16 }]}>
        <Text className="text-sm text-[#8B5CF6]/90 tracking-[4px] uppercase font-medium">
          Skin Intelligence
        </Text>
      </Animated.View>
    </View>
  );
}

function FeatureSlide({ slide }: { slide: SplashSlide }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(100, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={{ width, height: height - BOTTOM_CONTROLS_HEIGHT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Animated.View style={animatedStyle} className="items-center">
        {/* Icon container */}
        <View className="w-24 h-24 rounded-3xl bg-[#1A1625] items-center justify-center mb-8 border border-[#8B5CF6]/20">
          {slide.icon}
        </View>

        {/* Subtitle */}
        <Text className="text-[#8B5CF6] text-sm tracking-[3px] uppercase mb-3">
          {slide.subtitle}
        </Text>

        {/* Title */}
        <Text className="text-white text-3xl font-bold text-center mb-4">
          {slide.title}
        </Text>

        {/* Description */}
        <Text className="text-[#9CA3AF] text-base text-center leading-6">
          {slide.description}
        </Text>
      </Animated.View>
    </View>
  );
}

export default function SplashScreen() {
  const router = useRouter();
  const hasSeenIntro = useAppStore((s) => s.hasSeenIntro);
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const setHasSeenIntro = useAppStore((s) => s.setHasSeenIntro);
  const user = useAppStore((s) => s.user);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);

  useEffect(() => {
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(1000, withSpring(0, { damping: 15, stiffness: 100 }));
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const navigateToNextScreen = () => {
    setHasSeenIntro(true);

    if (!hasSeenOnboarding || !user) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigateToNextScreen();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigateToNextScreen();
  };

  const renderSlide = ({ item }: { item: SplashSlide }) => {
    if (item.type === 'logo') {
      return <LogoSlide />;
    }
    return <FeatureSlide slide={item} />;
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <LinearGradient
        colors={['#0A0A0F', '#150F20', '#0A0A0F']}
        locations={[0, 0.5, 1]}
        style={{ flex: 1 }}
      >
        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          scrollEventThrottle={16}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ alignItems: 'center' }}
        />

        {/* Bottom section */}
        <Animated.View
          style={[buttonAnimatedStyle, { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 48, paddingHorizontal: 24 }]}
          pointerEvents="box-none"
        >
          {/* Pagination dots */}
          <View className="flex-row justify-center mb-8">
            {slides.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full mx-1.5 ${
                  index === currentIndex ? 'bg-[#8B5CF6]' : 'bg-[#8B5CF6]/30'
                }`}
              />
            ))}
          </View>

          {/* Buttons */}
          <View className="flex-row items-center justify-between">
            {/* Skip button */}
            <Pressable
              onPress={handleSkip}
              style={{ paddingVertical: 12, paddingHorizontal: 16 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-[#6B7280] text-base">Passer</Text>
            </Pressable>

            {/* Next/Start button */}
            <Pressable
              onPress={handleNext}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#8B5CF6',
                paddingVertical: 14,
                paddingHorizontal: 24,
                borderRadius: 9999
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-white font-semibold text-base mr-2">
                {isLastSlide ? 'Commencer' : 'Suivant'}
              </Text>
              <ChevronRight size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Swipe hint on first slide */}
          {currentIndex === 0 && (
            <View className="items-center mt-6">
              <Text className="text-[#6B7280]/60 text-xs">
                Swipez pour découvrir
              </Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
