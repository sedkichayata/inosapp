import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/lib/store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { ChevronRight, ChevronLeft, Moon, Sun, Droplets, Coffee, Eye, Sparkles, Mail, Lock, User, EyeOff, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthContext } from '@/lib/AuthProvider';

// Logo
const Logo = require('../../assets/iconinos.png');

interface QuizQuestion {
  id: string;
  question: string;
  subtitle?: string;
  type: 'single' | 'multiple' | 'text' | 'signup' | 'email_confirmation';
  options?: { value: string; label: string; icon?: React.ReactNode; description?: string }[];
}

const questions: QuizQuestion[] = [
  {
    id: 'welcome',
    question: 'Bienvenue sur INOS',
    subtitle: 'Découvrez la science derrière votre regard. En quelques questions, nous analyserons vos cernes pour vous proposer une routine personnalisée.',
    type: 'single',
    options: [{ value: 'start', label: 'Commencer le diagnostic', icon: <Sparkles size={20} color="#8B5CF6" /> }],
  },
  {
    id: 'sleep_quality',
    question: 'Comment décririez-vous la qualité de votre sommeil ?',
    subtitle: 'Le sommeil influence directement l\'apparence de vos cernes',
    type: 'single',
    options: [
      { value: 'excellent', label: 'Excellent', description: '7-9h de sommeil réparateur' },
      { value: 'good', label: 'Bon', description: '6-7h, quelques réveils' },
      { value: 'average', label: 'Moyen', description: 'Sommeil irrégulier' },
      { value: 'poor', label: 'Difficile', description: 'Insomnies fréquentes' },
    ],
  },
  {
    id: 'dark_circle_color',
    question: 'De quelle couleur sont vos cernes ?',
    subtitle: 'La couleur révèle le type de cernes',
    type: 'single',
    options: [
      { value: 'blue_purple', label: 'Bleu / Violet', description: 'Cernes vasculaires' },
      { value: 'brown', label: 'Marron / Bronze', description: 'Hyperpigmentation' },
      { value: 'dark_shadow', label: 'Ombre sombre', description: 'Cernes structurels' },
      { value: 'mixed', label: 'Mélange de couleurs', description: 'Cernes mixtes' },
    ],
  },
  {
    id: 'duration',
    question: 'Depuis combien de temps avez-vous des cernes ?',
    type: 'single',
    options: [
      { value: 'recent', label: 'Récemment', description: 'Moins de 6 mois' },
      { value: 'moderate', label: 'Quelque temps', description: '6 mois à 2 ans' },
      { value: 'long', label: 'Longtemps', description: 'Plus de 2 ans' },
      { value: 'always', label: 'Depuis toujours', description: 'Aussi loin que je me souvienne' },
    ],
  },
  {
    id: 'lifestyle',
    question: 'Quelles sont vos habitudes ?',
    subtitle: 'Sélectionnez tout ce qui s\'applique',
    type: 'multiple',
    options: [
      { value: 'screen_time', label: 'Écrans 6h+/jour', icon: <Eye size={18} color="#8B5CF6" /> },
      { value: 'caffeine', label: 'Café quotidien', icon: <Coffee size={18} color="#8B5CF6" /> },
      { value: 'hydration', label: 'Bonne hydratation', icon: <Droplets size={18} color="#8B5CF6" /> },
      { value: 'late_nights', label: 'Couche-tard', icon: <Moon size={18} color="#8B5CF6" /> },
      { value: 'early_riser', label: 'Lève-tôt', icon: <Sun size={18} color="#8B5CF6" /> },
    ],
  },
  {
    id: 'skin_type',
    question: 'Quel est votre type de peau ?',
    type: 'single',
    options: [
      { value: 'dry', label: 'Sèche', description: 'Tiraillements, desquamation' },
      { value: 'oily', label: 'Grasse', description: 'Brillance, pores visibles' },
      { value: 'combination', label: 'Mixte', description: 'Zone T grasse' },
      { value: 'normal', label: 'Normale', description: 'Équilibrée' },
      { value: 'sensitive', label: 'Sensible', description: 'Réactive, rougeurs' },
    ],
  },
  {
    id: 'goal',
    question: 'Quel est votre objectif principal ?',
    type: 'single',
    options: [
      { value: 'reduce', label: 'Réduire mes cernes', description: 'Atténuer visiblement' },
      { value: 'prevent', label: 'Prévenir l\'aggravation', description: 'Maintenir l\'état actuel' },
      { value: 'understand', label: 'Comprendre mes cernes', description: 'Diagnostic expert' },
      { value: 'routine', label: 'Routine personnalisée', description: 'Programme complet' },
    ],
  },
  {
    id: 'name',
    question: 'Comment devons-nous vous appeler ?',
    subtitle: 'Votre prénom pour personnaliser votre expérience',
    type: 'text',
  },
  {
    id: 'signup',
    question: 'Créez votre compte',
    subtitle: 'Un compte est nécessaire pour sauvegarder vos analyses et accéder à votre routine personnalisée',
    type: 'signup',
  },
  {
    id: 'email_confirmation',
    question: 'Confirmez votre email',
    subtitle: 'Un email de confirmation a été envoyé à votre adresse. Cliquez sur le lien pour activer votre compte.',
    type: 'email_confirmation',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { signUp, signIn, isConfigured, isAuthenticated, completeOnboarding: completeSupabaseOnboarding } = useAuthContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState('');

  // Auth state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [emailSent, setEmailSent] = useState(false);

  const setUser = useAppStore((s) => s.setUser);
  const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);

  const progress = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const updateProgress = (step: number) => {
    progress.value = withTiming((step / (questions.length - 1)) * 100, { duration: 300 });
  };

  const handleSelectOption = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentQuestion = questions[currentStep];

    if (currentQuestion.type === 'multiple') {
      setSelectedMultiple((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));

      // Auto-advance for single selection
      setTimeout(() => {
        handleNext();
      }, 300);
    }
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];

    if (currentQuestion.type === 'multiple') {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedMultiple }));
      setSelectedMultiple([]);
    }

    if (currentQuestion.type === 'text') {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: nameInput }));
    }

    if (currentQuestion.type === 'signup') {
      handleAuth();
      return;
    }

    if (currentQuestion.type === 'email_confirmation') {
      // Check if user confirmed their email
      checkEmailConfirmation();
      return;
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    updateProgress(nextStep);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateProgress(prevStep);
      setAuthError(null);
    }
  };

  const handleAuth = async () => {
    if (!isValidEmail(emailInput)) {
      setAuthError('Veuillez entrer un email valide');
      return;
    }

    if (passwordInput.length < 6) {
      setAuthError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (authMode === 'signup') {
        await signUp(emailInput.trim(), passwordInput, nameInput.trim());
        console.log('[onboarding] Signup successful');

        // Try to sign in immediately after signup
        try {
          await signIn(emailInput.trim(), passwordInput);
          console.log('[onboarding] Auto-login after signup successful');
          await finishOnboarding();
        } catch (signInErr: unknown) {
          const signInError = signInErr instanceof Error ? signInErr.message : '';

          // If email confirmation is required, show the confirmation step
          if (signInError.includes('Email not confirmed')) {
            console.log('[onboarding] Email confirmation required');
            setEmailSent(true);
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            updateProgress(nextStep);
          } else {
            // If sign-in works without confirmation, proceed
            await finishOnboarding();
          }
        }
      } else {
        await signIn(emailInput.trim(), passwordInput);
        console.log('[onboarding] Login successful');
        await finishOnboarding();
      }
    } catch (err: unknown) {
      console.error('[onboarding] Auth error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';

      // Translate common Supabase errors
      if (errorMessage.includes('Invalid login credentials')) {
        setAuthError('Email ou mot de passe incorrect');
      } else if (errorMessage.includes('User already registered')) {
        setAuthError('Cet email est déjà utilisé. Connectez-vous.');
        setAuthMode('login');
      } else if (errorMessage.includes('Email not confirmed')) {
        setAuthError('Veuillez confirmer votre email avant de vous connecter');
        setEmailSent(true);
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        updateProgress(nextStep);
      } else if (errorMessage.includes('Password should be')) {
        setAuthError('Le mot de passe doit contenir au moins 6 caractères');
      } else {
        setAuthError(errorMessage);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailConfirmation = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // Try to sign in - will work if email is confirmed
      await signIn(emailInput.trim(), passwordInput);
      console.log('[onboarding] Email confirmed, login successful');
      await finishOnboarding();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';

      if (errorMessage.includes('Email not confirmed')) {
        setAuthError('Email pas encore confirmé. Vérifiez votre boîte mail.');
      } else if (errorMessage.includes('Invalid login credentials')) {
        setAuthError('Email ou mot de passe incorrect');
      } else {
        setAuthError('Impossible de vérifier. Réessayez.');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const finishOnboarding = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const userName = nameInput || 'Utilisateur';
    const skinType = answers['skin_type'] as 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive' | undefined;
    const lifestyle = Array.isArray(answers['lifestyle']) ? answers['lifestyle'] : [];
    const darkCircleType = answers['dark_circle_color'] as string | undefined;
    const goals = answers['goal'] ? [answers['goal'] as string] : [];

    // Save to local store
    setUser({
      id: Date.now().toString(),
      name: userName,
      email: emailInput,
      skinType,
      concerns: ['dark_circles', ...lifestyle],
      onboardingCompleted: true,
      quizAnswers: answers as Record<string, string>,
    });

    setHasSeenOnboarding(true);

    // Save profile to Supabase
    if (isConfigured) {
      try {
        await completeSupabaseOnboarding({
          name: userName,
          skin_type: skinType,
          dark_circle_type: darkCircleType,
          goals: [...goals, ...lifestyle],
        });
        console.log('[onboarding] Profile saved to Supabase');
      } catch (err) {
        console.error('[onboarding] Failed to save profile to Supabase:', err);
      }
    }

    router.replace('/scan');
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canProceed = () => {
    const currentQuestion = questions[currentStep];
    if (currentQuestion.type === 'multiple') return selectedMultiple.length > 0;
    if (currentQuestion.type === 'text') return nameInput.trim().length > 0;
    if (currentQuestion.type === 'signup') return isValidEmail(emailInput) && passwordInput.length >= 6;
    if (currentQuestion.type === 'email_confirmation') return true;
    return !!answers[currentQuestion.id];
  };

  const renderSignupStep = () => (
    <View className="mt-4">
      {/* Toggle Login/Signup */}
      <View style={{ flexDirection: 'row', backgroundColor: '#1A1625', borderRadius: 12, padding: 4, marginBottom: 24 }}>
        <Pressable
          onPress={() => {
            setAuthMode('signup');
            setAuthError(null);
          }}
          style={{ flex: 1 }}
        >
          <View
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: authMode === 'signup' ? '#8B5CF6' : 'transparent',
            }}
          >
            <Text style={{ fontWeight: '600', color: authMode === 'signup' ? '#fff' : '#9CA3AF' }}>
              Inscription
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => {
            setAuthMode('login');
            setAuthError(null);
          }}
          style={{ flex: 1 }}
        >
          <View
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: authMode === 'login' ? '#8B5CF6' : 'transparent',
            }}
          >
            <Text style={{ fontWeight: '600', color: authMode === 'login' ? '#fff' : '#9CA3AF' }}>
              Connexion
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Name display (signup only) */}
      {authMode === 'signup' && nameInput && (
        <View className="flex-row items-center bg-[#12101A] rounded-2xl px-4 py-4 border border-[#2D2555] mb-4">
          <User size={20} color="#8B5CF6" />
          <Text className="flex-1 ml-3 text-[#8B5CF6] font-medium">{nameInput}</Text>
        </View>
      )}

      {/* Email field */}
      <View className="mb-4">
        <View className="flex-row items-center bg-[#12101A] rounded-2xl px-4 py-4 border border-[#2D2555]">
          <Mail size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-white text-base"
            placeholder="Email"
            placeholderTextColor="#6B7280"
            value={emailInput}
            onChangeText={(text) => {
              setEmailInput(text);
              setAuthError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>
      </View>

      {/* Password field */}
      <View className="mb-4">
        <View className="flex-row items-center bg-[#12101A] rounded-2xl px-4 py-4 border border-[#2D2555]">
          <Lock size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-white text-base"
            placeholder="Mot de passe (6+ caractères)"
            placeholderTextColor="#6B7280"
            value={passwordInput}
            onChangeText={(text) => {
              setPasswordInput(text);
              setAuthError(null);
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={20} color="#6B7280" />
            ) : (
              <Eye size={20} color="#6B7280" />
            )}
          </Pressable>
        </View>
      </View>

      {/* Error message */}
      {authError && (
        <Animated.View entering={FadeIn} className="mb-4">
          <Text className="text-red-500 text-center text-sm">{authError}</Text>
        </Animated.View>
      )}

      {/* Info box */}
      <View className="bg-[#12101A] rounded-2xl p-4 border border-[#2D2555] mt-2">
        <Text className="text-[#9CA3AF] text-sm mb-3">
          {authMode === 'signup'
            ? 'Avec votre compte, vous pouvez :'
            : 'Connectez-vous pour retrouver :'}
        </Text>
        <View className="gap-2">
          <View className="flex-row items-center">
            <View className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 items-center justify-center mr-3">
              <Text className="text-[#8B5CF6] text-xs">✓</Text>
            </View>
            <Text className="text-white text-sm">Vos analyses sauvegardées</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 items-center justify-center mr-3">
              <Text className="text-[#8B5CF6] text-xs">✓</Text>
            </View>
            <Text className="text-white text-sm">Votre progression</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 items-center justify-center mr-3">
              <Text className="text-[#8B5CF6] text-xs">✓</Text>
            </View>
            <Text className="text-white text-sm">Votre routine personnalisée</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEmailConfirmationStep = () => (
    <View className="mt-4">
      {/* Logo */}
      <View className="items-center mb-6">
        <Image
          source={Logo}
          style={{ width: 80, height: 80, tintColor: '#8B5CF6' }}
          resizeMode="contain"
        />
      </View>

      {/* Email sent confirmation */}
      <View className="items-center mb-8">
        <LinearGradient
          colors={['#8B5CF620', '#3B82F620']}
          style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
        >
          <Mail size={32} color="#8B5CF6" />
        </LinearGradient>
        <Text className="text-white text-lg font-medium text-center mb-2">
          Email envoyé à
        </Text>
        <Text className="text-[#8B5CF6] text-base text-center">
          {emailInput}
        </Text>
      </View>

      {/* Instructions */}
      <View className="bg-[#12101A] rounded-2xl p-5 border border-[#2D2555] mb-6">
        <Text className="text-white font-medium mb-4">Pour continuer :</Text>
        <View className="gap-4">
          <View className="flex-row">
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
            >
              <Text className="text-white font-bold text-sm">1</Text>
            </LinearGradient>
            <Text className="text-[#9CA3AF] flex-1">Ouvrez votre boîte mail</Text>
          </View>
          <View className="flex-row">
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
            >
              <Text className="text-white font-bold text-sm">2</Text>
            </LinearGradient>
            <Text className="text-[#9CA3AF] flex-1">Cliquez sur le lien de confirmation</Text>
          </View>
          <View className="flex-row">
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
            >
              <Text className="text-white font-bold text-sm">3</Text>
            </LinearGradient>
            <Text className="text-[#9CA3AF] flex-1">Revenez ici et appuyez sur "Continuer"</Text>
          </View>
        </View>
      </View>

      {/* Error message */}
      {authError && (
        <Animated.View entering={FadeIn} className="mb-4">
          <Text className="text-red-500 text-center text-sm">{authError}</Text>
        </Animated.View>
      )}

      {/* Spam notice */}
      <Text className="text-[#6B7280] text-xs text-center">
        Vérifiez vos spams si vous ne trouvez pas l'email
      </Text>
    </View>
  );

  const currentQuestion = questions[currentStep];

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <SafeAreaView className="flex-1">
        {/* Progress bar */}
        <View className="px-6 pt-4">
          <View className="flex-row items-center mb-4">
            {currentStep > 0 && currentQuestion.type !== 'email_confirmation' && (
              <Pressable onPress={handleBack} className="mr-4 p-2 -ml-2">
                <ChevronLeft size={24} color="#9CA3AF" />
              </Pressable>
            )}
            <View className="flex-1 h-1 bg-[#1A1625] rounded-full overflow-hidden">
              <Animated.View style={progressStyle}>
                <LinearGradient
                  colors={['#8B5CF6', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: '100%', borderRadius: 999 }}
                />
              </Animated.View>
            </View>
            <Text className="ml-4 text-[#6B7280] text-sm">
              {currentStep + 1}/{questions.length}
            </Text>
          </View>
        </View>

        {/* Question content */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View
            key={currentStep}
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            className="pt-8"
          >
            {/* Show logo on welcome screen */}
            {currentQuestion.id === 'welcome' && (
              <View className="items-center mb-8">
                <Image
                  source={Logo}
                  style={{ width: 120, height: 120, tintColor: '#8B5CF6' }}
                  resizeMode="contain"
                />
              </View>
            )}

            <Text className="text-3xl font-semibold text-white mb-3 leading-tight">
              {currentQuestion.question}
            </Text>
            {currentQuestion.subtitle && (
              <Text className="text-[#9CA3AF] text-base mb-8 leading-relaxed">
                {currentQuestion.subtitle}
              </Text>
            )}

            {/* Options */}
            {currentQuestion.options && (
              <View className="gap-3 mt-4">
                {currentQuestion.options.map((option) => {
                  const isSelected =
                    currentQuestion.type === 'multiple'
                      ? selectedMultiple.includes(option.value)
                      : answers[currentQuestion.id] === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSelectOption(option.value)}
                      className={`p-5 rounded-2xl border ${
                        isSelected
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                          : 'border-[#2D2555] bg-[#12101A]'
                      }`}
                    >
                      <View className="flex-row items-center">
                        {option.icon && <View className="mr-3">{option.icon}</View>}
                        <View className="flex-1">
                          <Text
                            className={`text-lg font-medium ${
                              isSelected ? 'text-[#8B5CF6]' : 'text-white'
                            }`}
                          >
                            {option.label}
                          </Text>
                          {option.description && (
                            <Text className="text-[#6B7280] text-sm mt-1">{option.description}</Text>
                          )}
                        </View>
                        {isSelected && (
                          <LinearGradient
                            colors={['#8B5CF6', '#3B82F6']}
                            style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Text className="text-white font-bold text-sm">✓</Text>
                          </LinearGradient>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Text input */}
            {currentQuestion.type === 'text' && (
              <View className="mt-4">
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Votre prénom"
                  placeholderTextColor="#6B7280"
                  className="bg-[#12101A] border border-[#2D2555] rounded-2xl px-5 py-4 text-white text-lg"
                  autoFocus
                />
              </View>
            )}

            {/* Signup step */}
            {currentQuestion.type === 'signup' && renderSignupStep()}

            {/* Email confirmation step */}
            {currentQuestion.type === 'email_confirmation' && renderEmailConfirmationStep()}
          </Animated.View>
        </ScrollView>

        {/* Continue button */}
        {(currentQuestion.type === 'multiple' ||
          currentQuestion.type === 'text' ||
          currentQuestion.type === 'signup' ||
          currentQuestion.type === 'email_confirmation') && (
          <View className="px-6 pb-4">
            <Pressable
              onPress={handleNext}
              disabled={!canProceed() || isLoading}
            >
              <LinearGradient
                colors={canProceed() && !isLoading ? ['#8B5CF6', '#3B82F6'] : ['#2D2555', '#222']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text
                      className={`text-lg font-semibold mr-2 ${
                        canProceed() ? 'text-white' : 'text-[#6B7280]'
                      }`}
                    >
                      {currentQuestion.type === 'signup'
                        ? authMode === 'signup'
                          ? "S'inscrire"
                          : 'Se connecter'
                        : currentQuestion.type === 'email_confirmation'
                        ? "J'ai confirmé mon email"
                        : 'Continuer'}
                    </Text>
                    {currentQuestion.type === 'email_confirmation' ? (
                      <CheckCircle size={20} color={canProceed() ? '#fff' : '#6B7280'} />
                    ) : (
                      <ChevronRight size={20} color={canProceed() ? '#fff' : '#6B7280'} />
                    )}
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
