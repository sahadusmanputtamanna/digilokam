import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually
const envPath = 'd:/Usman Protfolio/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    if (key) {
      env[key] = value;
    }
  }
});

const rawUrl = env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching one row from articles...");
  const { data, error } = await supabase.from('articles').select('*').limit(1);
  if (error) {
    console.error("Error fetching articles:", error);
  } else if (data && data.length > 0) {
    console.log("Row keys:", Object.keys(data[0]));
    console.log("Complete row sample:", data[0]);
  } else {
    console.log("No rows found. Attempting to fetch column info from pg_attribute/information_schema...");
    // Let's run a select with a non-existent column to see if Supabase error lists valid columns,
    // or run a postgrest RPC if possible. Let's just try to insert an empty row or query something.
    // Or we can query information_schema columns via an RPC or query if allowed.
    // Since SQL queries are direct, let's query supabase catalog. Wait, postgrest doesn't allow direct catalog query usually unless exposed.
    // But we can check via supabase client. Let's select.
  }
}

run();
