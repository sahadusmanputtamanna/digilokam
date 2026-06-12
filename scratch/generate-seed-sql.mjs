// generate-seed-sql.mjs - generates digilokam-seed.sql (data only, no auth tables)
import { defaultCategories, defaultArticles, defaultComments } from '../src/data/seedData.js';
import { writeFileSync } from 'fs';

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

const lines = [];

lines.push('-- ============================================================');
lines.push('-- DigiLokam - Complete Database Seed SQL');
lines.push('-- Paste into Supabase SQL Editor → Run');
lines.push('-- Populates: categories, articles, comments, subscribers');
lines.push('-- Does NOT touch auth tables');
lines.push('-- ============================================================');
lines.push('');

// ── Disable RLS temporarily ──
lines.push('-- Temporarily disable RLS so inserts are not blocked');
lines.push('ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE public.articles   DISABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE public.comments   DISABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE public.subscribers DISABLE ROW LEVEL SECURITY;');
lines.push('');

// ── CATEGORIES ──
lines.push('-- ── 1. CATEGORIES ───────────────────────────────────────────');
for (const cat of defaultCategories) {
  lines.push(
    `INSERT INTO public.categories (id, name, slug, description)` +
    ` VALUES (${cat.id}, ${esc(cat.name)}, ${esc(cat.slug)}, ${esc(cat.description)})` +
    ` ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description;`
  );
}
lines.push('');
lines.push(`SELECT COUNT(*) AS categories_inserted FROM public.categories;`);
lines.push('');

// ── ARTICLES ──
lines.push('-- ── 2. ARTICLES (30 Malayalam articles) ────────────────────');
for (const a of defaultArticles) {
  let imgUrl = a.image_url || '';
  // Replace any base64 with a real Unsplash URL
  if (!imgUrl || imgUrl.startsWith('data:image') || imgUrl.length > 500) {
    const seed = parseInt(a.id.replace(/\D/g, ''), 10) || 1;
    imgUrl = `https://picsum.photos/seed/${seed}/800/500`;
  }
  const tags = a.tags && a.tags.length
    ? `ARRAY[${a.tags.map(t => esc(t)).join(',')}]::text[]`
    : `ARRAY[]::text[]`;

  lines.push(
    `INSERT INTO public.articles` +
    ` (title, slug, content, description, image_url, category_id, tags, is_featured, is_draft, views, read_time, seo_title, seo_description, created_at, updated_at)` +
    ` VALUES (` +
    `${esc(a.title)}, ` +
    `${esc(a.slug)}, ` +
    `${esc(a.content)}, ` +
    `${esc(a.description)}, ` +
    `${esc(imgUrl)}, ` +
    `${a.category_id ?? 'NULL'}, ` +
    `${tags}, ` +
    `${a.is_featured ? 'true' : 'false'}, ` +
    `${a.is_draft ? 'true' : 'false'}, ` +
    `${a.views || 0}, ` +
    `${esc(a.read_time || '5 min read')}, ` +
    `${esc(a.seo_title || a.title)}, ` +
    `${esc(a.seo_description || a.description)}, ` +
    `${esc(a.created_at || new Date().toISOString())}, ` +
    `${esc(a.updated_at || new Date().toISOString())}` +
    `)` +
    ` ON CONFLICT (slug) DO UPDATE SET` +
    ` title = EXCLUDED.title,` +
    ` content = EXCLUDED.content,` +
    ` description = EXCLUDED.description,` +
    ` image_url = EXCLUDED.image_url,` +
    ` category_id = EXCLUDED.category_id,` +
    ` tags = EXCLUDED.tags,` +
    ` is_featured = EXCLUDED.is_featured,` +
    ` is_draft = EXCLUDED.is_draft,` +
    ` views = EXCLUDED.views,` +
    ` read_time = EXCLUDED.read_time,` +
    ` seo_title = EXCLUDED.seo_title,` +
    ` seo_description = EXCLUDED.seo_description,` +
    ` updated_at = EXCLUDED.updated_at;`
  );
}
lines.push('');
lines.push(`SELECT COUNT(*) AS articles_inserted FROM public.articles;`);
lines.push('');

