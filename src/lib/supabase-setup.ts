import { supabase, isSupabaseConfigured } from './supabase';

interface SetupResult {
  configured: boolean;
  connected: boolean;
  tables: {
    users: boolean;
    skin_analyses: boolean;
    full_face_analyses: boolean;
    orders: boolean;
    payments: boolean;
  };
  storage: {
    photos: boolean;
  };
  errors: string[];
}

export async function checkSupabaseSetup(): Promise<SetupResult> {
  const result: SetupResult = {
    configured: false,
    connected: false,
    tables: {
      users: false,
      skin_analyses: false,
      full_face_analyses: false,
      orders: false,
      payments: false,
    },
    storage: {
      photos: false,
    },
    errors: [],
  };

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    result.errors.push('Supabase URL or Anon Key not configured');
    return result;
  }
  result.configured = true;

  // Test connection by checking auth
  try {
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      result.errors.push(`Auth connection error: ${authError.message}`);
    } else {
      result.connected = true;
    }
  } catch (err) {
    result.errors.push(`Connection failed: ${err}`);
    return result;
  }

  // Check tables exist
  const tables = ['users', 'skin_analyses', 'full_face_analyses', 'orders', 'payments'] as const;

  for (const table of tables) {
    try {
      // Try to query the table (will fail if it doesn't exist)
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          result.errors.push(`Table "${table}" does not exist`);
        } else if (error.code === 'PGRST301') {
          // Permission denied - table exists but RLS blocks access (expected when not logged in)
          result.tables[table] = true;
        } else {
          result.errors.push(`Table "${table}" error: ${error.message}`);
        }
      } else {
        result.tables[table] = true;
      }
    } catch (err) {
      result.errors.push(`Table "${table}" check failed: ${err}`);
    }
  }

  // Check storage bucket
  try {
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
      result.errors.push(`Storage error: ${storageError.message}`);
    } else if (buckets) {
      const photosBucket = buckets.find((b) => b.name === 'photos');
      result.storage.photos = !!photosBucket;
      if (!photosBucket) {
        result.errors.push('Storage bucket "photos" does not exist');
      }
    }
  } catch (err) {
    result.errors.push(`Storage check failed: ${err}`);
  }

  return result;
}

export function logSetupResult(result: SetupResult): void {
  console.log('=== Supabase Setup Check ===');
  console.log(`Configured: ${result.configured ? 'YES' : 'NO'}`);
  console.log(`Connected: ${result.connected ? 'YES' : 'NO'}`);
  console.log('Tables:');
  Object.entries(result.tables).forEach(([table, exists]) => {
    console.log(`  - ${table}: ${exists ? 'OK' : 'MISSING'}`);
  });
  console.log('Storage:');
  console.log(`  - photos bucket: ${result.storage.photos ? 'OK' : 'MISSING'}`);
  if (result.errors.length > 0) {
    console.log('Errors:');
    result.errors.forEach((err) => console.log(`  - ${err}`));
  }
  console.log('============================');
}
