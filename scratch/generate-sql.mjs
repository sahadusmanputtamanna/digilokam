// generate-sql.mjs - generates migration.sql from seedData
import { defaultCategories, defaultArticles, defaultComments } from '../src/data/seedData.js';
import { writeFileSync } from 'fs';

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

const lines = [];

lines.push('-- ============================================================');
lines.push('-- DigiLokam Full Database Migration');
lines.push('-- Run this in: Supabase Dashboard → SQL Editor → Paste → RUN');
lines.push('-- ============================================================');
lines.push('');
lines.push('-- Temporarily disable RLS for migration');
lines.push('ALTER TABLE categories DISABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE articles DISABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE comments DISABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;');
lines.push('');

// Categories
lines.push('-- ── CATEGORIES ──────────────────────────────────────────────');
for (const cat of defaultCategories) {
  lines.push(
    `INSERT INTO categories (id, name, slug, description) VALUES (${cat.id}, ${esc(cat.name)}, ${esc(cat.slug)}, ${esc(cat.description)}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description;`
  );
}
lines.push('');

// Articles
lines.push('-- ── ARTICLES ────────────────────────────────────────────────');
for (const a of defaultArticles) {
  let imgUrl = a.image_url || '';
  if (!imgUrl || imgUrl.startsWith('data:image')) {
    imgUrl = `https://picsum.photos/800/500?random=${Math.abs(a.id.charCodeAt(4) || 42) * 7}`;
  }
  const tags = a.tags && a.tags.length
    ? `ARRAY[${a.tags.map(t => esc(t)).join(',')}]::text[]`
    : `ARRAY[]::text[]`;

  lines.push(
    `INSERT INTO articles (title, slug, content, description, image_url, category_id, tags, is_featured, is_draft, views, read_time, seo_title, seo_description, created_at, updated_at)` +
    ` VALUES (${esc(a.title)}, ${esc(a.slug)}, ${esc(a.content)}, ${esc(a.description)}, ${esc(imgUrl)}, ${a.category_id ?? 'NULL'}, ${tags}, ${a.is_featured ? 'true' : 'false'}, ${a.is_draft ? 'true' : 'false'}, ${a.views || 0}, ${esc(a.read_time || '5 min read')}, ${esc(a.seo_title || a.title)}, ${esc(a.seo_description || a.description)}, ${esc(a.created_at || new Date().toISOString())}, ${esc(a.updated_at || new Date().toISOString())})` +
    ` ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, description = EXCLUDED.description, image_url = EXCLUDED.image_url, category_id = EXCLUDED.category_id, tags = EXCLUDED.tags, is_featured = EXCLUDED.is_featured, is_draft = EXCLUDED.is_draft, views = EXCLUDED.views, read_time = EXCLUDED.read_time, seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description, updated_at = EXCLUDED.updated_at;`
  );
}
lines.push('');

// Comments
lines.push('-- ── COMMENTS ────────────────────────────────────────────────');
lines.push('-- Note: using sub-selects to link to article IDs');
for (const c of defaultComments) {
  // Find the matching article slug
  const art = defaultArticles.find(a => a.id === c.article_id);
  if (!art) continue;
  lines.push(
    `INSERT INTO comments (article_id, author_name, content, status, created_at)` +
    ` SELECT id, ${esc(c.author_name)}, ${esc(c.content)}, 'approved', ${esc(c.created_at || new Date().toISOString())}` +
    ` FROM articles WHERE slug = ${esc(art.slug)} LIMIT 1` +
    ` ON CONFLICT DO NOTHING;`
  );
}
lines.push('');

// Subscribers
lines.push('-- ── SUBSCRIBERS ─────────────────────────────────────────────');
const subs = ['reader1@gmail.com', 'reader2@gmail.com', 'reader3@gmail.com'];
for (const email of subs) {
  lines.push(
    `INSERT INTO subscribers (email, status, subscribed_at) VALUES (${esc(email)}, 'active', NOW()) ON CONFLICT (email) DO NOTHING;`
  );
}
lines.push('');

// Re-enable RLS
lines.push('-- Re-enable RLS');
lines.push('ALTER TABLE categories ENABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE articles ENABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE comments ENABLE ROW LEVEL SECURITY;');
lines.push('ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;');
lines.push('');
lines.push('-- Verify');
lines.push('SELECT (SELECT COUNT(*) FROM categories) AS categories, (SELECT COUNT(*) FROM articles) AS articles, (SELECT COUNT(*) FROM comments) AS comments, (SELECT COUNT(*) FROM subscribers) AS subscribers;');

const sql = lines.join('\n');
writeFileSync('./scratch/migration.sql', sql, 'utf8');
console.log(`✅ Generated scratch/migration.sql`);
console.log(`   Categories: ${defaultCategories.length}`);
console.log(`   Articles:   ${defaultArticles.length}`);
console.log(`   Comments:   ${defaultComments.length}`);
console.log(`   File size:  ${(sql.length / 1024).toFixed(1)} KB`);
