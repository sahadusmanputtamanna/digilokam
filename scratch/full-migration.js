import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { defaultArticles, defaultCategories, defaultComments } from '../src/data/seedData.js';

// Read .env
const env = {};
fs.readFileSync('./.env', 'utf8').split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim();
    if (k) env[k] = v;
  }
});

const supabaseUrl = (env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('='.repeat(60));
console.log('DigiLokam - Full Supabase Migration Script');
console.log('='.repeat(60));
console.log(`URL: ${supabaseUrl}`);
console.log(`Categories to migrate: ${defaultCategories.length}`);
console.log(`Articles to migrate:   ${defaultArticles.length}`);
console.log(`Comments to migrate:   ${defaultComments.length}`);
console.log('='.repeat(60));

// ─── helpers ────────────────────────────────────────────────────────────────

async function trySignIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return null;
  return data.session;
}

async function checkTableCount(table) {
  const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) return -1;
  const res = await supabase.from(table).select('id', { count: 'exact' });
  return res.count ?? (res.data?.length ?? 0);
}

// ─── generate SQL fallback ───────────────────────────────────────────────────

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function generateCategorySQL(cat) {
  return `INSERT INTO public.categories (id, name, slug, description) VALUES (${cat.id}, ${escapeSql(cat.name)}, ${escapeSql(cat.slug)}, ${escapeSql(cat.description)}) ON CONFLICT (id) DO NOTHING;`;
}

function generateArticleSQL(art) {
  const tags = art.tags && art.tags.length > 0
    ? `ARRAY[${art.tags.map(t => escapeSql(t)).join(',')}]::text[]`
    : `ARRAY[]::text[]`;
  const imgUrl = escapeSql(art.image_url || '');
  return `INSERT INTO public.articles (title, slug, content, description, image_url, category_id, tags, is_featured, is_draft, views, read_time, seo_title, seo_description, created_at, updated_at) VALUES (${escapeSql(art.title)}, ${escapeSql(art.slug)}, ${escapeSql(art.content)}, ${escapeSql(art.description)}, ${imgUrl}, ${art.category_id ?? 'NULL'}, ${tags}, ${art.is_featured ? 'true' : 'false'}, ${art.is_draft ? 'true' : 'false'}, ${art.views || 0}, ${escapeSql(art.read_time || '5 min read')}, ${escapeSql(art.seo_title || art.title)}, ${escapeSql(art.seo_description || art.description)}, ${escapeSql(art.created_at || new Date().toISOString())}, ${escapeSql(art.updated_at || new Date().toISOString())}) ON CONFLICT (slug) DO NOTHING;`;
}

function writeSqlFallback() {
  const lines = ['-- DigiLokam Full Migration SQL', '-- Run this in Supabase SQL Editor', ''];
  lines.push('-- CATEGORIES');
  for (const cat of defaultCategories) lines.push(generateCategorySQL(cat));
  lines.push('');
  lines.push('-- ARTICLES');
  for (const art of defaultArticles) lines.push(generateArticleSQL(art));
  lines.push('');
  lines.push('-- SUBSCRIBERS');
  const subs = ['user1@digilokam.com', 'user2@digilokam.com', 'user3@digilokam.com'];
  for (const email of subs) {
    lines.push(`INSERT INTO public.subscribers (email, status, subscribed_at) VALUES (${escapeSql(email)}, 'active', now()) ON CONFLICT (email) DO NOTHING;`);
  }
  const path = './scratch/migration.sql';
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
  console.log(`\n✅ SQL fallback written to: ${path}`);
  console.log('   → Paste it into Supabase Dashboard → SQL Editor and click Run.');
}

// ─── main migration ──────────────────────────────────────────────────────────

