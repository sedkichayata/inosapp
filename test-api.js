const PROJECT_REF = 'xoisbitzqcxckobeojhr';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaXNiaXR6cWN4Y2tvYmVvamhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzYyMTQ0OCwiZXhwIjoyMDgzMTk3NDQ4fQ.DkHhPjBlKNI9AETrO4X8IiEgqUoqRTkJQfYH5jeltg8';

async function testEndpoint() {
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
