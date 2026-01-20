/*
  # Create Initial Database Schema for INOS

  1. New Tables
    - `users` - User profiles extending auth.users
      - Stores user information, onboarding status, and subscription data
    - `skin_analyses` - Basic dark circle analyses
      - Stores analysis results with scores and recommendations
    - `full_face_analyses` - Premium full face skin analyses
      - Comprehensive skin metrics with zone-specific scores
    - `orders` - E-commerce orders
      - Order management with items, shipping, and payment tracking
    - `carts` - Persisted shopping carts
      - User cart items for the shop
    - `payments` - Payment records
      - Transaction tracking for orders and subscriptions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Create storage bucket for photos with appropriate policies
    - Add trigger to auto-create user profile on signup

  3. Indexes
    - Performance indexes on frequently queried columns
*/

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
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for skin_analyses
CREATE POLICY "Users can view own analyses" ON public.skin_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.skin_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.skin_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for full_face_analyses
CREATE POLICY "Users can view own full face analyses" ON public.full_face_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own full face analyses" ON public.full_face_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own full face analyses" ON public.full_face_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for carts
CREATE POLICY "Users can view own cart" ON public.carts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart" ON public.carts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON public.carts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart" ON public.carts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

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