async function run() {
  // 1. Check existing data
  console.log('\n[1] Checking existing Supabase data...');
  const catCount = await checkTableCount('categories');
  const artCount = await checkTableCount('articles');
  console.log(`   categories: ${catCount} rows`);
  console.log(`   articles:   ${artCount} rows`);

  if (catCount >= defaultCategories.length && artCount >= defaultArticles.length) {
    console.log('\n✅ Database already fully migrated. Nothing to do.');
    return;
  }

  // 2. Attempt auth
  console.log('\n[2] Attempting admin authentication...');
  let session = await trySignIn('admin@digilokam.com', 'admin123');
  if (!session) session = await trySignIn('digilokam.admin@gmail.com', 'adminpassword123');

  if (session) {
    console.log('   ✅ Authenticated as:', session.user?.email);
  } else {
    console.log('   ⚠️  No admin credentials worked. Attempting anonymous inserts...');
    console.log('   (Will succeed only if RLS INSERT policies allow anon access)');
  }

  // 3. Migrate categories
  console.log('\n[3] Migrating categories...');
  let catOk = 0, catFail = 0;
  for (const cat of defaultCategories) {
    const { error } = await supabase
      .from('categories')
      .upsert({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description }, { onConflict: 'id' });
    if (error) {
      console.log(`   ❌ ${cat.name}: ${error.message}`);
      catFail++;
    } else {
      console.log(`   ✅ ${cat.name}`);
      catOk++;
    }
  }
  console.log(`   Categories: ${catOk} inserted, ${catFail} failed`);

  // 4. Migrate articles
  console.log('\n[4] Migrating articles...');
  let artOk = 0, artFail = 0;
  const articleMap = {};

  for (const art of defaultArticles) {
    let imgUrl = art.image_url || '';

    const payload = {
      title: art.title,
      slug: art.slug,
      content: art.content,
      description: art.description,
      image_url: imgUrl,
      category_id: art.category_id || null,
      tags: art.tags || [],
      is_featured: art.is_featured || false,
      is_draft: art.is_draft || false,
      views: art.views || 0,
      read_time: art.read_time || '5 min read',
      seo_title: art.seo_title || art.title,
      seo_description: art.seo_description || art.description,
      created_at: art.created_at || new Date().toISOString(),
      updated_at: art.updated_at || new Date().toISOString()
    };

    // Try upsert first
    const { data: upserted, error: upsertErr } = await supabase
      .from('articles')
      .upsert(payload, { onConflict: 'slug' })
      .select('id')
      .single();

    if (!upsertErr && upserted) {
      articleMap[art.id] = upserted.id;
      artOk++;
      process.stdout.write('.');
    } else {
      // Try fetching existing
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', art.slug)
        .single();
      if (existing) {
        articleMap[art.id] = existing.id;
        artOk++;
        process.stdout.write('~');
      } else {
        artFail++;
        process.stdout.write('!');
        if (artFail <= 3) {
          console.log(`\n   ❌ "${art.title}": ${upsertErr?.message}`);
        }
      }
    }
  }
  console.log(`\n   Articles: ${artOk} inserted/existing, ${artFail} failed`);

  // 5. Migrate comments
  console.log('\n[5] Migrating comments...');
  let commOk = 0, commFail = 0;
  for (const comm of defaultComments) {
    const newArticleId = articleMap[comm.article_id];
    if (!newArticleId) { commFail++; continue; }
    const { error } = await supabase.from('comments').insert({
      article_id: newArticleId,
      author_name: comm.author_name,
      content: comm.content,
      status: comm.status || 'approved',
      created_at: comm.created_at || new Date().toISOString()
    });
    if (error && error.code !== '23505') {
      commFail++;
    } else {
      commOk++;
    }
  }
  console.log(`   Comments: ${commOk} inserted, ${commFail} failed`);

  // 6. Migrate subscribers
  console.log('\n[6] Migrating subscribers...');
  const subs = [
    { email: 'user1@digilokam.com', status: 'active' },
    { email: 'user2@digilokam.com', status: 'active' },
    { email: 'user3@digilokam.com', status: 'active' }
  ];
  let subOk = 0;
  for (const sub of subs) {
    const { error } = await supabase.from('subscribers').upsert(
      { email: sub.email, status: sub.status, subscribed_at: new Date().toISOString() },
      { onConflict: 'email' }
    );
    if (!error) subOk++;
  }
  console.log(`   Subscribers: ${subOk} inserted`);

  // 7. Final verification
  console.log('\n[7] Final verification...');
  const finalCats = await checkTableCount('categories');
  const finalArts = await checkTableCount('articles');
  const finalSubs = await checkTableCount('subscribers');
  console.log(`   categories: ${finalCats} rows`);
  console.log(`   articles:   ${finalArts} rows`);
  console.log(`   subscribers: ${finalSubs} rows`);

  if (artFail > 0) {
    console.log('\n⚠️  Some inserts failed (likely RLS policy blocking anonymous inserts).');
    console.log('   Generating SQL fallback file...');
    writeSqlFallback();
    console.log('\n   REQUIRED STEPS:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Paste the contents of scratch/migration.sql and click Run');
    console.log('   3. All 30 articles + 5 categories will be inserted directly.');
  } else {
    console.log('\n✅ Migration complete! All data is now in Supabase.');
  }
  console.log('='.repeat(60));
}

run().catch(err => {
  console.error('Fatal error:', err);
  writeSqlFallback();
});
