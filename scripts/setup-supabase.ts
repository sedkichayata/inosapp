/**
 * Supabase Admin Setup Script
 *
 * This script uses the service_role key to configure the Supabase database.
 * Run with: bun scripts/setup-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SQL_SCHEMA = `
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
`;

const RLS_POLICIES = `
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
`;

const TRIGGERS = `
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

const STORAGE_POLICIES = `
-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Public photos are viewable" ON storage.objects;

-- Storage policies
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

async function runSQL(sql: string, description: string): Promise<boolean> {
  console.log(`\n📝 ${description}...`);

  const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql }).maybeSingle();

  // If rpc doesn't exist, try direct query via REST
  if (error) {
    // Use the Supabase REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (!response.ok) {
      // If the RPC doesn't exist, we'll need to use a different approach
      console.log(`   ⚠️  RPC not available, using alternative method...`);
      return false;
    }
  }

  console.log(`   ✅ Done`);
  return true;
}

async function createStorageBucket(): Promise<boolean> {
  console.log('\n📦 Creating storage bucket "photos"...');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

  if (listError) {
    console.log(`   ❌ Error listing buckets: ${listError.message}`);
    return false;
  }

  const photosBucket = buckets?.find(b => b.name === 'photos');

  if (photosBucket) {
    console.log('   ℹ️  Bucket "photos" already exists');
    return true;
  }

  // Create bucket
  const { error: createError } = await supabaseAdmin.storage.createBucket('photos', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  if (createError) {
    console.log(`   ❌ Error creating bucket: ${createError.message}`);
    return false;
  }

  console.log('   ✅ Bucket created successfully');
  return true;
}

async function checkTables(): Promise<void> {
  console.log('\n🔍 Checking tables...');

  const tables = ['users', 'skin_analyses', 'full_face_analyses', 'orders', 'payments'];

  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select('id').limit(1);

    if (error && error.code === '42P01') {
      console.log(`   ❌ Table "${table}" does not exist`);
    } else if (error) {
      console.log(`   ⚠️  Table "${table}": ${error.message}`);
    } else {
      console.log(`   ✅ Table "${table}" exists`);
    }
  }
}

async function executeViaPostgREST(sql: string): Promise<boolean> {
  // Split SQL into individual statements and execute via PostgREST
  // This is a workaround since we can't execute raw SQL directly

  // For table creation, we need to use the Supabase Management API
  // which requires a different authentication method

  console.log('   ℹ️  Note: Direct SQL execution requires Supabase Dashboard');
  console.log('   ℹ️  Please run the SQL in Supabase Dashboard > SQL Editor');
  return false;
}

async function main() {
  console.log('🚀 Supabase Setup Script');
  console.log('========================');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`);

  // Test connection
  console.log('\n🔌 Testing connection...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.getSession();

  if (authError) {
    console.log(`   ❌ Connection error: ${authError.message}`);
  } else {
    console.log('   ✅ Connected to Supabase');
  }

  // Check existing tables
  await checkTables();

  // Create storage bucket
  await createStorageBucket();

  // Note about SQL execution
  console.log('\n' + '='.repeat(50));
  console.log('⚠️  IMPORTANT: Table Creation');
  console.log('='.repeat(50));
  console.log('\nThe Supabase JS client cannot execute DDL statements');
  console.log('(CREATE TABLE, ALTER TABLE, etc.) directly.');
  console.log('\nTo create the tables, please:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Run the SQL from: src/lib/supabase.ts (SQL_SCHEMA export)');
  console.log('\nAlternatively, I can output the full SQL here for you to copy.');

  // Output SQL
  console.log('\n' + '='.repeat(50));
  console.log('📋 FULL SQL SCHEMA');
  console.log('='.repeat(50));
  console.log(SQL_SCHEMA);
  console.log('\n-- RLS POLICIES --');
  console.log(RLS_POLICIES);
  console.log('\n-- TRIGGERS --');
  console.log(TRIGGERS);
  console.log('\n-- STORAGE POLICIES (run after creating bucket) --');
  console.log(STORAGE_POLICIES);

  console.log('\n✨ Setup script complete!');
}

main().catch(console.error);
