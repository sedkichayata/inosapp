import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { X, Check, Sparkles, Clock, Package, RefreshCw, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useAuthContext } from '@/lib/AuthProvider';

interface PlanOption {
  id: 'monthly' | 'yearly';
  name: string;
  price: string;
  period: string;
  savings?: string;
  pricePerMonth: string;
}

const plans: PlanOption[] = [
  {
    id: 'yearly',
    name: 'Annuel',
    price: '89,99',
    period: '/an',
    savings: 'Économisez 30%',
    pricePerMonth: '7,50€/mois',
  },
  {
    id: 'monthly',
    name: 'Mensuel',
    price: '12,99',
    period: '/mois',
    pricePerMonth: '12,99€/mois',
  },
];

const features = [
  {
    icon: <Sparkles size={20} color="#A78BFA" />,
    title: 'Routine personnalisée',
    description: 'Programme sur-mesure basé sur votre analyse',
  },
  {
    icon: <Package size={20} color="#A78BFA" />,
    title: 'Produits exclusifs',
    description: 'Accès à notre gamme de soins premium',
  },
  {
    icon: <Clock size={20} color="#A78BFA" />,
    title: 'Suivi illimité',
    description: 'Analyses et comparaisons sans limite',
  },
  {
    icon: <RefreshCw size={20} color="#A78BFA" />,
    title: 'Mises à jour routine',
    description: 'Ajustements selon vos progrès',
  },
  {
    icon: <Shield size={20} color="#A78BFA" />,
    title: 'Garantie résultats',
    description: 'Remboursé si pas d\'amélioration en 90 jours',
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const subscription = useAppStore((s) => s.subscription);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const { updateSubscription, recordPayment, isConfigured } = useAuthContext();

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    // Note: Pour activer les paiements réels, vous devez configurer RevenueCat
    // via l'onglet PAYMENTS de Vibecode

    // Simulation d'abonnement pour la démo
    setTimeout(async () => {
      const expiresAt = new Date(
        Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString();

      setSubscription({
        isActive: true,
        plan: selectedPlan,
        expiresAt,
      });

      // Save subscription to Supabase if configured
      if (isConfigured) {
        try {
          await updateSubscription(selectedPlan, expiresAt);

          // Record subscription payment
          const amount = selectedPlan === 'yearly' ? 8999 : 1299; // in cents
          await recordPayment({
            type: 'subscription',
            amount,
            currency: 'EUR',
            status: 'succeeded',
          });
        } catch (err) {
          console.log('Failed to save subscription to Supabase:', err);
        }
      }

      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Bienvenue dans INOS Premium',
        'Votre abonnement est maintenant actif. Découvrez votre routine personnalisée !',
        [{ text: 'Continuer', onPress: () => router.back() }]
      );
    }, 1500);
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Restauration', 'Aucun achat précédent trouvé.');
  };

  if (subscription.isActive) {
    return (
      <View className="flex-1 bg-[#08080A]">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
            <View className="w-10" />
            <Text className="text-white text-lg font-semibold">Mon abonnement</Text>
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#1E1B2E] items-center justify-center"
            >
              <X size={20} color="#888" />
            </Pressable>
          </View>

          <View className="flex-1 items-center justify-center px-8">
            <LinearGradient
              colors={['#A78BFA20', '#60A5FA20']}
              style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}
            >
              <Sparkles size={40} color="#A78BFA" />
            </LinearGradient>
            <Text className="text-white text-2xl font-semibold text-center mb-2">
              Vous êtes Premium
            </Text>
            <Text className="text-[#888] text-center mb-4">
              Plan {subscription.plan === 'yearly' ? 'annuel' : 'mensuel'}
            </Text>
            {subscription.expiresAt && (
              <Text className="text-[#666] text-sm">
                Renouvellement le{' '}
                {new Date(subscription.expiresAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            )}

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(
                  'Gérer l\'abonnement',
                  'Pour modifier ou annuler votre abonnement, rendez-vous dans les paramètres de votre App Store.'
                );
              }}
              className="mt-8 py-3 px-6 bg-[#1E1B2E] rounded-xl border border-[#2D2640]"
            >
              <Text className="text-[#A78BFA] font-medium">Gérer l'abonnement</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#08080A]">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <View className="w-10" />
          <Text className="text-white text-lg font-semibold">INOS Premium</Text>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1E1B2E] items-center justify-center"
          >
            <X size={20} color="#888" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Animated.View entering={FadeIn.duration(500)} className="items-center px-8 py-6">
            <LinearGradient
              colors={['#A78BFA20', '#60A5FA20']}
              style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
            >
              <Sparkles size={40} color="#A78BFA" />
            </LinearGradient>
            <Text className="text-white text-2xl font-bold text-center mb-2">
              Révélez votre regard
            </Text>
            <Text className="text-[#888] text-center">
              Accédez à votre routine personnalisée et nos produits exclusifs
            </Text>
          </Animated.View>

          {/* Plan selection */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} className="px-5 mb-6">
            <View className="flex-row gap-3">
              {plans.map((plan) => (
                <Pressable
                  key={plan.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPlan(plan.id);
                  }}
                  className="flex-1"
                >
                  <LinearGradient
                    colors={selectedPlan === plan.id ? ['#1E1B2E', '#151320'] : ['#151320', '#0D0B14']}
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: selectedPlan === plan.id ? '#A78BFA' : '#2D2640',
                    }}
                  >
                    {plan.savings && (
                      <LinearGradient
                        colors={['#A78BFA', '#60A5FA']}
                        style={{ position: 'absolute', top: -12, left: '50%', transform: [{ translateX: -50 }], paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999 }}
                      >
                        <Text className="text-white text-xs font-bold">{plan.savings}</Text>
                      </LinearGradient>
                    )}
                    <Text
                      className={`text-center font-medium mb-2 ${
                        selectedPlan === plan.id ? 'text-[#A78BFA]' : 'text-[#666]'
                      }`}
                    >
                      {plan.name}
                    </Text>
                    <View className="flex-row items-baseline justify-center">
                      <Text
                        className={`text-3xl font-bold ${
                          selectedPlan === plan.id ? 'text-white' : 'text-[#888]'
                        }`}
                      >
                        {plan.price}€
                      </Text>
                      <Text className="text-[#555] text-sm ml-1">{plan.period}</Text>
                    </View>
                    <Text className="text-[#555] text-xs text-center mt-2">{plan.pricePerMonth}</Text>
                    {selectedPlan === plan.id && (
                      <LinearGradient
                        colors={['#A78BFA', '#60A5FA']}
                        style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </LinearGradient>
                    )}
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Features */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">Inclus dans votre abonnement</Text>
            <LinearGradient
              colors={['#1E1B2E', '#151320']}
              style={{ borderRadius: 16, borderWidth: 1, borderColor: '#2D2640' }}
            >
              {features.map((feature, index) => (
                <View
                  key={feature.title}
                  className={`flex-row items-center p-4 ${
                    index < features.length - 1 ? 'border-b border-[#2D2640]' : ''
                  }`}
                >
                  <View className="w-10 h-10 rounded-xl bg-[#A78BFA]/10 items-center justify-center mr-3">
                    {feature.icon}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">{feature.title}</Text>
                    <Text className="text-[#666] text-sm">{feature.description}</Text>
                  </View>
                </View>
              ))}
            </LinearGradient>
          </Animated.View>

          {/* Terms */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} className="px-5 mb-8">
            <Text className="text-[#555] text-xs text-center leading-relaxed">
              L'abonnement se renouvelle automatiquement. Vous pouvez annuler à tout moment via les paramètres de l'App Store. En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA */}
        <View className="px-5 pb-4">
          <Pressable onPress={handleSubscribe} disabled={isProcessing}>
            <LinearGradient
              colors={isProcessing ? ['#444', '#333'] : ['#A78BFA', '#818CF8', '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <Text className="text-white font-bold text-lg text-center">
                {isProcessing ? 'Traitement...' : 'Commencer maintenant'}
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={handleRestore} className="py-3">
            <Text className="text-[#888] text-center text-sm">Restaurer mes achats</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
