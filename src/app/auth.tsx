import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthContext } from '@/lib/AuthProvider';

// Logo
const Logo = require('../../assets/iconinos.png');

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, isConfigured } = useAuthContext();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        console.log('[auth] Login successful');
      } else {
        await signUp(email.trim(), password, name.trim());
        console.log('[auth] Signup successful');
      }

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (err: unknown) {
      console.error('[auth] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';

      // Translate common Supabase errors
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect');
      } else if (errorMessage.includes('User already registered')) {
        setError('Cet email est déjà utilisé');
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email');
      } else if (errorMessage.includes('Password should be')) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
      } else {
        setError(errorMessage);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!isConfigured) {
    return (
      <View className="flex-1 bg-[#0A0A0B] items-center justify-center px-6">
        <Text className="text-white text-xl font-semibold text-center mb-4">
          Authentification non disponible
        </Text>
        <Text className="text-[#888] text-center mb-8">
          L'authentification Supabase n'est pas configurée.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-[#C9A86C] py-3 px-8 rounded-xl"
        >
          <Text className="text-black font-semibold">Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0B]">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-5 pt-2 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1A1A1E] items-center justify-center"
          >
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View className="items-center mb-6">
              <Image
                source={Logo}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Animated.View entering={FadeIn.duration(500)} className="mb-8">
              <Text className="text-white text-3xl font-bold text-center mb-2">
                {mode === 'login' ? 'Bon retour' : 'Créer un compte'}
              </Text>
              <Text className="text-[#888] text-center">
                {mode === 'login'
                  ? 'Connectez-vous pour synchroniser vos données'
                  : 'Inscrivez-vous pour sauvegarder vos analyses'}
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              {/* Name field (signup only) */}
              {mode === 'signup' && (
                <View className="mb-4">
                  <View className="flex-row items-center bg-[#1A1A1E] rounded-2xl px-4 py-4 border border-[#2A2A2E]">
                    <User size={20} color="#666" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-base"
                      placeholder="Votre nom"
                      placeholderTextColor="#666"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              )}

              {/* Email field */}
              <View className="mb-4">
                <View className="flex-row items-center bg-[#1A1A1E] rounded-2xl px-4 py-4 border border-[#2A2A2E]">
                  <Mail size={20} color="#666" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Email"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* Password field */}
              <View className="mb-6">
                <View className="flex-row items-center bg-[#1A1A1E] rounded-2xl px-4 py-4 border border-[#2A2A2E]">
                  <Lock size={20} color="#666" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Mot de passe"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color="#666" />
                    ) : (
                      <Eye size={20} color="#666" />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Error message */}
              {error && (
                <Animated.View entering={FadeIn} className="mb-4">
                  <Text className="text-red-500 text-center">{error}</Text>
                </Animated.View>
              )}

              {/* Submit button */}
              <Pressable onPress={handleSubmit} disabled={loading}>
                <LinearGradient
                  colors={loading ? ['#666', '#555'] : ['#C9A86C', '#B8956E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, padding: 16, alignItems: 'center' }}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text className="text-black font-bold text-lg">
                      {mode === 'login' ? 'Se connecter' : "S'inscrire"}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Toggle mode */}
              <Pressable onPress={toggleMode} className="mt-6 py-2">
                <Text className="text-[#888] text-center">
                  {mode === 'login' ? (
                    <>
                      Pas encore de compte ?{' '}
                      <Text className="text-[#C9A86C] font-semibold">S'inscrire</Text>
                    </>
                  ) : (
                    <>
                      Déjà un compte ?{' '}
                      <Text className="text-[#C9A86C] font-semibold">Se connecter</Text>
                    </>
                  )}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Skip button */}
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              className="mt-8 py-3"
            >
              <Text className="text-[#666] text-center">Continuer sans compte</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
