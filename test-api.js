// Load environment variables from .env file
const PROJECT_REF = process.env.EXPO_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
const SERVICE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

async function testEndpoint() {
  if (!PROJECT_REF || !SERVICE_KEY) {
    console.error('Missing environment variables: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  // Test the database query endpoint
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: 'SELECT 1' }),
  });
  
  console.log('Status:', response.status, response.statusText);
  const text = await response.text();
  console.log('Response:', text);
}

testEndpoint();
