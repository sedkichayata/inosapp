import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, CreditCard } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useAuthContext } from '@/lib/AuthProvider';
import { products, formatPrice, getProductById, type Product } from '@/lib/stripe';

interface CartItemWithProduct {
  productId: string;
  quantity: number;
  product: Product;
}

export default function CartScreen() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const cart = useAppStore((s) => s.cart);
  const updateCartQuantity = useAppStore((s) => s.updateCartQuantity);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const addOrder = useAppStore((s) => s.addOrder);
  const { createOrder, recordPayment, isConfigured } = useAuthContext();

  // Get cart items with product details
  const cartItems: CartItemWithProduct[] = cart
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter((item): item is CartItemWithProduct => item !== null);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 5000 ? 0 : 490; // Free shipping over 50€
  const total = subtotal + shipping;

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cartItems.find((i) => i.productId === productId);
    if (item) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateCartQuantity(productId, item.quantity + delta);
    }
  };

  const handleRemove = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeFromCart(productId);
  };

  const handleCheckout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(async () => {
      // Create local order
      const order = {
        id: `order-${Date.now()}`,
        date: new Date().toISOString(),
        status: 'pending' as const,
        items: cartItems.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
        total,
      };

      addOrder(order);

      // Save order to Supabase if configured
      if (isConfigured) {
        try {
          const supabaseOrder = await createOrder({
            items: cartItems.map((item) => ({
              product_id: item.productId,
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
            })),
            subtotal,
            shipping,
            total,
          });

          // Record payment
          if (supabaseOrder) {
            await recordPayment({
              order_id: supabaseOrder.id,
              type: 'order',
              amount: total,
              currency: 'EUR',
              status: 'succeeded',
            });
          }
        } catch (err) {
          console.log('Failed to save order to Supabase:', err);
        }
      }

      clearCart();
      setIsProcessing(false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Commande confirmée',
        'Merci pour votre commande ! Vous recevrez un email de confirmation.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 2000);
  };

  if (cartItems.length === 0) {
    return (
      <View className="flex-1 bg-[#0A0A0B]">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center px-5 pt-2 pb-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#1A1A1E] items-center justify-center mr-4"
            >
              <ArrowLeft size={20} color="#888" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Mon panier</Text>
          </View>

          <View className="flex-1 items-center justify-center px-8">
            <View className="w-20 h-20 rounded-full bg-[#1A1A1E] items-center justify-center mb-6">
              <ShoppingBag size={40} color="#444" />
            </View>
            <Text className="text-white text-xl font-semibold mb-2">Panier vide</Text>
            <Text className="text-[#666] text-center mb-6">
              Découvrez nos produits sélectionnés pour améliorer votre routine
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="bg-[#C9A86C] px-6 py-3 rounded-xl"
            >
              <Text className="text-black font-semibold">Voir la boutique</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0B]">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} className="flex-row items-center px-5 pt-2 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#1A1A1E] items-center justify-center mr-4"
          >
            <ArrowLeft size={20} color="#888" />
          </Pressable>
          <Text className="text-white text-lg font-semibold flex-1">
            Mon panier ({cartItems.length})
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert('Vider le panier', 'Êtes-vous sûr de vouloir vider votre panier ?', [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Vider',
                  style: 'destructive',
                  onPress: clearCart,
                },
              ]);
            }}
          >
            <Text className="text-[#888] text-sm">Vider</Text>
          </Pressable>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Cart Items */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} className="px-5">
            {cartItems.map((item, index) => (
              <Animated.View
                key={item.productId}
                entering={FadeInDown.delay(index * 50)}
                exiting={FadeOut.duration(200)}
                layout={Layout.springify()}
                className="bg-[#141416] rounded-2xl border border-[#2A2A2E] mb-3 overflow-hidden"
              >
                <View className="flex-row p-3">
                  <Image
                    source={{ uri: item.product.image }}
                    className="w-20 h-20 rounded-xl"
                  />
                  <View className="flex-1 ml-3 justify-between">
                    <View>
                      <Text className="text-white font-medium" numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      <Text className="text-[#C9A86C] font-semibold mt-1">
                        {formatPrice(item.product.price)}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center bg-[#1A1A1E] rounded-lg">
                        <Pressable
                          onPress={() => handleUpdateQuantity(item.productId, -1)}
                          className="w-8 h-8 items-center justify-center"
                        >
                          <Minus size={14} color="#888" />
                        </Pressable>
                        <Text className="text-white font-medium w-8 text-center">
                          {item.quantity}
                        </Text>
                        <Pressable
                          onPress={() => handleUpdateQuantity(item.productId, 1)}
                          className="w-8 h-8 items-center justify-center"
                        >
                          <Plus size={14} color="#888" />
                        </Pressable>
                      </View>
                      <Pressable
                        onPress={() => handleRemove(item.productId)}
                        className="w-8 h-8 items-center justify-center"
                      >
                        <Trash2 size={18} color="#FF6B6B" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Order Summary */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            className="mx-5 mt-4 mb-8 bg-[#141416] rounded-2xl border border-[#2A2A2E] p-4"
          >
            <Text className="text-white font-semibold mb-4">Résumé de commande</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-[#888]">Sous-total</Text>
              <Text className="text-white">{formatPrice(subtotal)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-[#888]">Livraison</Text>
              <Text className={shipping === 0 ? 'text-green-500' : 'text-white'}>
                {shipping === 0 ? 'Gratuite' : formatPrice(shipping)}
              </Text>
            </View>
            {shipping > 0 && (
              <Text className="text-[#666] text-xs mb-2">
                Plus que {formatPrice(5000 - subtotal)} pour la livraison gratuite
              </Text>
            )}
            <View className="border-t border-[#2A2A2E] pt-3 mt-2 flex-row justify-between">
              <Text className="text-white font-semibold">Total</Text>
              <Text className="text-[#C9A86C] font-bold text-lg">{formatPrice(total)}</Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Checkout Button */}
        <View className="px-5 pb-4">
          <Pressable onPress={handleCheckout} disabled={isProcessing}>
            <LinearGradient
              colors={isProcessing ? ['#444', '#333'] : ['#C9A86C', '#B8956E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center justify-center">
                <CreditCard size={20} color={isProcessing ? '#666' : '#000'} />
                <Text
                  className={`font-bold text-lg ml-2 ${
                    isProcessing ? 'text-[#666]' : 'text-black'
                  }`}
                >
                  {isProcessing ? 'Traitement...' : `Payer ${formatPrice(total)}`}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
          <View className="flex-row items-center justify-center mt-3">
            <CreditCard size={14} color="#666" />
            <Text className="text-[#666] text-xs ml-2">Paiement sécurisé</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
