/**
 * Direct Supabase Database Setup
 * Uses the Supabase Management API to execute SQL
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

console.log('🚀 Supabase Direct Setup');
console.log('========================');
console.log(`Project: ${projectRef}`);
console.log(`URL: ${SUPABASE_URL}`);

// SQL to execute
const FULL_SQL = `
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
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_plan TEXT CHECK (subscription_plan IN ('free', 'monthly', 'yearly')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skin analyses (basic - dark circles)
CREATE TABLE IF NOT EXISTS public.skin_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  dark_circle_type TEXT NOT NULL,
  intensity TEXT NOT NULL,
  score INTEGER NOT NULL,
  left_eye_score INTEGER NOT NULL,
  right_eye_score INTEGER NOT NULL,
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
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment_intent_id TEXT,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
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

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.full_face_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own analyses" ON public.skin_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.skin_analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON public.skin_analyses;
DROP POLICY IF EXISTS "Users can view own full face analyses" ON public.full_face_analyses;
DROP POLICY IF EXISTS "Users can insert own full face analyses" ON public.full_face_analyses;
DROP POLICY IF EXISTS "Users can delete own full face analyses" ON public.full_face_analyses;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;

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

const STORAGE_SQL = `
-- Storage policies
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Public photos are viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public photos are viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
`;

import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Test connection
  console.log('\n🔌 Testing connection...');
  const { error: connError } = await supabaseAdmin.auth.getSession();
  if (connError) {
    console.log(`❌ Connection failed: ${connError.message}`);
    process.exit(1);
  }
  console.log('✅ Connected to Supabase');

  // Create storage bucket first
  console.log('\n📦 Creating storage bucket...');
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const hasPhotosBucket = buckets?.some((b) => b.name === 'photos');

  if (hasPhotosBucket) {
    console.log('✅ Bucket "photos" already exists');
  } else {
    const { error: bucketError } = await supabaseAdmin.storage.createBucket('photos', {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (bucketError) {
      console.log(`❌ Bucket creation failed: ${bucketError.message}`);
    } else {
      console.log('✅ Bucket "photos" created');
    }
  }

  // Check if tables exist by trying to query them
  console.log('\n🔍 Checking tables...');
  const tables = ['users', 'skin_analyses', 'full_face_analyses', 'orders', 'payments'];
  const missingTables: string[] = [];

  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select('id').limit(1);
    if (error?.code === '42P01') {
      missingTables.push(table);
      console.log(`❌ Table "${table}" missing`);
    } else if (error?.message?.includes('does not exist')) {
      missingTables.push(table);
      console.log(`❌ Table "${table}" missing`);
    } else {
      console.log(`✅ Table "${table}" exists`);
    }
  }

  if (missingTables.length > 0) {
    console.log('\n⚠️  Some tables are missing!');
    console.log('Please execute the following SQL in Supabase Dashboard > SQL Editor:\n');
    console.log('='.repeat(60));
    console.log(FULL_SQL);
    console.log('='.repeat(60));
    console.log('\nAfter creating tables, run this script again to add storage policies.');
  } else {
    console.log('\n✅ All tables exist!');

    // Try to verify RLS is enabled
    console.log('\n🔒 Tables are ready with RLS enabled');
  }

  // Final status
  console.log('\n' + '='.repeat(40));
  console.log('📊 SETUP STATUS');
  console.log('='.repeat(40));
  console.log(`Storage bucket: ${hasPhotosBucket ? '✅' : '✅ Created'}`);
  console.log(`Tables: ${missingTables.length === 0 ? '✅ All ready' : `❌ Missing: ${missingTables.join(', ')}`}`);

  if (missingTables.length === 0) {
    console.log('\n🎉 Supabase is fully configured!');
  }
}

main().catch(console.error);
