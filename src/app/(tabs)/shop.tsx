import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { ShoppingBag, Star, Sparkles, Package, Plus, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { products, formatPrice, getFeaturedProducts, type Product } from '@/lib/stripe';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

type Category = 'all' | 'serum' | 'cream' | 'mask' | 'tool' | 'bundle';

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'serum', label: 'Sérums' },
  { id: 'cream', label: 'Crèmes' },
  { id: 'mask', label: 'Masques' },
  { id: 'tool', label: 'Outils' },
  { id: 'bundle', label: 'Kits' },
];

function ProductCard({ product, onAddToCart, isInCart }: {
  product: Product;
  onAddToCart: () => void;
  isInCart: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ width: CARD_WIDTH }}>
      <Pressable
        onPress={onAddToCart}
        className="bg-[#1A1625] rounded-2xl border border-[#2D2555] overflow-hidden"
      >
        <View className="relative">
          <Image
            source={{ uri: product.image }}
            style={{ width: CARD_WIDTH, height: CARD_WIDTH }}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <View
              className="absolute inset-0 bg-[#12101A] items-center justify-center"
              style={{ width: CARD_WIDTH, height: CARD_WIDTH }}
            >
              <Package size={32} color="#374151" />
            </View>
          )}
          {product.featured && (
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, flexDirection: 'row', alignItems: 'center' }}
            >
              <Star size={10} color="#fff" fill="#fff" />
              <Text className="text-white text-[10px] font-bold ml-1">BEST</Text>
            </LinearGradient>
          )}
          <Pressable
            onPress={onAddToCart}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: isInCart ? '#8B5CF6' : 'rgba(0,0,0,0.6)' }}
          >
            {isInCart ? (
              <Check size={16} color="#fff" strokeWidth={3} />
            ) : (
              <Plus size={16} color="#fff" />
            )}
          </Pressable>
        </View>
        <View className="p-3">
          <Text className="text-white font-medium text-sm" numberOfLines={2}>
            {product.name}
          </Text>
          <Text className="text-[#9CA3AF] text-xs mt-1" numberOfLines={2}>
            {product.description}
          </Text>
          <Text className="text-[#8B5CF6] font-bold mt-2">
            {formatPrice(product.price)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function FeaturedCard({ product, onAddToCart }: { product: Product; onAddToCart: () => void }) {
  return (
    <Pressable onPress={onAddToCart} style={{ width: width - 80 }}>
      <LinearGradient
        colors={['#1A1625', '#12101A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#8B5CF633' }}
      >
        <View className="flex-row">
          <Image
            source={{ uri: product.image }}
            style={{ width: 120, height: 140 }}
          />
          <View className="flex-1 p-4 justify-between">
            <View>
              <View className="flex-row items-center mb-1">
                <Sparkles size={12} color="#8B5CF6" />
                <Text className="text-[#8B5CF6] text-xs font-medium ml-1">Recommandé</Text>
              </View>
              <Text className="text-white font-semibold" numberOfLines={2}>
                {product.name}
              </Text>
              <Text className="text-[#9CA3AF] text-xs mt-1" numberOfLines={2}>
                {product.description}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[#8B5CF6] font-bold text-lg">
                {formatPrice(product.price)}
              </Text>
              <LinearGradient
                colors={['#8B5CF6', '#3B82F6']}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}
              >
                <Text className="text-white text-xs font-bold">Ajouter</Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function ShopScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const getCartItemCount = useAppStore((s) => s.getCartItemCount);

  const cartCount = getCartItemCount();
  const featuredProducts = getFeaturedProducts();

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const isProductInCart = useCallback((productId: string) => {
    return cart.some((item) => item.productId === productId);
  }, [cart]);

  const handleAddToCart = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart(product.id);
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} className="px-5 pt-2 pb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-2xl font-bold">Boutique</Text>
              <Text className="text-[#9CA3AF] text-sm">Produits sélectionnés pour vous</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/cart');
              }}
              className="relative"
            >
              <View className="w-12 h-12 rounded-full bg-[#1A1625] items-center justify-center border border-[#2D2555]">
                <ShoppingBag size={22} color="#8B5CF6" />
              </View>
              {cartCount > 0 && (
                <LinearGradient
                  colors={['#8B5CF6', '#3B82F6']}
                  style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white text-xs font-bold">{cartCount}</Text>
                </LinearGradient>
              )}
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mb-6">
              <Text className="text-white font-semibold text-lg px-5 mb-3">
                Nos coups de cœur
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                style={{ flexGrow: 0 }}
              >
                {featuredProducts.map((product, index) => (
                  <Animated.View key={product.id} entering={FadeInRight.delay(index * 100)}>
                    <FeaturedCard
                      product={product}
                      onAddToCart={() => handleAddToCart(product)}
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Category Filter */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              style={{ flexGrow: 0 }}
            >
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(category.id);
                  }}
                >
                  {selectedCategory === category.id ? (
                    <LinearGradient
                      colors={['#8B5CF6', '#3B82F6']}
                      style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 }}
                    >
                      <Text className="text-white font-medium">{category.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View className="px-4 py-2 rounded-full bg-[#1A1625] border border-[#2D2555]">
                      <Text className="text-[#9CA3AF] font-medium">{category.label}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Products Grid */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} className="px-5 pb-8">
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                  isInCart={isProductInCart(product.id)}
                />
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
