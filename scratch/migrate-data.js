import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { defaultArticles, defaultCategories, defaultComments } from '../src/data/seedData.js';

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
  console.log("Starting Supabase data migration...");

  // 1. Authenticate as Admin
  const email = 'digilokam.admin@gmail.com';
  const password = 'adminpassword123';
  let session = null;

  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.log("------------------------------------------------------------");
      console.log("❌ SIGN IN FAILED: " + signInError.message);
      console.log("\nTo perform the migration, please do the following:");
      console.log("1. Go to your Supabase Project Dashboard -> Authentication -> Users.");
      console.log("2. Click 'Add User' -> 'Create User'.");
      console.log("3. Enter Email: " + email + " and Password: " + password + ".");
      console.log("4. Turn off 'Auto-confirm user' or keep it on (recommended), then click Save.");
      console.log("5. Once created, run this migration script again to populate the database.");
      console.log("------------------------------------------------------------");
      return;
    }
    
    console.log("Admin user successfully signed in.");
    session = signInData.session;
  } catch (err) {
    console.log("❌ Authentication error:", err.message);
    return;
  }

  // 2. Migrate Categories
  console.log("\nMigrating Categories...");
  for (const cat of defaultCategories) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          console.log(`- Category "${cat.name}" already exists.`);
        } else {
          console.log(`- Error inserting category "${cat.name}":`, error.message);
        }
      } else {
        console.log(`- Inserted category: "${cat.name}"`);
      }
    } catch (err) {
      console.log(`- Exception inserting category "${cat.name}":`, err.message);
    }
  }

  // 3. Migrate Articles
  console.log("\nMigrating Articles...");
  const articleMap = {};
  for (const art of defaultArticles) {
    try {
      let imgUrl = art.image_url || '';

      const { data, error } = await supabase
        .from('articles')
        .insert({
          title: art.title,
          slug: art.slug,
          content: art.content,
          description: art.description,
          image_url: imgUrl,
          category_id: art.category_id,
          tags: art.tags || [],
          is_featured: art.is_featured || false,
          is_draft: art.is_draft || false,
          views: art.views || 0,
          read_time: art.read_time || '5 min read',
          seo_title: art.seo_title || art.title,
          seo_description: art.seo_description || art.description,
          created_at: art.created_at || new Date().toISOString(),
          updated_at: art.updated_at || new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`- Article "${art.title}" (slug: ${art.slug}) already exists. Fetching existing UUID...`);
          const { data: existing } = await supabase
            .from('articles')
            .select('id')
            .eq('slug', art.slug)
            .single();
          if (existing) {
            articleMap[art.id] = existing.id;
          }
        } else {
          console.log(`- Error inserting article "${art.title}":`, error.message);
        }
      } else {
        console.log(`- Inserted article: "${art.title}" -> UUID: ${data.id}`);
        articleMap[art.id] = data.id;
      }
    } catch (err) {
      console.log(`- Exception inserting article "${art.title}":`, err.message);
    }
  }

  // 4. Migrate Comments
  console.log("\nMigrating Comments...");
  for (const comm of defaultComments) {
    const newArticleUuid = articleMap[comm.article_id];
    if (!newArticleUuid) {
      console.log(`- Skipping comment: Article ID "${comm.article_id}" was not migrated.`);
      continue;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          article_id: newArticleUuid,
          author_name: comm.author_name,
          content: comm.content,
          status: comm.status || 'approved',
          created_at: comm.created_at || new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.log(`- Error inserting comment by "${comm.author_name}":`, error.message);
      } else {
        console.log(`- Inserted comment by "${comm.author_name}" on article UUID: ${newArticleUuid}`);
      }
    } catch (err) {
      console.log(`- Exception inserting comment by "${comm.author_name}":`, err.message);
    }
  }

  // 5. Migrate Subscribers
  console.log("\nMigrating Subscribers...");
  const defaultSubscribers = [
    { email: 'user1@digilokam.com', status: 'active' },
    { email: 'user2@digilokam.com', status: 'active' },
    { email: 'user3@digilokam.com', status: 'active' }
  ];
  for (const sub of defaultSubscribers) {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .insert({
          email: sub.email.toLowerCase(),
          status: sub.status || 'active',
          subscribed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`- Subscriber "${sub.email}" already exists.`);
        } else {
          console.log(`- Error inserting subscriber "${sub.email}":`, error.message);
        }
      } else {
        console.log(`- Inserted subscriber: "${sub.email}"`);
      }
    } catch (err) {
      console.log(`- Exception inserting subscriber "${sub.email}":`, err.message);
    }
  }

  console.log("\n✅ Data migration completed successfully!");
}

run();
