import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// Check if admin client is configured (for storage operations)
export const isAdminConfigured = () => {
  const configured = !!supabaseUrl && !!supabaseServiceKey;
  console.log('[supabase] Admin configured:', configured, { hasUrl: !!supabaseUrl, hasServiceKey: !!supabaseServiceKey });
  return configured;
};

// Create Supabase client with proper React Native configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Create admin client for storage operations (bypasses RLS)
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Auto-refresh session when app comes to foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// ===================
// DATABASE TYPES
// ===================

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  skin_type: string | null;
  dark_circle_type: string | null;
  goals: string[] | null;
  quiz_answers: Record<string, string> | null;
  onboarding_completed: boolean;
  subscription_plan: 'free' | 'monthly' | 'yearly' | null;
  subscription_expires_at: string | null;
  routine_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSkinAnalysis {
  id: string;
  user_id: string;
  photo_url: string | null;
  dark_circle_type: 'vascular' | 'pigmented' | 'structural' | 'mixed';
  intensity: 'mild' | 'moderate' | 'severe';
  score: number;
  left_eye_score: number;
  right_eye_score: number;
  recommendations: string[];
  created_at: string;
}

export interface DbFullFaceAnalysis {
  id: string;
  user_id: string;
  photo_url: string | null;
  perceived_age: number;
  eye_age: number;
  skin_tone: string;
  ita_score: number;
  acne_score: number;
  acne_condition: string;
  hydration_score: number;
  hydration_condition: string;
  lines_score: number;
  lines_condition: string;
  pigmentation_score: number;
  pigmentation_condition: string;
  pores_score: number;
  pores_condition: string;
  redness_score: number;
  redness_condition: string;
  translucency_score: number;
  translucency_condition: string;
  uniformness_score: number;
  uniformness_condition: string;
  eye_area_score: number;
  eye_area_condition: string;
  overall_score: number;
  priority_areas: string[];
  recommendations: string[];
  zones_data: Record<string, unknown>;
  created_at: string;
}

