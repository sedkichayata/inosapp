import { useState } from 'react';
import { View, Text, Pressable, Image, Share, TextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { X, Share2, Copy, MessageCircle, Send, Link2, Check, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useAppStore, DarkCircleType } from '@/lib/store';

const typeNames: Record<DarkCircleType, string> = {
  vascular: 'Vasculaires',
  pigmented: 'Pigmentaires',
  structural: 'Structurels',
  mixed: 'Mixtes',
};

export default function ShareDiagnosisScreen() {
  const router = useRouter();
  const { analysisId } = useLocalSearchParams<{ analysisId: string }>();
  const [copied, setCopied] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  const analyses = useAppStore((s) => s.analyses);
  const user = useAppStore((s) => s.user);

  // Get the latest or specified analysis
  const analysis = analysisId
    ? analyses.find((a) => a.id === analysisId)
    : analyses[0];

  const shareMessage = analysis
    ? `J'ai analysé mes cernes avec INOS et voici mon résultat : Score ${analysis.score}/100 - Type: ${typeNames[analysis.darkCircleType]}. Découvre le tien aussi ! 👀`
    : "Découvre INOS, l'app qui analyse tes cernes et te propose une routine personnalisée !";

  const shareLink = 'https://inos.app/invite'; // Placeholder link

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `${shareMessage}\n\n${shareLink}`,
        title: 'INOS - Diagnostic cernes',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleCopyLink = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteFriend = () => {
    if (!friendEmail.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In production, this would send an actual invitation
    setFriendEmail('');
    // Show success feedback
  };

  return (
    <View className="flex-1 bg-[#0A0A0B]">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <View className="w-10" />
          <Text className="text-white text-lg font-semibold">Partager</Text>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1A1A1E] items-center justify-center"
          >
            <X size={20} color="#888" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Preview card */}
          {analysis && (
            <Animated.View entering={FadeIn.duration(500)} className="px-5 mb-6">
              <View className="bg-[#141416] rounded-3xl overflow-hidden border border-[#2A2A2E]">
                {/* Photo preview */}
                {analysis.photoUri && (
                  <Image
                    source={{ uri: analysis.photoUri }}
                    className="w-full aspect-[4/3]"
                    resizeMode="cover"
                  />
                )}
                <LinearGradient
                  colors={['transparent', '#141416']}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100 }}
                />

                {/* Result overlay */}
                <View className="p-5">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-full bg-[#C9A86C]/20 items-center justify-center mr-3">
                      <Text className="text-[#C9A86C] font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-white font-medium">
                        {user?.name || 'Utilisateur'}
                      </Text>
                      <Text className="text-[#666] text-sm">Diagnostic INOS</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-[#888] text-xs">Score cernes</Text>
                      <View className="flex-row items-baseline">
                        <Text className="text-white text-3xl font-bold">{analysis.score}</Text>
                        <Text className="text-[#666] text-lg">/100</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-[#888] text-xs">Type</Text>
                      <Text className="text-[#C9A86C] font-medium">
                        {typeNames[analysis.darkCircleType]}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Invite friend section */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} className="px-5 mb-6">
            <View className="flex-row items-center mb-4">
              <Users size={20} color="#C9A86C" />
              <Text className="text-white text-lg font-semibold ml-2">Inviter un ami</Text>
            </View>
            <Text className="text-[#888] text-sm mb-4">
              Partagez INOS avec vos amis pour qu'ils découvrent aussi leur type de cernes !
            </Text>

            {/* Quick share buttons */}
            <View className="flex-row gap-3 mb-6">
              <Pressable
                onPress={handleShare}
                className="flex-1 bg-[#141416] rounded-2xl p-4 items-center border border-[#2A2A2E]"
              >
                <View className="w-12 h-12 rounded-full bg-[#25D366]/20 items-center justify-center mb-2">
                  <MessageCircle size={24} color="#25D366" />
                </View>
                <Text className="text-white text-sm font-medium">Message</Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                className="flex-1 bg-[#141416] rounded-2xl p-4 items-center border border-[#2A2A2E]"
              >
                <View className="w-12 h-12 rounded-full bg-[#007AFF]/20 items-center justify-center mb-2">
                  <Send size={24} color="#007AFF" />
                </View>
                <Text className="text-white text-sm font-medium">Email</Text>
              </Pressable>

              <Pressable
                onPress={handleCopyLink}
                className="flex-1 bg-[#141416] rounded-2xl p-4 items-center border border-[#2A2A2E]"
              >
                <View className="w-12 h-12 rounded-full bg-[#C9A86C]/20 items-center justify-center mb-2">
                  {copied ? (
                    <Check size={24} color="#4CAF50" />
                  ) : (
                    <Link2 size={24} color="#C9A86C" />
                  )}
                </View>
                <Text className="text-white text-sm font-medium">
                  {copied ? 'Copié !' : 'Lien'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* What friends will see */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-5 mb-6">
            <Text className="text-[#666] text-xs uppercase tracking-wider mb-3">
              Ce que vos amis verront
            </Text>
            <View className="bg-[#141416] rounded-2xl p-4 border border-[#2A2A2E]">
              <Text className="text-[#CCC] text-sm leading-relaxed">{shareMessage}</Text>
              <View className="flex-row items-center mt-3 pt-3 border-t border-[#2A2A2E]">
                <Link2 size={14} color="#666" />
                <Text className="text-[#666] text-xs ml-2">{shareLink}</Text>
              </View>
            </View>
          </Animated.View>

          {/* How it works for friends */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} className="px-5 mb-8">
            <Text className="text-[#666] text-xs uppercase tracking-wider mb-3">
              Comment ça marche
            </Text>
            <View className="bg-[#141416] rounded-2xl p-4 border border-[#2A2A2E]">
              <View className="flex-row items-start mb-4">
                <View className="w-6 h-6 rounded-full bg-[#C9A86C] items-center justify-center mr-3">
                  <Text className="text-black text-xs font-bold">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">Votre ami ouvre le lien</Text>
                  <Text className="text-[#666] text-sm">Et télécharge l'app INOS</Text>
                </View>
              </View>
              <View className="flex-row items-start mb-4">
                <View className="w-6 h-6 rounded-full bg-[#C9A86C] items-center justify-center mr-3">
                  <Text className="text-black text-xs font-bold">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">Il fait son diagnostic</Text>
                  <Text className="text-[#666] text-sm">Quiz + scan facial gratuit</Text>
                </View>
              </View>
              <View className="flex-row items-start">
                <View className="w-6 h-6 rounded-full bg-[#C9A86C] items-center justify-center mr-3">
                  <Text className="text-black text-xs font-bold">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">Vous comparez vos résultats</Text>
                  <Text className="text-[#666] text-sm">Et échangez vos conseils !</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA */}
        <View className="px-5 pb-4">
          <Pressable onPress={handleShare}>
            <LinearGradient
              colors={['#C9A86C', '#B8956E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
            >
              <Share2 size={20} color="#000" />
              <Text className="text-black font-bold text-lg ml-2">Partager maintenant</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
