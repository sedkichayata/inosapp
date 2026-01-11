import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
  Easing,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Camera,
  ImageIcon,
  RotateCcw,
  ScanEye,
  CheckCircle2,
  Eye,
  Crown,
  Sparkles
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';

const { width, height } = Dimensions.get('window');
const minDim = Math.min(width, height);
const FACE_OVAL_WIDTH = minDim * 0.7;
const FACE_OVAL_HEIGHT = FACE_OVAL_WIDTH * 1.4;

type ScanMode = 'basic' | 'premium';

// Simulated face validation states
type FaceStatus = 'searching' | 'positioning' | 'ready' | 'capturing';

const STATUS_MESSAGES: Record<FaceStatus, string> = {
  searching: 'Recherche du visage...',
  positioning: 'Centrez votre visage',
  ready: 'Visage détecté - Prêt',
  capturing: 'Capture en cours...',
};

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>(
    params.mode === 'fullface' ? 'premium' : 'basic'
  );
  const [faceStatus, setFaceStatus] = useState<FaceStatus>('searching');
  const [arEnabled, setArEnabled] = useState(true);

  const subscription = useAppStore((s) => s.subscription);

  // Animation values
  const scanLineY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const borderProgress = useSharedValue(0);
  const statusScale = useSharedValue(1);
  const captureButtonScale = useSharedValue(1);
  const arZoneOpacity = useSharedValue(0);

  // Simulate face detection cycle
  useEffect(() => {
    const cycle = () => {
      // Simulate face detection states
      const sequence: FaceStatus[] = ['searching', 'positioning', 'ready'];
      let index = 0;

      const interval = setInterval(() => {
        if (isCapturing) return;

        // Once we reach 'ready', stay there (simulating stable detection)
        if (faceStatus === 'ready' && index >= 2) {
          // Randomly "lose" face sometimes for realism
          if (Math.random() > 0.9) {
            setFaceStatus('positioning');
            index = 1;
          }
          return;
        }

        setFaceStatus(sequence[index]);
        if (index < 2) index++;
      }, 1500);

      return () => clearInterval(interval);
    };

    const cleanup = cycle();
    return cleanup;
  }, [isCapturing]);

  // Update animations based on face status
  useEffect(() => {
    const isReady = faceStatus === 'ready';

    borderProgress.value = withTiming(isReady ? 1 : 0, { duration: 300 });
    statusScale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withSpring(1)
    );

    if (isReady) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      arZoneOpacity.value = withTiming(1, { duration: 500 });
    } else {
      arZoneOpacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [faceStatus]);

  // Scan line animation
  useEffect(() => {
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(FACE_OVAL_HEIGHT - 4, {
          duration: 2500,
          easing: Easing.bezier(0.4, 0, 0.2, 1)
        }),
        withTiming(0, {
          duration: 2500,
          easing: Easing.bezier(0.4, 0, 0.2, 1)
        })
      ),
      -1,
      false
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
    opacity: faceStatus === 'ready' ? 0.9 : 0.5,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      borderProgress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.3)', 'rgba(16, 185, 129, 0.8)']
    ),
    borderWidth: borderProgress.value === 1 ? 3 : 2,
  }));

  const statusBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statusScale.value }],
  }));

  const captureButtonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureButtonScale.value }],
  }));

  const arZoneStyle = useAnimatedStyle(() => ({
    opacity: arZoneOpacity.value,
  }));

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing || faceStatus !== 'ready') {
      if (faceStatus !== 'ready') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

    setIsCapturing(true);
    setFaceStatus('capturing');

    // Flash effect via haptics
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    captureButtonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1)
    );

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true,
      });

      if (photo?.uri) {
        // Navigate based on scan mode
        if (scanMode === 'premium') {
          router.push({
            pathname: '/premium-scan-results',
            params: { photoUri: photo.uri },
          });
        } else {
          router.push({
            pathname: '/results',
            params: { photoUri: photo.uri },
          });
        }
      }
    } catch (error) {
      console.log('Capture error:', error);
      setFaceStatus('ready');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      if (scanMode === 'premium') {
        router.push({
          pathname: '/premium-scan-results',
          params: { photoUri: result.assets[0].uri },
        });
      } else {
        router.push({
          pathname: '/results',
          params: { photoUri: result.assets[0].uri },
        });
      }
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const user = useAppStore.getState().user;
    if (user?.onboardingCompleted) {
      router.replace('/(tabs)');
    } else {
      router.back();
    }
  };

  const handleScanModeChange = (mode: ScanMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScanMode(mode);
  };

  const toggleAR = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setArEnabled(!arEnabled);
  };

  const isFaceReady = faceStatus === 'ready';

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Chargement...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <LinearGradient
            colors={['#8B5CF620', '#3B82F620']}
            style={styles.permissionIcon}
          >
            <Camera size={40} color="#8B5CF6" />
          </LinearGradient>
          <Text className="text-white text-2xl font-semibold text-center mb-3">
            Accès à la caméra
          </Text>
          <Text className="text-[#9CA3AF] text-base text-center mb-8">
            INOS a besoin d'accéder à votre caméra pour analyser vos cernes et suivre vos progrès.
          </Text>
          <Pressable onPress={requestPermission}>
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.permissionButton}
            >
              <Text className="text-white font-semibold text-lg">Autoriser l'accès</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={handlePickImage} className="mt-4 py-3">
            <Text className="text-[#8B5CF6] font-medium">Choisir une photo</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
      >
        {/* Dark overlay gradient */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
          locations={[0, 0.25, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView className="flex-1">
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="flex-row items-center justify-between px-4 pt-2"
          >
            <Pressable
              onPress={handleClose}
              className="w-11 h-11 rounded-full bg-black/30 items-center justify-center"
              style={styles.glassButton}
            >
              <ChevronLeft size={24} color="#fff" />
            </Pressable>

            <View className="items-center bg-black/30 px-4 py-2 rounded-full" style={styles.glassButton}>
              <Text className="text-white text-sm font-bold tracking-widest uppercase">
                Scanner Biométrique
              </Text>
            </View>

            <Pressable
              onPress={toggleAR}
              className="w-11 h-11 rounded-full items-center justify-center"
              style={[
                styles.glassButton,
                arEnabled && styles.arButtonActive
              ]}
            >
              <Sparkles size={22} color={arEnabled ? '#fff' : '#9CA3AF'} />
            </Pressable>
          </Animated.View>

          {/* Scan Mode Toggle */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="flex-row items-center justify-center mt-4 px-5"
          >
            <View className="flex-row bg-black/40 rounded-full p-1" style={styles.glassButton}>
              <Pressable onPress={() => handleScanModeChange('basic')}>
                {scanMode === 'basic' ? (
                  <LinearGradient
                    colors={['#8B5CF6', '#6366F1']}
                    style={styles.modeButtonActive}
                  >
                    <Eye size={16} color="#fff" />
                    <Text className="ml-2 font-semibold text-white">Cernes</Text>
                  </LinearGradient>
                ) : (
                  <View className="flex-row items-center px-4 py-2 rounded-full">
                    <Eye size={16} color="#9CA3AF" />
                    <Text className="ml-2 font-medium text-[#9CA3AF]">Cernes</Text>
                  </View>
                )}
              </Pressable>
              <Pressable onPress={() => handleScanModeChange('premium')}>
                {scanMode === 'premium' ? (
                  <LinearGradient
                    colors={['#8B5CF6', '#6366F1']}
                    style={styles.modeButtonActive}
                  >
                    <Crown size={16} color="#fff" />
                    <Text className="ml-2 font-semibold text-white">Complet</Text>
                  </LinearGradient>
                ) : (
                  <View className="flex-row items-center px-4 py-2 rounded-full">
                    <Crown size={16} color="#8B5CF6" />
                    <Text className="ml-2 font-medium text-[#8B5CF6]">Complet</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </Animated.View>

          {/* Face oval guide with AR */}
          <View className="flex-1 items-center justify-center">
            <Animated.View style={pulseStyle}>
              <Animated.View
                style={[
                  styles.faceOval,
                  borderStyle,
                ]}
              >
                {/* Scan line */}
                {isFaceReady && (
                  <Animated.View
                    style={[
                      scanLineStyle,
                      styles.scanLine,
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', '#10B981', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1 }}
                    />
                  </Animated.View>
                )}

                {/* Corner indicators */}
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />

                {/* AR Eye zones - only when AR enabled and face ready */}
                {arEnabled && (
                  <Animated.View style={[styles.arZonesContainer, arZoneStyle]}>
                    {/* Left eye zone */}
                    <View style={[styles.eyeZone, styles.leftEyeZone]}>
                      <LinearGradient
                        colors={['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.1)']}
                        style={styles.eyeZoneGradient}
                      />
                    </View>
                    {/* Right eye zone */}
                    <View style={[styles.eyeZone, styles.rightEyeZone]}>
                      <LinearGradient
                        colors={['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.1)']}
                        style={styles.eyeZoneGradient}
                      />
                    </View>

                    {/* Additional zones for premium mode */}
                    {scanMode === 'premium' && (
                      <>
                        {/* Forehead zone */}
                        <View style={styles.foreheadZone}>
                          <LinearGradient
                            colors={['rgba(99, 102, 241, 0.2)', 'transparent']}
                            style={styles.zoneGradient}
                          />
                        </View>
                        {/* Cheek zones */}
                        <View style={[styles.cheekZone, styles.leftCheekZone]}>
                          <LinearGradient
                            colors={['rgba(99, 102, 241, 0.15)', 'transparent']}
                            style={styles.zoneGradient}
                          />
                        </View>
                        <View style={[styles.cheekZone, styles.rightCheekZone]}>
                          <LinearGradient
                            colors={['rgba(99, 102, 241, 0.15)', 'transparent']}
                            style={styles.zoneGradient}
                          />
                        </View>
                      </>
                    )}
                  </Animated.View>
                )}
              </Animated.View>
            </Animated.View>
          </View>

          {/* Status Bubble */}
          <Animated.View
            entering={FadeIn.delay(300)}
            className="items-center mb-6"
          >
            <Animated.View
              style={[
                statusBubbleStyle,
                styles.statusBubble,
                isFaceReady && styles.statusBubbleReady
              ]}
            >
              {isFaceReady ? (
                <CheckCircle2 size={18} color="#10B981" />
              ) : (
                <ScanEye size={18} color="#9CA3AF" />
              )}
              <Text
                className={`ml-2 text-sm font-bold tracking-wide ${
                  isFaceReady ? 'text-white' : 'text-[#D1D5DB]'
                }`}
              >
                {STATUS_MESSAGES[faceStatus]}
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Bottom controls */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            className="flex-row items-center justify-center pb-10 gap-8"
          >
            {/* Gallery button */}
            <Pressable
              onPress={handlePickImage}
              className="w-14 h-14 rounded-full bg-black/30 items-center justify-center"
              style={styles.glassButton}
            >
              <ImageIcon size={24} color="#fff" />
            </Pressable>

            {/* Capture button */}
            <Animated.View style={captureButtonAnimStyle}>
              <Pressable
                onPress={handleCapture}
                disabled={isCapturing}
                style={[
                  styles.captureButton,
                  !isFaceReady && styles.captureButtonDisabled
                ]}
              >
                <LinearGradient
                  colors={isFaceReady ? ['#8B5CF6', '#6366F1'] : ['#4B5563', '#374151']}
                  style={styles.captureButtonGradient}
                >
                  {isCapturing ? (
                    <View style={styles.capturingIndicator} />
                  ) : (
                    <View
                      style={[
                        styles.captureButtonInner,
                        isFaceReady && styles.captureButtonInnerReady
                      ]}
                    />
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Flip camera button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFacing(facing === 'front' ? 'back' : 'front');
              }}
              className="w-14 h-14 rounded-full bg-black/30 items-center justify-center"
              style={styles.glassButton}
            >
              <RotateCcw size={22} color="#fff" />
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  glassButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  arButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  modeButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  faceOval: {
    width: FACE_OVAL_WIDTH,
    height: FACE_OVAL_HEIGHT,
    borderRadius: FACE_OVAL_WIDTH / 2,
    overflow: 'hidden',
    borderStyle: 'dashed',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#8B5CF6',
  },
  cornerTopLeft: {
    top: 12,
    left: 12,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 12,
    right: 12,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 12,
    left: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 12,
    right: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderBottomRightRadius: 8,
  },
  arZonesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  eyeZone: {
    position: 'absolute',
    width: FACE_OVAL_WIDTH * 0.28,
    height: FACE_OVAL_HEIGHT * 0.12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  leftEyeZone: {
    top: FACE_OVAL_HEIGHT * 0.32,
    left: FACE_OVAL_WIDTH * 0.12,
  },
  rightEyeZone: {
    top: FACE_OVAL_HEIGHT * 0.32,
    right: FACE_OVAL_WIDTH * 0.12,
  },
  eyeZoneGradient: {
    flex: 1,
    borderRadius: 20,
  },
  foreheadZone: {
    position: 'absolute',
    top: FACE_OVAL_HEIGHT * 0.1,
    left: FACE_OVAL_WIDTH * 0.25,
    width: FACE_OVAL_WIDTH * 0.5,
    height: FACE_OVAL_HEIGHT * 0.12,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  cheekZone: {
    position: 'absolute',
    width: FACE_OVAL_WIDTH * 0.22,
    height: FACE_OVAL_HEIGHT * 0.18,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  leftCheekZone: {
    top: FACE_OVAL_HEIGHT * 0.48,
    left: FACE_OVAL_WIDTH * 0.08,
  },
  rightCheekZone: {
    top: FACE_OVAL_HEIGHT * 0.48,
    right: FACE_OVAL_WIDTH * 0.08,
  },
  zoneGradient: {
    flex: 1,
  },
  statusBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBubbleReady: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  captureButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  captureButtonDisabled: {
    shadowOpacity: 0,
  },
  captureButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInnerReady: {
    backgroundColor: '#fff',
    transform: [{ scale: 0.85 }],
  },
  capturingIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#fff',
    borderTopColor: 'transparent',
  },
});