export interface DbOrder {
  id: string;
  user_id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  items: {
    product_id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_intent_id: string | null;
  shipping_address: {
    name: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
  } | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCart {
  id: string;
  user_id: string;
  items: { productId: string; quantity: number }[];
  updated_at: string;
}

export interface DbPayment {
  id: string;
  user_id: string;
  order_id: string | null;
  type: 'order' | 'subscription';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

// ===================
// AUTH SERVICE
// ===================

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, name?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign in with OTP (magic link)
  async signInWithOTP(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
    return data;
  },

  // Verify OTP code
  async verifyOTP(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Get current user
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ===================
// USER PROFILE SERVICE
// ===================

export const userService = {
  // Get user profile
  async getProfile(userId: string): Promise<DbUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create user profile
  async createProfile(userId: string, email: string, name?: string): Promise<DbUser> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name: name || null,
        onboarding_completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<DbUser>): Promise<DbUser> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Complete onboarding
  async completeOnboarding(
    userId: string,
    profileData: {
      name: string;
      skin_type?: string;
      dark_circle_type?: string;
      goals?: string[];
    }
  ): Promise<DbUser> {
    return this.updateProfile(userId, {
      ...profileData,
      onboarding_completed: true,
    } as Partial<DbUser>);
  },

  // Update subscription
  async updateSubscription(
    userId: string,
    plan: 'free' | 'monthly' | 'yearly',
    expiresAt?: string
  ): Promise<DbUser> {
    return this.updateProfile(userId, {
      subscription_plan: plan,
      subscription_expires_at: expiresAt || null,
    });
  },
};

// ===================
// STORAGE SERVICE
// ===================

export const storageService = {
  // Upload photo (React Native compatible using fetch + arrayBuffer)
  // Uses admin client to bypass RLS for anonymous uploads
  async uploadPhoto(
    userId: string | null,
    uri: string,
    folder: 'analyses' | 'avatars' = 'analyses'
  ): Promise<string> {
    const id = userId || 'anonymous';
    const fileName = `${id}/${folder}/${Date.now()}.jpg`;

    // Check if admin client is properly configured
    if (!supabaseServiceKey) {
      console.error('[storageService] Service role key not configured!');
      throw new Error('Supabase admin not configured');
    }

    try {
      console.log('[storageService] Uploading photo...', { userId: id, folder, uri: uri.substring(0, 50) });

      // Fetch the image and convert to arrayBuffer
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();

      console.log('[storageService] Image fetched, size:', arrayBuffer.byteLength);

      // Use admin client to bypass RLS
      const { data, error } = await supabaseAdmin.storage
        .from('photos')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('[storageService] Upload error:', JSON.stringify(error));
        throw error;
      }

      console.log('[storageService] Upload successful, path:', data.path);

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('photos')
        .getPublicUrl(data.path);

      console.log('[storageService] Photo uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (err) {
      console.error('[storageService] Photo upload failed:', err);
      throw err;
    }
  },

  // Upload photo from base64
  async uploadPhotoBase64(
    userId: string | null,
    base64Data: string,
    folder: 'analyses' | 'avatars' = 'analyses'
  ): Promise<string> {
    const id = userId || 'anonymous';
    const fileName = `${id}/${folder}/${Date.now()}.jpg`;

    try {
      console.log('[storageService] Uploading base64 photo...', { userId: id, folder });

      // Remove data URL prefix if present
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

      // Decode base64 to binary
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { data, error } = await supabaseAdmin.storage
        .from('photos')
        .upload(fileName, bytes.buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('[storageService] Base64 upload error:', error);
        throw error;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('photos')
        .getPublicUrl(data.path);

      console.log('[storageService] Base64 photo uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (err) {
      console.error('[storageService] Base64 photo upload failed:', err);
      throw err;
    }
  },

  // Delete photo
  async deletePhoto(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from('photos')
      .remove([path]);

    if (error) throw error;
  },

  // Get photo URL
  getPhotoUrl(path: string): string {
    const { data } = supabaseAdmin.storage
      .from('photos')
      .getPublicUrl(path);

    return data.publicUrl;
  },
};

// ===================
// ANALYSIS SERVICE
// ===================

export const analysisService = {
  // Create basic analysis (dark circles)
  async createAnalysis(
    userId: string,
    analysis: Omit<DbSkinAnalysis, 'id' | 'user_id' | 'created_at'>
  ): Promise<DbSkinAnalysis> {
    const { data, error } = await supabase
      .from('skin_analyses')
      .insert({
        user_id: userId,
        ...analysis,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user analyses
  async getUserAnalyses(userId: string, limit = 20): Promise<DbSkinAnalysis[]> {
    const { data, error } = await supabase
      .from('skin_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get single analysis
  async getAnalysis(analysisId: string): Promise<DbSkinAnalysis | null> {
    const { data, error } = await supabase
      .from('skin_analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Delete analysis
  async deleteAnalysis(analysisId: string): Promise<void> {
    const { error } = await supabase
      .from('skin_analyses')
      .delete()
      .eq('id', analysisId);

    if (error) throw error;
  },

  // Create full face analysis (premium)
  async createFullFaceAnalysis(
    userId: string,
    analysis: Omit<DbFullFaceAnalysis, 'id' | 'user_id' | 'created_at'>
  ): Promise<DbFullFaceAnalysis> {
    const { data, error } = await supabase
      .from('full_face_analyses')
      .insert({
        user_id: userId,
        ...analysis,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user full face analyses
  async getUserFullFaceAnalyses(userId: string, limit = 10): Promise<DbFullFaceAnalysis[]> {
    const { data, error } = await supabase
      .from('full_face_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get single full face analysis
  async getFullFaceAnalysis(analysisId: string): Promise<DbFullFaceAnalysis | null> {
    const { data, error } = await supabase
      .from('full_face_analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
};

// ===================
// ORDER SERVICE
// ===================

export const orderService = {
  // Create order
  async createOrder(
    userId: string,
    order: Omit<DbOrder, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<DbOrder> {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        ...order,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user orders
  async getUserOrders(userId: string): Promise<DbOrder[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get single order
  async getOrder(orderId: string): Promise<DbOrder | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Update order status
  async updateOrderStatus(
    orderId: string,
    status: DbOrder['status'],
    paymentIntentId?: string
  ): Promise<DbOrder> {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ===================
// PAYMENT SERVICE
// ===================

export const paymentService = {
  // Create payment record
  async createPayment(
    userId: string,
    payment: Omit<DbPayment, 'id' | 'user_id' | 'created_at'>
  ): Promise<DbPayment> {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        ...payment,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user payments
  async getUserPayments(userId: string): Promise<DbPayment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update payment status
  async updatePaymentStatus(
    paymentId: string,
    status: DbPayment['status']
  ): Promise<DbPayment> {
    const { data, error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ===================
// SQL SCHEMA (for reference - run in Supabase SQL Editor)
// ===================

export const SQL_SCHEMA = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  skin_type TEXT,
  dark_circle_type TEXT,
  goals TEXT[],
  quiz_answers JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_plan TEXT CHECK (subscription_plan IN ('free', 'monthly', 'yearly')),
  subscription_expires_at TIMESTAMPTZ,
  routine_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skin analyses (basic - dark circles)
CREATE TABLE IF NOT EXISTS public.skin_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  dark_circle_type TEXT NOT NULL CHECK (dark_circle_type IN ('vascular', 'pigmented', 'structural', 'mixed')),
  intensity TEXT NOT NULL CHECK (intensity IN ('mild', 'moderate', 'severe')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  left_eye_score INTEGER NOT NULL CHECK (left_eye_score >= 0 AND left_eye_score <= 100),
  right_eye_score INTEGER NOT NULL CHECK (right_eye_score >= 0 AND right_eye_score <= 100),
  recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full face analyses (premium)
CREATE TABLE IF NOT EXISTS public.full_face_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  perceived_age INTEGER,
  eye_age INTEGER,
  skin_tone TEXT,
  ita_score INTEGER,
  acne_score INTEGER,
  acne_condition TEXT,
  hydration_score INTEGER,
  hydration_condition TEXT,
  lines_score INTEGER,
  lines_condition TEXT,
  pigmentation_score INTEGER,
  pigmentation_condition TEXT,
  pores_score INTEGER,
  pores_condition TEXT,
  redness_score INTEGER,
  redness_condition TEXT,
  translucency_score INTEGER,
  translucency_condition TEXT,
  uniformness_score INTEGER,
  uniformness_condition TEXT,
  eye_area_score INTEGER,
  eye_area_condition TEXT,
  overall_score INTEGER,
  priority_areas TEXT[],
  recommendations TEXT[],
  zones_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment_intent_id TEXT,
  shipping_address JSONB,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart (persisted user cart)
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  items JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'subscription')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skin_analyses_user_id ON public.skin_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_skin_analyses_created_at ON public.skin_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_full_face_analyses_user_id ON public.full_face_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.full_face_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for skin_analyses
CREATE POLICY "Users can view own analyses" ON public.skin_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.skin_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.skin_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for full_face_analyses
CREATE POLICY "Users can view own full face analyses" ON public.full_face_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own full face analyses" ON public.full_face_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own full face analyses" ON public.full_face_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for carts
CREATE POLICY "Users can view own cart" ON public.carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart" ON public.carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON public.carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart" ON public.carts
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Public photos are viewable by anyone
CREATE POLICY "Public photos are viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
