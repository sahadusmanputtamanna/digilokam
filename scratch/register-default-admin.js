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

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key:", supabaseAnonKey ? "[LOADED]" : "[MISSING]");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = 'admin@digilokam.com';
  const password = 'admin123';

  console.log("\n1. Checking if admin user exists in public.users table...");
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);

  if (userError) {
    console.error("❌ Error querying users table:", userError.message);
  } else if (users && users.length > 0) {
    console.log("✅ Admin user already exists in public.users table:", users[0]);
  } else {
    console.log("ℹ️ No admin user found in public.users table.");
  }

  console.log("\n2. Attempting to register admin user in Supabase Auth...");
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Admin DigiLokam'
        }
      }
    });

    if (signUpError) {
      console.log(`❌ Auth signUp failed: ${signUpError.message} (Status: ${signUpError.status})`);
    } else {
      console.log("✅ Auth signUp succeeded! User details:", signUpData.user ? signUpData.user.email : 'No user details');
    }
  } catch (err) {
    console.error("Auth signUp exception:", err.message);
  }

  console.log("\n3. Testing Admin sign in...");
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.log(`❌ Sign in failed: ${signInError.message} (Status: ${signInError.status})`);
    } else {
      console.log("✅ Sign in succeeded! Authenticated email:", signInData.user.email);
      
      // Query profile role
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .single();
      console.log("✅ User profile role in database:", profile ? profile.role : 'No profile found');
    }
  } catch (err) {
    console.error("Sign in exception:", err.message);
  }
}

run();
