import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file
const envPath = './.env';
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
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.log("❌ Error fetching users:", error.message);
    } else {
      console.log("✅ Users found in database:", data);
    }
  } catch (e) {
    console.log("Exception:", e.message);
  }
}

run();
