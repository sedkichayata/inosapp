import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear storage only if quota exceeded or corrupted
const clearStorageIfNeeded = async () => {
  try {
    const stored = await AsyncStorage.getItem('inos-storage');
    if (stored && stored.length > 500000) {
      console.log('[store] Storage too large, clearing...');
      await AsyncStorage.removeItem('inos-storage');
    }
  } catch (e) {
    console.log('[store] Storage error, clearing...', e);
    await AsyncStorage.removeItem('inos-storage');
  }
};
clearStorageIfNeeded();

// Cart types
export interface CartItem {
  productId: string;
  quantity: number;
}

// Types for dark circles analysis
export type DarkCircleType =
  | 'vascular' // Blue/purple - blood vessels visible
  | 'pigmented' // Brown - hyperpigmentation
  | 'structural' // Shadows from facial structure
  | 'mixed'; // Combination

export type DarkCircleIntensity = 'mild' | 'moderate' | 'severe';

export interface SkinAnalysis {
  id: string;
  date: string;
  photoUri: string;
  darkCircleType: DarkCircleType;
  intensity: DarkCircleIntensity;
  score: number; // 0-100, lower is better
  leftEyeScore: number;
  rightEyeScore: number;
  recommendations: string[];
}

// Full Face Analysis Types (Premium)
export type MetricCondition = 'excellent' | 'good' | 'rather_bad' | 'bad';

export interface ZoneScore {
  score: number;
  condition: MetricCondition;
}

export interface FaceZoneScores {
  forehead?: ZoneScore;
  leftCheek?: ZoneScore;
  rightCheek?: ZoneScore;
  nose?: ZoneScore;
  chin?: ZoneScore;
  leftEyeArea?: ZoneScore;
  rightEyeArea?: ZoneScore;
}

export interface SkinMetric {
  name: string;
  value: number;
  unit?: string;
  condition: MetricCondition;
  zones: FaceZoneScores;
  description: string;
}

export type SkinTone = 'very_light' | 'light' | 'intermediate' | 'tan' | 'brown' | 'dark';

export interface FullFaceAnalysis {
  id: string;
  date: string;
  photoUri: string;

  // Age metrics
  perceivedAge: number;
  eyeAge: number;

  // Skin tone
  skinTone: SkinTone;
  itaScore: number;

  // Main metrics (0-100, higher is better except for specific ones)
  acneScore: SkinMetric;
  hydrationScore: SkinMetric;
  linesScore: SkinMetric;
  pigmentationScore: SkinMetric;
  poresScore: SkinMetric;
  rednessScore: SkinMetric;
  translucencyScore: SkinMetric;
  uniformnessScore: SkinMetric;
  eyeAreaCondition: SkinMetric;

  // Overall score
  overallScore: number;

  // Recommendations
  recommendations: string[];
  priorityAreas: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUri?: string;
  skinType?: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
  concerns: string[];
  onboardingCompleted: boolean;
  quizAnswers: Record<string, string>;
}

export interface Subscription {
  isActive: boolean;
  plan?: 'monthly' | 'yearly';
  expiresAt?: string;
  routineId?: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'shipped' | 'delivered';
  items: { name: string; quantity: number; price: number }[];
  total: number;
  trackingNumber?: string;
}

interface AppState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;

  // Onboarding
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;

  // Analyses (basic dark circles)
  analyses: SkinAnalysis[];
  addAnalysis: (analysis: SkinAnalysis) => void;
  updateAnalysisPhotoUrl: (analysisId: string, photoUrl: string) => void;
  getLatestAnalysis: () => SkinAnalysis | undefined;

  // Full Face Analyses (Premium)
  fullFaceAnalyses: FullFaceAnalysis[];
  addFullFaceAnalysis: (analysis: FullFaceAnalysis) => void;
  getLatestFullFaceAnalysis: () => FullFaceAnalysis | undefined;

  // Subscription
  subscription: Subscription;
  setSubscription: (subscription: Subscription) => void;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;

  // Cart
  cart: CartItem[];
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItemCount: () => number;

  // App state
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;
  hasSeenIntro: boolean;
  setHasSeenIntro: (seen: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  user: null,
  onboardingStep: 0,
  analyses: [],
  fullFaceAnalyses: [] as FullFaceAnalysis[],
  subscription: { isActive: false },
  orders: [],
  cart: [] as CartItem[],
  hasSeenOnboarding: false,
  hasSeenIntro: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),

      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),

      addAnalysis: (analysis) => set((state) => ({
        // Limit to 10 analyses
        // Keep photoUri if it's a cloud URL (https://), otherwise clear it to save space
        analyses: [
          {
            ...analysis,
            photoUri: analysis.photoUri?.startsWith('https://') ? analysis.photoUri : ''
          },
          ...state.analyses.slice(0, 9)
        ]
      })),
      updateAnalysisPhotoUrl: (analysisId: string, photoUrl: string) => set((state) => ({
        analyses: state.analyses.map((a) =>
          a.id === analysisId ? { ...a, photoUri: photoUrl } : a
        )
      })),
      getLatestAnalysis: () => get().analyses[0],

      // Full Face Analysis methods
      addFullFaceAnalysis: (analysis) => set((state) => ({
        // Limit to 5 full face analyses and don't store base64 photo URIs
        fullFaceAnalyses: [
          { ...analysis, photoUri: '' },
          ...state.fullFaceAnalyses.slice(0, 4)
        ]
      })),
      getLatestFullFaceAnalysis: () => get().fullFaceAnalyses[0],

      setSubscription: (subscription) => set({ subscription }),

      addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
      })),

      // Cart methods
      addToCart: (productId, quantity = 1) => set((state) => {
        const existingItem = state.cart.find((item) => item.productId === productId);
        if (existingItem) {
          return {
            cart: state.cart.map((item) =>
              item.productId === productId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          };
        }
        return { cart: [...state.cart, { productId, quantity }] };
      }),

      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.productId !== productId),
      })),

      updateCartQuantity: (productId, quantity) => set((state) => {
        if (quantity <= 0) {
          return { cart: state.cart.filter((item) => item.productId !== productId) };
        }
        return {
          cart: state.cart.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        };
      }),

      clearCart: () => set({ cart: [] }),

      getCartItemCount: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0);
      },

      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),

      setHasSeenIntro: (hasSeenIntro) => set({ hasSeenIntro }),

      reset: () => set(initialState),
    }),
    {
      name: 'inos-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
