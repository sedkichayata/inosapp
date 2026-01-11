import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {
  supabase,
  authService,
  userService,
  analysisService,
  storageService,
  orderService,
  paymentService,
  isSupabaseConfigured,
  DbUser,
  DbSkinAnalysis,
  DbFullFaceAnalysis,
  DbOrder,
} from './supabase';
import { useAppStore, SkinAnalysis, FullFaceAnalysis, UserProfile } from './store';

// Convert DB types to App types
const dbUserToAppUser = (dbUser: DbUser): UserProfile => ({
  id: dbUser.id,
  name: dbUser.name || '',
  email: dbUser.email,
  avatarUri: dbUser.avatar_url || undefined,
  skinType: dbUser.skin_type as UserProfile['skinType'],
  concerns: dbUser.goals || [],
  onboardingCompleted: dbUser.onboarding_completed,
  quizAnswers: {},
});

const dbAnalysisToAppAnalysis = (dbAnalysis: DbSkinAnalysis): SkinAnalysis => ({
  id: dbAnalysis.id,
  date: dbAnalysis.created_at,
  photoUri: dbAnalysis.photo_url || '',
  darkCircleType: dbAnalysis.dark_circle_type,
  intensity: dbAnalysis.intensity,
  score: dbAnalysis.score,
  leftEyeScore: dbAnalysis.left_eye_score,
  rightEyeScore: dbAnalysis.right_eye_score,
  recommendations: dbAnalysis.recommendations || [],
});

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const setAppUser = useAppStore((s) => s.setUser);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);

  // Clear invalid session data
  const clearSession = useCallback(async () => {
    console.log('[useAuth] Clearing invalid session...');
    setSession(null);
    setUser(null);
    setAppUser(null);
    setSubscription({ isActive: false });
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore signOut errors during cleanup
      console.log('[useAuth] SignOut during cleanup:', e);
    }
  }, [setAppUser, setSubscription]);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using local storage only');
      setLoading(false);
      setInitialized(true);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      // Handle invalid refresh token error
      if (error) {
        console.error('[useAuth] Session error:', error.message);
        if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token')) {
          await clearSession();
        }
        setLoading(false);
        setInitialized(true);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);

      // Load user profile if logged in
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    }).catch(async (error) => {
      console.error('[useAuth] Unexpected session error:', error);
      await clearSession();
      setLoading(false);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('[useAuth] Token refresh failed, clearing session');
          await clearSession();
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setAppUser(null);
          setSubscription({ isActive: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [clearSession]);

  // Load user profile from Supabase
  const loadUserProfile = async (userId: string) => {
    try {
      const dbUser = await userService.getProfile(userId);
      if (dbUser) {
        const appUser = dbUserToAppUser(dbUser);
        setAppUser(appUser);
        setHasSeenOnboarding(dbUser.onboarding_completed);

        // Set subscription status
        if (dbUser.subscription_plan && dbUser.subscription_expires_at) {
          const isActive = new Date(dbUser.subscription_expires_at) > new Date();
          setSubscription({
            isActive,
            plan: dbUser.subscription_plan === 'free' ? undefined : dbUser.subscription_plan,
            expiresAt: dbUser.subscription_expires_at,
          });
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Sign up
  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    const { user } = await authService.signUp(email, password, name);
    return user;
  }, []);

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    const { user, session } = await authService.signIn(email, password);
    return { user, session };
  }, []);

  // Sign in with OTP
  const signInWithOTP = useCallback(async (email: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    await authService.signInWithOTP(email);
  }, []);

  // Verify OTP
  const verifyOTP = useCallback(async (email: string, token: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase non configuré');
    }

    const { user, session } = await authService.verifyOTP(email, token);
    return { user, session };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    console.log('[useAuth] Signing out...');

    // Always clear local state first
    setSession(null);
    setUser(null);
    setAppUser(null);
    setSubscription({ isActive: false });

    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      await supabase.auth.signOut();
      console.log('[useAuth] Signed out successfully');
    } catch (error) {
      // Even if signOut fails (e.g., invalid token), we've already cleared local state
      console.log('[useAuth] SignOut error (session cleared anyway):', error);
    }
  }, [setAppUser, setSubscription]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<DbUser>) => {
    if (!user?.id || !isSupabaseConfigured()) return;

    const updatedUser = await userService.updateProfile(user.id, updates);
    setAppUser(dbUserToAppUser(updatedUser));
  }, [user]);

  // Complete onboarding
  const completeOnboarding = useCallback(async (profileData: {
    name: string;
    skin_type?: string;
    dark_circle_type?: string;
    goals?: string[];
  }) => {
    if (!user?.id || !isSupabaseConfigured()) {
      console.log('[completeOnboarding] Skipped - no user or Supabase not configured');
      return;
    }

    try {
      console.log('[completeOnboarding] Starting for user:', user.id);

      // First, ensure user profile exists in the users table
      let profile = await userService.getProfile(user.id);
      if (!profile) {
        console.log('[completeOnboarding] Creating user profile...');
        profile = await userService.createProfile(user.id, user.email || '', profileData.name);
      }

      // Then complete onboarding with full data
      console.log('[completeOnboarding] Updating profile with onboarding data...');
      const updatedUser = await userService.completeOnboarding(user.id, profileData);
      setAppUser(dbUserToAppUser(updatedUser));
      setHasSeenOnboarding(true);
      console.log('[completeOnboarding] Success!');
    } catch (error) {
      console.error('[completeOnboarding] Error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }, [user]);

  // Upload photo
  const uploadPhoto = useCallback(async (uri: string, folder: 'analyses' | 'avatars' = 'analyses') => {
    if (!user?.id || !isSupabaseConfigured()) return uri;

    try {
      const url = await storageService.uploadPhoto(user.id, uri, folder);
      return url;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return uri; // Return original URI if upload fails
    }
  }, [user]);

  // Upload photo from base64
  const uploadPhotoBase64 = useCallback(async (base64Data: string, folder: 'analyses' | 'avatars' = 'analyses') => {
    if (!user?.id || !isSupabaseConfigured()) return null;

    try {
      const url = await storageService.uploadPhotoBase64(user.id, base64Data, folder);
      return url;
    } catch (error) {
      console.error('Error uploading base64 photo:', error);
      return null;
    }
  }, [user]);

  // Save analysis to Supabase
  const saveAnalysis = useCallback(async (analysis: SkinAnalysis, photoUri?: string) => {
    console.log('[saveAnalysis] Starting...', { userId: user?.id, isConfigured: isSupabaseConfigured(), hasPhotoUri: !!photoUri });

    if (!user?.id || !isSupabaseConfigured()) {
      console.log('[saveAnalysis] Skipped - user not logged in or Supabase not configured');
      return;
    }

    try {
      // First, ensure user profile exists
      let profile = await userService.getProfile(user.id);
      if (!profile) {
        console.log('[saveAnalysis] Creating user profile first...');
        profile = await userService.createProfile(user.id, user.email || '');
      }

      // Upload photo first (skip if already a cloud URL)
      let photoUrl = photoUri || null;
      if (photoUri && !photoUri.startsWith('https://')) {
        console.log('[saveAnalysis] Uploading photo...');
        photoUrl = await uploadPhoto(photoUri, 'analyses');
        console.log('[saveAnalysis] Photo uploaded:', photoUrl);
      }

      console.log('[saveAnalysis] Creating analysis in database...');
      await analysisService.createAnalysis(user.id, {
        photo_url: photoUrl,
        dark_circle_type: analysis.darkCircleType,
        intensity: analysis.intensity,
        score: analysis.score,
        left_eye_score: analysis.leftEyeScore,
        right_eye_score: analysis.rightEyeScore,
        recommendations: analysis.recommendations,
      });
      console.log('[saveAnalysis] Analysis saved successfully!');
    } catch (error) {
      console.error('[saveAnalysis] Error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }, [user, uploadPhoto]);

  // Load analyses from Supabase
  const loadAnalyses = useCallback(async (): Promise<SkinAnalysis[]> => {
    if (!user?.id || !isSupabaseConfigured()) return [];

    try {
      const dbAnalyses = await analysisService.getUserAnalyses(user.id);
      return dbAnalyses.map(dbAnalysisToAppAnalysis);
    } catch (error) {
      console.error('Error loading analyses:', error);
      return [];
    }
  }, [user]);

  // Save full face analysis to Supabase
  const saveFullFaceAnalysis = useCallback(async (analysis: FullFaceAnalysis, photoUri?: string) => {
    if (!user?.id || !isSupabaseConfigured()) return;

    try {
      // Upload photo first
      let photoUrl = null;
      if (photoUri) {
        photoUrl = await uploadPhoto(photoUri, 'analyses');
      }

      await analysisService.createFullFaceAnalysis(user.id, {
        photo_url: photoUrl,
        perceived_age: analysis.perceivedAge,
        eye_age: analysis.eyeAge,
        skin_tone: analysis.skinTone,
        ita_score: analysis.itaScore,
        acne_score: analysis.acneScore.value,
        acne_condition: analysis.acneScore.condition,
        hydration_score: analysis.hydrationScore.value,
        hydration_condition: analysis.hydrationScore.condition,
        lines_score: analysis.linesScore.value,
        lines_condition: analysis.linesScore.condition,
        pigmentation_score: analysis.pigmentationScore.value,
        pigmentation_condition: analysis.pigmentationScore.condition,
        pores_score: analysis.poresScore.value,
        pores_condition: analysis.poresScore.condition,
        redness_score: analysis.rednessScore.value,
        redness_condition: analysis.rednessScore.condition,
        translucency_score: analysis.translucencyScore.value,
        translucency_condition: analysis.translucencyScore.condition,
        uniformness_score: analysis.uniformnessScore.value,
        uniformness_condition: analysis.uniformnessScore.condition,
        eye_area_score: analysis.eyeAreaCondition.value,
        eye_area_condition: analysis.eyeAreaCondition.condition,
        overall_score: analysis.overallScore,
        priority_areas: analysis.priorityAreas,
        recommendations: analysis.recommendations,
        zones_data: {
          acne: analysis.acneScore.zones,
          hydration: analysis.hydrationScore.zones,
          lines: analysis.linesScore.zones,
          pigmentation: analysis.pigmentationScore.zones,
          pores: analysis.poresScore.zones,
          redness: analysis.rednessScore.zones,
          translucency: analysis.translucencyScore.zones,
          uniformness: analysis.uniformnessScore.zones,
          eyeArea: analysis.eyeAreaCondition.zones,
        },
      });
    } catch (error) {
      console.error('Error saving full face analysis:', error);
    }
  }, [user, uploadPhoto]);

  // Update subscription
  const updateSubscription = useCallback(async (
    plan: 'free' | 'monthly' | 'yearly',
    expiresAt?: string
  ) => {
    if (!user?.id || !isSupabaseConfigured()) return;

    await userService.updateSubscription(user.id, plan, expiresAt);
    setSubscription({
      isActive: plan !== 'free',
      plan: plan === 'free' ? undefined : plan,
      expiresAt,
    });
  }, [user]);

  // Create order
  const createOrder = useCallback(async (orderData: {
    items: { product_id: string; name: string; quantity: number; price: number }[];
    subtotal: number;
    shipping: number;
    total: number;
  }) => {
    if (!user?.id || !isSupabaseConfigured()) return null;

    try {
      const order = await orderService.createOrder(user.id, {
        status: 'pending',
        items: orderData.items,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        total: orderData.total,
        payment_intent_id: null,
        shipping_address: null,
        tracking_number: null,
      });
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }, [user]);

  // Load orders
  const loadOrders = useCallback(async (): Promise<DbOrder[]> => {
    if (!user?.id || !isSupabaseConfigured()) return [];

    try {
      return await orderService.getUserOrders(user.id);
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  }, [user]);

  // Record payment
  const recordPayment = useCallback(async (paymentData: {
    order_id?: string;
    type: 'order' | 'subscription';
    amount: number;
    currency?: string;
    status: 'pending' | 'succeeded' | 'failed' | 'refunded';
    payment_method?: string;
    stripe_payment_intent_id?: string;
  }) => {
    if (!user?.id || !isSupabaseConfigured()) return null;

    try {
      return await paymentService.createPayment(user.id, {
        order_id: paymentData.order_id || null,
        type: paymentData.type,
        amount: paymentData.amount,
        currency: paymentData.currency || 'EUR',
        status: paymentData.status,
        payment_method: paymentData.payment_method || null,
        stripe_payment_intent_id: paymentData.stripe_payment_intent_id || null,
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      return null;
    }
  }, [user]);

  return {
    // State
    session,
    user,
    loading,
    initialized,
    isAuthenticated: !!session,
    isConfigured: isSupabaseConfigured(),

    // Auth methods
    signUp,
    signIn,
    signInWithOTP,
    verifyOTP,
    signOut,

    // Profile methods
    updateProfile,
    completeOnboarding,
    loadUserProfile,

    // Storage methods
    uploadPhoto,
    uploadPhotoBase64,

    // Analysis methods
    saveAnalysis,
    loadAnalyses,
    saveFullFaceAnalysis,

    // Subscription methods
    updateSubscription,

    // Order methods
    createOrder,
    loadOrders,
    recordPayment,
  };
}

// Export a singleton hook for components that need auth without hooks
export const getAuthState = () => {
  return {
    isConfigured: isSupabaseConfigured(),
  };
};