// ── COMMENTS ──
lines.push('-- ── 3. COMMENTS ─────────────────────────────────────────────');
for (const c of defaultComments) {
  const art = defaultArticles.find(a => a.id === c.article_id);
  if (!art) continue;
  lines.push(
    `INSERT INTO public.comments (article_id, author_name, content, status, created_at)` +
    ` SELECT id, ${esc(c.author_name)}, ${esc(c.content)}, 'approved', ${esc(c.created_at || new Date().toISOString())}` +
    ` FROM public.articles WHERE slug = ${esc(art.slug)} LIMIT 1` +
    ` ON CONFLICT DO NOTHING;`
  );
}
// Extra sample comments
const extraComments = [
  { slug: 'chatgpt-5-new-features-malayalam', name: 'Sreejith K', content: 'വളരെ നല്ല ലേഖനം! ഉപകാരപ്പെട്ടു.', status: 'approved' },
  { slug: 'gemini-3-vs-chatgpt-5-comparison', name: 'Nisha P', content: 'Gemini 3 ഉം ChatGPT-5 ഉം തമ്മിലുള്ള വ്യത്യാസം വ്യക്തമായി മനസ്സിലായി. നന്ദി!', status: 'approved' },
  { slug: 'how-to-use-claude-4-malayalam', name: 'Rahul M', content: 'Claude 4 ഉപയോഗിച്ചു നോക്കി. ശരിക്കും നല്ലതാണ്.', status: 'pending' },
  { slug: 'chatgpt-5-new-features-malayalam', name: 'Anjali S', content: 'ഈ ആർട്ടിക്കിൾ ഷെയർ ചെയ്തു. ഒരുപാട് കൂട്ടുകാർക്ക് ഉപകരിക്കും.', status: 'approved' },
  { slug: 'gemini-3-vs-chatgpt-5-comparison', name: 'Vishnu R', content: 'Super content! Keep it up DigiLokam.', status: 'approved' },
];
for (const c of extraComments) {
  const ts = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString();
  lines.push(
    `INSERT INTO public.comments (article_id, author_name, content, status, created_at)` +
    ` SELECT id, ${esc(c.name)}, ${esc(c.content)}, ${esc(c.status)}, ${esc(ts)}` +
    ` FROM public.articles WHERE slug = ${esc(c.slug)} LIMIT 1` +
    ` ON CONFLICT DO NOTHING;`
  );
}
lines.push('');
lines.push(`SELECT COUNT(*) AS comments_inserted FROM public.comments;`);
lines.push('');

// ── SUBSCRIBERS ──
lines.push('-- ── 4. SUBSCRIBERS ──────────────────────────────────────────');
const subscribers = [
  'keralareader1@gmail.com',
  'techmalayalam@gmail.com',
  'digitalnews.kerala@gmail.com',
  'aireader.ml@gmail.com',
  'malayalamtech@yahoo.com',
  'smartphoneuser.kerala@gmail.com',
  'ailearner2026@gmail.com',
  'onlineearner.kl@gmail.com',
  'socialtools.fan@gmail.com',
  'digilokam.subscriber@gmail.com',
];
for (const email of subscribers) {
  const ts = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString();
  lines.push(
    `INSERT INTO public.subscribers (email, status, subscribed_at)` +
    ` VALUES (${esc(email)}, 'active', ${esc(ts)})` +
    ` ON CONFLICT (email) DO NOTHING;`
  );
}
lines.push('');
lines.push(`SELECT COUNT(*) AS subscribers_inserted FROM public.subscribers;`);
lines.push('');

// ── Re-enable RLS ──
lines.push('-- Re-enable RLS');
lines.push('ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE public.articles    ENABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE public.comments    ENABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;');
lines.push('');

// ── Final Summary ──
lines.push('-- ── FINAL VERIFICATION ─────────────────────────────────────');
lines.push(`SELECT`);
lines.push(`  (SELECT COUNT(*) FROM public.categories)  AS categories,`);
lines.push(`  (SELECT COUNT(*) FROM public.articles)    AS articles,`);
lines.push(`  (SELECT COUNT(*) FROM public.comments)    AS comments,`);
lines.push(`  (SELECT COUNT(*) FROM public.subscribers) AS subscribers;`);

const sql = lines.join('\n');
writeFileSync('./scratch/digilokam-seed.sql', sql, 'utf8');
console.log('✅ Generated scratch/digilokam-seed.sql');
console.log('   Categories:  ', defaultCategories.length);
console.log('   Articles:    ', defaultArticles.length);
console.log('   Comments:    ', defaultComments.length + extraComments.length, '(seed + extra)');
console.log('   Subscribers: ', subscribers.length);
console.log('   File size:   ', (sql.length / 1024).toFixed(1), 'KB');
