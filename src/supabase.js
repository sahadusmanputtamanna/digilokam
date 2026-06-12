// DigiLokam Supabase & LocalStorage Integration Client
import { createClient } from '@supabase/supabase-js';
import { defaultArticles, defaultCategories, defaultComments, defaultSettings } from './data/seedData';

// 1. Supabase Initialization
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Dynamic schema detection variables
export let detectedColumns = [
  'id', 'title', 'slug', 'content', 'description', 'image_url', 
  'category_id', 'tags', 'is_featured', 'views', 'read_time', 
  'author_id', 'seo_title', 'seo_description', 'created_at', 
  'updated_at', 'is_draft', 'published_at', 'is_sponsored',
  'sponsor_name', 'sponsor_logo'
];

export const detectSchema = async () => {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.from('articles').select(detectedColumns.join(',')).limit(1);
    if (!error) {
      console.log("[Schema] All articles columns verified.");
      return;
    }
    
    // Test columns one-by-one to identify which ones actually exist
    const checkedColumns = [];
    const baseColumns = ['id', 'title', 'slug', 'content', 'description', 'image_url'];
    for (const col of baseColumns) {
      checkedColumns.push(col); // assumed to always exist
    }
    
    const optionalColumns = [
      'category_id', 'tags', 'is_featured', 'views', 'read_time', 
      'author_id', 'seo_title', 'seo_description', 'created_at', 
      'updated_at', 'is_draft', 'published_at'
    ];
    for (const col of optionalColumns) {
      const { error: colError } = await supabase.from('articles').select(col).limit(1);
      if (!colError || colError.code !== '42703') {
        checkedColumns.push(col);
      } else {
        console.warn(`[Schema] Column '${col}' does not exist on table 'articles', pruning.`);
      }
    }
    detectedColumns = checkedColumns;
  } catch (e) {
    console.error("[Schema] Detection failed, keeping all columns:", e);
  }
};

export const sanitizeArticlePayload = (payload) => {
  const sanitized = {};
  for (const col of detectedColumns) {
    if (payload[col] !== undefined) {
      sanitized[col] = payload[col];
    }
  }
  if (payload.reading_time !== undefined && detectedColumns.includes('read_time') && sanitized.read_time === undefined) {
    sanitized.read_time = payload.reading_time;
  }
  return sanitized;
};

export const getPublishedAt = (art) => {
  if (detectedColumns.includes('published_at') && art.published_at) {
    return art.published_at;
  }
  if (detectedColumns.includes('created_at') && art.created_at) {
    return art.created_at;
  }
  return new Date().toISOString();
};

// Trigger schema validation immediately
if (isSupabaseConfigured) {
  detectSchema().catch(console.error);
}

// 2. Local Storage Keys
const LOCAL_STORAGE_KEYS = {
  ARTICLES: 'digilokam_articles',
  CATEGORIES: 'digilokam_categories',
  COMMENTS: 'digilokam_comments',
  SETTINGS: 'digilokam_settings',
  USER: 'digilokam_user',
  SUBSCRIBERS: 'digilokam_subscribers',
  CONTACT_MESSAGES: 'digilokam_contact_messages'
};

const getLocalStorageData = (key, defaultData) => {
  if (typeof window === 'undefined') return defaultData;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Error parsing localStorage data for " + key, e);
    return defaultData;
  }
};

const setLocalStorageData = (key, data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Seed initial state in localStorage if empty
if (typeof window !== 'undefined') {
  const storedArticles = localStorage.getItem(LOCAL_STORAGE_KEYS.ARTICLES);
  if (!storedArticles || JSON.parse(storedArticles).length < 10) {
    setLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, defaultArticles);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES)) {
    setLocalStorageData(LOCAL_STORAGE_KEYS.CATEGORIES, defaultCategories);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.COMMENTS)) {
    setLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, defaultComments);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS)) {
    setLocalStorageData(LOCAL_STORAGE_KEYS.SETTINGS, defaultSettings);
  }
  
  // Seed default admin locally if missing
  const users = getLocalStorageData('digilokam_registered_users', []);
  if (!users.some(u => u.email.toLowerCase() === 'admin@digilokam.com')) {
    users.push({
      id: 'user-admin',
      email: 'admin@digilokam.com',
      password: 'admin123',
      full_name: 'Admin DigiLokam',
      role: 'admin',
      created_at: new Date().toISOString()
    });
    setLocalStorageData('digilokam_registered_users', users);
  }
}

// Helper to calculate reading time automatically from article content length (200 words per minute)
export const calculateReadingTime = (content) => {
  if (!content) return '1 min read';
  const cleanText = content.replace(/<[^>]*>/g, ''); // Strip any HTML tags
  const words = cleanText.trim().split(/\s+/).filter(Boolean);
  const minutes = Math.ceil(words.length / 200);
  return `${minutes} min read`;
};

// Helper to compress Base64 image using canvas in browser environment
const compressBase64 = (base64Str, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      } catch (err) {
        console.error("Error drawing image to canvas", err);
        resolve(null);
      }
    };
    img.onerror = (err) => {
      console.error("Failed to load image for compression", err);
      resolve(null);
    };
    img.src = base64Str;
  });
};

// Browser-based migration function
export const migrateLocalStorageToSupabase = async () => {
  if (!isSupabaseConfigured) return;
  const isMigrated = localStorage.getItem('digilokam_supabase_migrated');
  if (isMigrated === 'true') return;
  
  console.log("Starting localStorage to Supabase migration...");
  
  try {
    // 1. Migrate Categories
    const localCategories = getLocalStorageData(LOCAL_STORAGE_KEYS.CATEGORIES, []);
    if (localCategories.length > 0) {
      const { data: dbCategories } = await supabase.from('categories').select('id');
      const dbCatIds = new Set(dbCategories?.map(c => c.id) || []);
      const toInsert = localCategories.filter(c => !dbCatIds.has(c.id)).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        created_at: c.created_at || new Date().toISOString()
      }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from('categories').insert(toInsert);
        if (error) console.error("Error migrating categories:", error.message);
      }
    }
    
    // 2. Migrate Articles
    const localArticles = getLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, []);
    if (localArticles.length > 0) {
      const { data: dbArticles } = await supabase.from('articles').select('slug');
      const dbArtSlugs = new Set(dbArticles?.map(a => a.slug) || []);
      
      const toInsert = [];
      for (const art of localArticles) {
        if (!dbArtSlugs.has(art.slug)) {
          let imgUrl = art.image_url || '';
          const rawItem = {
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
          };
          toInsert.push(sanitizeArticlePayload(rawItem));
        }
      }
      if (toInsert.length > 0) {
        const { error } = await supabase.from('articles').insert(toInsert);
        if (error) console.error("Error migrating articles:", error.message);
      }
    }
    
    // 3. Migrate Subscribers
    const localSubscribers = getLocalStorageData(LOCAL_STORAGE_KEYS.SUBSCRIBERS, []);
    if (localSubscribers.length > 0) {
      const { data: dbSubscribers } = await supabase.from('subscribers').select('email');
      const dbEmails = new Set(dbSubscribers?.map(s => s.email.toLowerCase()) || []);
      const toInsert = localSubscribers.filter(s => !dbEmails.has(s.email.toLowerCase())).map(s => ({
        email: s.email.toLowerCase(),
        subscribed_at: s.subscribed_at || new Date().toISOString(),
        status: s.status || 'active'
      }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from('subscribers').insert(toInsert);
        if (error) console.error("Error migrating subscribers:", error.message);
      }
    }
    
    // 4. Migrate Contact Messages
    const localMessages = getLocalStorageData(LOCAL_STORAGE_KEYS.CONTACT_MESSAGES, []);
    if (localMessages.length > 0) {
      const toInsert = localMessages.map(m => ({
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        status: m.status || 'unread',
        created_at: m.created_at || new Date().toISOString()
      }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from('contact_messages').insert(toInsert);
        if (error) console.error("Error migrating contact messages:", error.message);
      }
    }
    
    localStorage.setItem('digilokam_supabase_migrated', 'true');
    console.log("Migration to Supabase completed successfully!");
  } catch (err) {
    console.error("Migration to Supabase failed:", err);
  }
};

// 3. Authentication Services
export const authService = {
  async signUp(userData) {
    const { email, password, full_name } = userData;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name
            }
          }
        });
        if (error) throw error;
        return data;
      } catch (e) {
        console.error("Supabase signUp error:", e);
      }
    }
    
    // Fallback
    const users = getLocalStorageData('digilokam_registered_users', []);
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email address already exists.');
    }
    const newUser = {
      id: 'user-' + Date.now(),
      email: email.toLowerCase(),
      password,
      full_name,
      role: 'user',
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    setLocalStorageData('digilokam_registered_users', users);
    return newUser;
  },

  async signIn(email, password) {
    const emailLower = email.toLowerCase();
    console.log('[Auth] signIn attempt:', emailLower);
    
    if (isSupabaseConfigured) {
      try {
        console.log('[Auth] Trying Supabase signInWithPassword...');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          // Log the real Supabase error — do NOT silently swallow it
          console.warn('[Auth] Supabase signIn error:', error.message, '— trying local fallback');
        } else if (data?.user) {
          console.log('[Auth] Supabase login success, user id:', data.user.id);
          
          // Fetch role from public.users
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role, full_name')
            .eq('id', data.user.id)
            .single();
          
          if (profileError) {
            console.warn('[Auth] Could not fetch profile from public.users:', profileError.message);
          }
          
          const role = profile?.role || data.user.user_metadata?.role || 'user';
          console.log('[Auth] Role resolved:', role);
          
          // Merge role into user object so App.jsx guard works
          const userWithRole = {
            ...data.user,
            role,
            full_name: profile?.full_name || data.user.user_metadata?.full_name || email
          };
          
          // Persist to localStorage as backup
          setLocalStorageData(LOCAL_STORAGE_KEYS.USER, userWithRole);
          
          return { user: userWithRole, role };
        }
      } catch (e) {
        console.error('[Auth] Supabase signIn exception:', e.message);
      }
    }
    
    console.log('[Auth] Falling back to local authentication...');
    
    // Fallback to local auth
    const users = getLocalStorageData('digilokam_registered_users', []);
    const matchedUser = users.find(u => u.email.toLowerCase() === emailLower && u.password === password);
    if (matchedUser) {
      console.log('[Auth] Local user matched:', matchedUser.email);
      setLocalStorageData(LOCAL_STORAGE_KEYS.USER, matchedUser);
      return { user: matchedUser, role: matchedUser.role || 'user' };
    }
    
    // Hardcoded admin fallback (always works even if Supabase is down)
    if (emailLower === 'admin@digilokam.com' && password === 'admin123') {
      console.log('[Auth] Using hardcoded admin fallback');
      const mockAdmin = {
        id: 'user-admin',
        email: 'admin@digilokam.com',
        full_name: 'Admin DigiLokam',
        role: 'admin',
        created_at: new Date().toISOString()
      };
      setLocalStorageData(LOCAL_STORAGE_KEYS.USER, mockAdmin);
      return { user: mockAdmin, role: 'admin' };
    }
    
    console.error('[Auth] All authentication methods failed');
    throw new Error('Invalid email address or password.');
  },

  async signOut() {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error(e);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    }
  },

  async getCurrentUser() {
    if (isSupabaseConfigured) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.warn('[Auth] getUser error:', userError.message);
        } else if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.warn('[Auth] getCurrentUser profile fetch error:', profileError.message);
          }
          
          const role = profile?.role || user.user_metadata?.role || 'user';
          
          return { 
            ...user, 
            role,
            full_name: profile?.full_name || user.user_metadata?.full_name 
          };
        }
      } catch (e) {
        console.error('[Auth] getCurrentUser exception:', e);
      }
    }
    // Fallback: check localStorage
    return getLocalStorageData(LOCAL_STORAGE_KEYS.USER, null);
  }
};

// 3.5 Bookmark Persistence Services
export const bookmarkService = {
  async getBookmarks(userId) {
    if (!userId) return [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('article_id')
          .eq('user_id', userId);
        if (!error) return data.map(b => b.article_id);
      } catch (e) {
        console.error(e);
      }
    }
    return getLocalStorageData(`digilokam_bookmarks_${userId}`, []);
  },

  async saveBookmarks(userId, bookmarks) {
    if (!userId) return;
    if (isSupabaseConfigured) {
      try {
        await supabase.from('bookmarks').delete().eq('user_id', userId);
        if (bookmarks.length > 0) {
          const payload = bookmarks.map(id => ({ user_id: userId, article_id: id }));
          await supabase.from('bookmarks').insert(payload);
        }
      } catch (e) {
        console.error(e);
      }
    }
    setLocalStorageData(`digilokam_bookmarks_${userId}`, bookmarks);
  }
};



// 4. Articles Database Services
export const articleService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(art => ({
            ...art,
            published_at: art.created_at,
            updated_at: art.updated_at || art.created_at,
            reading_time: art.read_time || calculateReadingTime(art.content)
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const articles = getLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, defaultArticles);
    const mapped = articles.map(art => ({
      ...art,
      published_at: art.published_at || art.created_at || new Date().toISOString(),
      updated_at: art.updated_at || art.created_at || new Date().toISOString(),
      reading_time: calculateReadingTime(art.content)
    }));
    return [...mapped].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  },

  async getBySlug(slug) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .single();
        if (!error && data) {
          supabase.rpc('increment_views', { article_id: data.id }).then();
          return {
            ...data,
            published_at: data.created_at,
            updated_at: data.updated_at || data.created_at,
            reading_time: data.read_time || calculateReadingTime(data.content)
          };
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const articles = getLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, defaultArticles);
    const articleIndex = articles.findIndex(a => a.slug === slug);
    if (articleIndex !== -1) {
      const article = articles[articleIndex];
      article.views = (article.views || 0) + 1;
      setLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, articles);
      return {
        ...article,
        published_at: article.published_at || article.created_at || new Date().toISOString(),
        updated_at: article.updated_at || article.created_at || new Date().toISOString(),
        reading_time: calculateReadingTime(article.content)
      };
    }
    return null;
  },

  async save(articleData) {
    const reading_time = calculateReadingTime(articleData.content);
    const nowStr = new Date().toISOString();
    
    if (isSupabaseConfigured) {
      try {
        const currentUser = await authService.getCurrentUser();
        const rawPayload = { 
          ...articleData, 
          author_id: currentUser?.id,
          updated_at: nowStr
        };
        rawPayload.reading_time = rawPayload.reading_time || reading_time;

        // Strip non-existent columns (like published_at or reading_time)
        const payload = sanitizeArticlePayload(rawPayload);
        
        console.log("[Database] Final image_url saved to database:", payload.image_url);

        if (payload.id && !payload.id.startsWith('art-')) {
          const { data, error } = await supabase
            .from('articles')
            .update(payload)
            .eq('id', payload.id)
            .select()
            .single();
          if (error) throw error;
          return {
            ...data,
            published_at: data.created_at,
            reading_time: data.read_time || reading_time
          };
        } else {
          // If editing a seed item that had a mock id, strip the string id
          if (payload.id && payload.id.startsWith('art-')) {
            delete payload.id;
          }
          const { data, error } = await supabase
            .from('articles')
            .insert([payload])
            .select()
            .single();
          if (error) throw error;
          return {
            ...data,
            published_at: data.created_at,
            reading_time: data.read_time || reading_time
          };
        }
      } catch (e) {
        console.error("Supabase save error:", e);
        throw e;
      }
    }
    
    // Fallback
    const articles = getLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, defaultArticles);
    if (articleData.id) {
      const index = articles.findIndex(a => a.id === articleData.id);
      if (index !== -1) {
        articles[index] = { 
          ...articles[index], 
          ...articleData, 
          reading_time,
          updated_at: nowStr 
        };
        setLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, articles);
        return articles[index];
      }
    } else {
      const newArticle = {
        ...articleData,
        id: 'art-' + Date.now(),
        views: 0,
        author_name: 'അഡ്മിൻ ഡിജിലോകം',
        reading_time,
        published_at: nowStr,
        created_at: nowStr,
        updated_at: nowStr
      };
      articles.push(newArticle);
      setLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, articles);
      return newArticle;
    }
  },

  async delete(id) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('articles')
          .delete()
          .eq('id', id);
        if (!error) return;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const articles = getLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, defaultArticles);
    const updated = articles.filter(a => a.id !== id);
    setLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, updated);
  },

  async incrementViews(id) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('increment_views', { article_id: id });
        if (error) console.error("Error incrementing views:", error.message);
      } catch (e) {
        console.error("Increment views exception:", e);
      }
    }
  }
};

// 5. Categories Database Services
export const categoryService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('id', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.error(e);
      }
    }
    return getLocalStorageData(LOCAL_STORAGE_KEYS.CATEGORIES, defaultCategories);
  },

  async save(categoryData) {
    if (isSupabaseConfigured) {
      try {
        if (categoryData.id) {
          const { data, error } = await supabase
            .from('categories')
            .update(categoryData)
            .eq('id', categoryData.id)
            .select()
            .single();
          if (!error) return data;
        } else {
          const { data, error } = await supabase
            .from('categories')
            .insert([categoryData])
            .select()
            .single();
          if (!error) return data;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const categories = getLocalStorageData(LOCAL_STORAGE_KEYS.CATEGORIES, defaultCategories);
    if (categoryData.id) {
      const index = categories.findIndex(c => c.id === categoryData.id);
      if (index !== -1) {
        categories[index] = { ...categories[index], ...categoryData };
        setLocalStorageData(LOCAL_STORAGE_KEYS.CATEGORIES, categories);
        return categories[index];
      }
    } else {
      const newCat = {
        ...categoryData,
        id: Math.max(...categories.map(c => c.id), 0) + 1
      };
      categories.push(newCat);
      setLocalStorageData(LOCAL_STORAGE_KEYS.CATEGORIES, categories);
      return newCat;
    }
  },

  async delete(id) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);
        if (!error) return;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const categories = getLocalStorageData(LOCAL_STORAGE_KEYS.CATEGORIES, defaultCategories);
    const updated = categories.filter(c => c.id !== id);
    setLocalStorageData(LOCAL_STORAGE_KEYS.CATEGORIES, updated);
    
    const articles = getLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, defaultArticles);
    articles.forEach(a => {
      if (a.category_id === id) a.category_id = null;
    });
    setLocalStorageData(LOCAL_STORAGE_KEYS.ARTICLES, articles);
  }
};

// 6. Comments Database Services
export const commentService = {
  async getByArticleId(articleId) {
    if (isSupabaseConfigured && !articleId.startsWith('art-')) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('article_id', articleId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const comments = getLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, defaultComments);
    return comments
      .filter(c => c.article_id === articleId && c.status === 'approved')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getAll() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error("[Comments] Error fetching comments:", error);
        throw error;
      }
      return data;
    }
    const comments = getLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, defaultComments);
    return comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async add(commentData) {
    const payload = {
      ...commentData,
      status: 'pending'
    };
    
    if (isSupabaseConfigured && !commentData.article_id.startsWith('art-')) {
      const { data, error } = await supabase
        .from('comments')
        .insert([payload])
        .select()
        .single();
      if (error) {
        console.error("[Comments] Error adding comment:", error);
        throw error;
      }
      return data;
    }
    
    // Fallback
    const comments = getLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, defaultComments);
    const newComment = {
      ...payload,
      id: 'comm-' + Date.now(),
      created_at: new Date().toISOString()
    };
    comments.push(newComment);
    setLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, comments);
    return newComment;
  },

  async approve(id) {
    if (isSupabaseConfigured && !id.startsWith('comm-')) {
      const { error } = await supabase
        .from('comments')
        .update({ status: 'approved' })
        .eq('id', id);
      if (error) {
        console.error("[Comments] Error approving comment:", error);
        throw error;
      }
      return;
    }
    
    // Fallback
    const comments = getLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, defaultComments);
    const index = comments.findIndex(c => c.id === id);
    if (index !== -1) {
      comments[index].status = 'approved';
      setLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, comments);
    }
  },

  async reject(id) {
    if (isSupabaseConfigured && !id.startsWith('comm-')) {
      const { error } = await supabase
        .from('comments')
        .update({ status: 'rejected' })
        .eq('id', id);
      if (error) {
        console.error("[Comments] Error rejecting comment:", error);
        throw error;
      }
      return;
    }
    
    // Fallback
    const comments = getLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, defaultComments);
    const index = comments.findIndex(c => c.id === id);
    if (index !== -1) {
      comments[index].status = 'rejected';
      setLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, comments);
    }
  },

  async delete(id) {
    if (isSupabaseConfigured && !id.startsWith('comm-')) {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);
      if (error) {
        console.error("[Comments] Error deleting comment:", error);
        throw error;
      }
      return;
    }
    
    // Fallback
    const comments = getLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, defaultComments);
    const updated = comments.filter(c => c.id !== id);
    setLocalStorageData(LOCAL_STORAGE_KEYS.COMMENTS, updated);
  }
};

// 6.5 Contact Message Database Services
export const contactMessageService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error(e);
      }
    }
    return getLocalStorageData(LOCAL_STORAGE_KEYS.CONTACT_MESSAGES, []);
  },

  async add(messageData) {
    const payload = {
      ...messageData,
      status: 'unread',
      created_at: new Date().toISOString()
    };
    
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .insert([payload])
          .select()
          .single();
        if (!error) return data;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const messages = getLocalStorageData(LOCAL_STORAGE_KEYS.CONTACT_MESSAGES, []);
    const newMsg = {
      ...payload,
      id: 'msg-' + Date.now()
    };
    messages.push(newMsg);
    setLocalStorageData(LOCAL_STORAGE_KEYS.CONTACT_MESSAGES, messages);
    return newMsg;
  },

  async markAsRead(id) {
    if (isSupabaseConfigured && !id.startsWith('msg-')) {
      try {
        const { error } = await supabase
          .from('contact_messages')
          .update({ status: 'read' })
          .eq('id', id);
        if (!error) return;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const messages = getLocalStorageData(LOCAL_STORAGE_KEYS.CONTACT_MESSAGES, []);
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].status = 'read';
      setLocalStorageData(LOCAL_STORAGE_KEYS.CONTACT_MESSAGES, messages);
    }
  },

  async delete(id) {
    if (isSupabaseConfigured && !id.startsWith('msg-')) {
      try {
        const { error } = await supabase
          .from('contact_messages')
          .delete()
          .eq('id', id);
        if (!error) return;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const messages = getLocalStorageData(LOCAL_STORAGE_KEYS.CONTACT_MESSAGES, []);
    const updated = messages.filter(m => m.id !== id);
    setLocalStorageData(LOCAL_STORAGE_KEYS.CONTACT_MESSAGES, updated);
  }
};

// 6.7 User Management Database Services
export const userService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error(e);
      }
    }
    return getLocalStorageData('digilokam_registered_users', []);
  },

  async delete(id) {
    if (isSupabaseConfigured && !id.startsWith('user-')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);
        if (!error) return;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const users = getLocalStorageData('digilokam_registered_users', []);
    const updated = users.filter(u => u.id !== id);
    setLocalStorageData('digilokam_registered_users', updated);
  },

  async updateRole(id, role) {
    if (isSupabaseConfigured && !id.startsWith('user-')) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ role })
          .eq('id', id);
        if (!error) return;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const users = getLocalStorageData('digilokam_registered_users', []);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index].role = role;
      setLocalStorageData('digilokam_registered_users', users);
    }
  }
};

// 7. Settings (Ads config) Services
export const settingsService = {
  async get() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'ads_config')
          .single();
        if (!error && data) return data.value;
      } catch (e) {
        console.error(e);
      }
    }
    return getLocalStorageData(LOCAL_STORAGE_KEYS.SETTINGS, defaultSettings);
  },

  async save(settingsData) {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert({ key: 'ads_config', value: settingsData, updated_at: new Date() });
        if (!error) return settingsData;
      } catch (e) {
        console.error(e);
      }
    }
    setLocalStorageData(LOCAL_STORAGE_KEYS.SETTINGS, settingsData);
    return settingsData;
  }
};

// 8. Subscribers Database Services
export const subscriberService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('subscribers')
          .select('*')
          .order('subscribed_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error(e);
      }
    }
    return getLocalStorageData(LOCAL_STORAGE_KEYS.SUBSCRIBERS, []);
  },

  async add(email) {
    const emailClean = email.trim().toLowerCase();
    if (!emailClean) throw new Error('Please enter a valid email address.');
    
    if (isSupabaseConfigured) {
      try {
        const { data: existing } = await supabase
          .from('subscribers')
          .select('id')
          .eq('email', emailClean)
          .maybeSingle();
        if (existing) {
          throw new Error('This email address is already subscribed.');
        }

        const { data, error } = await supabase
          .from('subscribers')
          .insert([{ email: emailClean, subscribed_at: new Date().toISOString(), status: 'active' }])
          .select()
          .single();
        if (!error) return data;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const subs = getLocalStorageData(LOCAL_STORAGE_KEYS.SUBSCRIBERS, []);
    if (subs.some(s => s.email === emailClean)) {
      throw new Error('This email address is already subscribed.');
    }
    const newSub = {
      id: 'sub-' + Date.now(),
      email: emailClean,
      subscribed_at: new Date().toISOString(),
      status: 'active'
    };
    subs.push(newSub);
    setLocalStorageData(LOCAL_STORAGE_KEYS.SUBSCRIBERS, subs);
    return newSub;
  },

  async delete(id) {
    if (isSupabaseConfigured && !id.startsWith('sub-')) {
      try {
        const { error } = await supabase
          .from('subscribers')
          .delete()
          .eq('id', id);
        if (!error) return;
      } catch (e) {
        console.error(e);
      }
    }
    
    // Fallback
    const subs = getLocalStorageData(LOCAL_STORAGE_KEYS.SUBSCRIBERS, []);
    const updated = subs.filter(s => s.id !== id);
    setLocalStorageData(LOCAL_STORAGE_KEYS.SUBSCRIBERS, updated);
  }
};

// 9. Image Storage Services (Supabase Storage)
// 9. Image Storage Services (Supabase Storage)
export const storageService = {
  async uploadArticleImage(file) {
    console.log("[Storage] Uploading file:", file.name, "size:", file.size);
    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `articles/${fileName}`;

        const { data, error } = await supabase.storage
          .from('article-images')
          .upload(filePath, file);

        if (error) {
          console.error("[Storage] Supabase upload error:", error);
          throw error;
        }

        console.log("[Storage] Upload success:", data);

        const { data: { publicUrl } } = supabase.storage
          .from('article-images')
          .getPublicUrl(filePath);

        console.log("[Storage] Public URL generated:", publicUrl);
        return publicUrl;
      } catch (e) {
        console.error("[Storage] Upload exception:", e);
        throw e;
      }
    }
    throw new Error("Supabase is not configured. Upload unavailable.");
  }
};

// 10. Newsletter Campaigns Services
export const campaignService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('newsletter_campaigns')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error("Error fetching campaigns:", e);
      }
    }
    return getLocalStorageData('digilokam_newsletter_campaigns', []);
  },

  async add(campaignData) {
    const payload = {
      ...campaignData,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('newsletter_campaigns')
          .insert([payload])
          .select()
          .single();
        if (!error) return data;
        throw error;
      } catch (e) {
        console.error("Error creating campaign:", e);
        throw e;
      }
    }
    // Fallback
    const campaigns = getLocalStorageData('digilokam_newsletter_campaigns', []);
    const newCampaign = {
      ...payload,
      id: 'camp-' + Date.now()
    };
    campaigns.push(newCampaign);
    setLocalStorageData('digilokam_newsletter_campaigns', campaigns);
    return newCampaign;
  }
};

// 11. Centralized Error Logging Services
export const errorLogService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('error_logs')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error("Error fetching error logs:", e);
      }
    }
    return getLocalStorageData('digilokam_error_logs', []);
  },

  async log(message, stack = '', component = '') {
    const payload = {
      error_message: message,
      error_stack: stack,
      component: component,
      created_at: new Date().toISOString()
    };
    console.error(`[Centralized Log] ${component ? `[${component}] ` : ''}${message}`, stack);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('error_logs')
          .insert([payload])
          .select()
          .single();
        if (!error) return data;
      } catch (e) {
        console.error("Error saving error log to DB:", e);
      }
    }
    // Fallback
    const logs = getLocalStorageData('digilokam_error_logs', []);
    const newLog = {
      ...payload,
      id: 'log-' + Date.now()
    };
    logs.push(newLog);
    setLocalStorageData('digilokam_error_logs', logs);
    return newLog;
  }
};

// 12. Media Library Services
export const mediaLibraryService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('media_library')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error("Error fetching media library:", e);
      }
    }
    return getLocalStorageData('digilokam_media_library', []);
  },

  async add(mediaData) {
    const payload = {
      ...mediaData,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured) {
      try {
        const currentUser = await authService.getCurrentUser();
        payload.uploaded_by = currentUser?.id;
        const { data, error } = await supabase
          .from('media_library')
          .insert([payload])
          .select()
          .single();
        if (!error) return data;
        throw error;
      } catch (e) {
        console.error("Error adding to media library:", e);
        throw e;
      }
    }
    // Fallback
    const media = getLocalStorageData('digilokam_media_library', []);
    const newMedia = {
      ...payload,
      id: 'med-' + Date.now()
    };
    media.push(newMedia);
    setLocalStorageData('digilokam_media_library', media);
    return newMedia;
  },

  async delete(id) {
    if (isSupabaseConfigured && !id.startsWith('med-')) {
      try {
        const { error } = await supabase
          .from('media_library')
          .delete()
          .eq('id', id);
        if (!error) return;
        throw error;
      } catch (e) {
        console.error("Error deleting media:", e);
        throw e;
      }
    }
    // Fallback
    const media = getLocalStorageData('digilokam_media_library', []);
    const updated = media.filter(m => m.id !== id);
    setLocalStorageData('digilokam_media_library', updated);
  }
};

// 13. Notifications Services
export const notificationService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) return [];
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error("Error fetching notifications:", e);
      }
    }
    // Fallback
    return getLocalStorageData('digilokam_notifications', []);
  },

  async add(notificationData) {
    const payload = {
      ...notificationData,
      is_read: false,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert([payload])
          .select()
          .single();
        if (!error) return data;
        throw error;
      } catch (e) {
        console.error("Error creating notification:", e);
        throw e;
      }
    }
    // Fallback
    const notifications = getLocalStorageData('digilokam_notifications', []);
    const newNotification = {
      ...payload,
      id: 'notif-' + Date.now()
    };
    notifications.push(newNotification);
    setLocalStorageData('digilokam_notifications', notifications);
    return newNotification;
  },

  async sendToAdmins(title, message, type) {
    if (isSupabaseConfigured) {
      try {
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin');
        if (admins && admins.length > 0) {
          const payloads = admins.map(admin => ({
            user_id: admin.id,
            title,
            message,
            type,
            is_read: false,
            created_at: new Date().toISOString()
          }));
          await supabase.from('notifications').insert(payloads);
          return;
        }
      } catch (e) {
        console.error("Error sending admin notifications:", e);
      }
    }
    // Fallback
    const notifications = getLocalStorageData('digilokam_notifications', []);
    const newNotification = {
      id: 'notif-' + Date.now(),
      user_id: 'user-admin',
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    };
    notifications.push(newNotification);
    setLocalStorageData('digilokam_notifications', notifications);
  },

  async markAsRead(id) {
    if (isSupabaseConfigured && !id.startsWith('notif-')) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
        if (!error) return;
      } catch (e) {
        console.error("Error marking notification read:", e);
      }
    }
    // Fallback
    const notifications = getLocalStorageData('digilokam_notifications', []);
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].is_read = true;
      setLocalStorageData('digilokam_notifications', notifications);
    }
  },

  async delete(id) {
    if (isSupabaseConfigured && !id.startsWith('notif-')) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
        if (!error) return;
      } catch (e) {
        console.error("Error deleting notification:", e);
      }
    }
    // Fallback
    const notifications = getLocalStorageData('digilokam_notifications', []);
    const updated = notifications.filter(n => n.id !== id);
    setLocalStorageData('digilokam_notifications', updated);
  }
};

// 14. Affiliate Links Services
export const affiliateService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('affiliate_links')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error("Error fetching affiliate links:", e);
      }
    }
    return getLocalStorageData('digilokam_affiliate_links', []);
  },

  async save(linkData) {
    const payload = { ...linkData };
    if (isSupabaseConfigured) {
      try {
        if (payload.id && !payload.id.startsWith('aff-')) {
          const { data, error } = await supabase
            .from('affiliate_links')
            .update(payload)
            .eq('id', payload.id)
            .select()
            .single();
          if (!error) return data;
          throw error;
        } else {
          if (payload.id) delete payload.id;
          const { data, error } = await supabase
            .from('affiliate_links')
            .insert([payload])
            .select()
            .single();
          if (!error) return data;
          throw error;
        }
      } catch (e) {
        console.error("Error saving affiliate link:", e);
        throw e;
      }
    }
    // Fallback
    const links = getLocalStorageData('digilokam_affiliate_links', []);
    if (linkData.id) {
      const index = links.findIndex(l => l.id === linkData.id);
      if (index !== -1) {
        links[index] = { ...links[index], ...linkData };
        setLocalStorageData('digilokam_affiliate_links', links);
        return links[index];
      }
    } else {
      const newLink = {
        ...linkData,
        id: 'aff-' + Date.now(),
        clicks: 0,
        created_at: new Date().toISOString()
      };
      links.push(newLink);
      setLocalStorageData('digilokam_affiliate_links', links);
      return newLink;
    }
  },

  async delete(id) {
    if (isSupabaseConfigured && !id.startsWith('aff-')) {
      try {
        const { error } = await supabase
          .from('affiliate_links')
          .delete()
          .eq('id', id);
        if (!error) return;
        throw error;
      } catch (e) {
        console.error("Error deleting affiliate link:", e);
        throw e;
      }
    }
    // Fallback
    const links = getLocalStorageData('digilokam_affiliate_links', []);
    const updated = links.filter(l => l.id !== id);
    setLocalStorageData('digilokam_affiliate_links', updated);
  },

  async trackClick(slug) {
    if (isSupabaseConfigured) {
      try {
        const { data: link } = await supabase
          .from('affiliate_links')
          .select('id, clicks')
          .eq('slug', slug)
          .single();
        if (link) {
          await supabase
            .from('affiliate_links')
            .update({ clicks: (link.clicks || 0) + 1 })
            .eq('id', link.id);
        }
      } catch (e) {
        console.error("Error tracking affiliate click on DB:", e);
      }
    }
    // Fallback
    const links = getLocalStorageData('digilokam_affiliate_links', []);
    const index = links.findIndex(l => l.slug === slug);
    if (index !== -1) {
      links[index].clicks = (links[index].clicks || 0) + 1;
      setLocalStorageData('digilokam_affiliate_links', links);
    }
  }
};

// 15. Google Web Stories Services
export const webStoryService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('web_stories')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error("Error fetching web stories:", e);
      }
    }
    return getLocalStorageData('digilokam_web_stories', []);
  },

  async save(storyData) {
    const payload = { ...storyData };
    if (isSupabaseConfigured) {
      try {
        const currentUser = await authService.getCurrentUser();
        payload.author_id = currentUser?.id;
        
        if (payload.id && !payload.id.startsWith('story-')) {
          const { data, error } = await supabase
            .from('web_stories')
            .update(payload)
            .eq('id', payload.id)
            .select()
            .single();
          if (!error) return data;
          throw error;
        } else {
          if (payload.id) delete payload.id;
          const { data, error } = await supabase
            .from('web_stories')
            .insert([payload])
            .select()
            .single();
          if (!error) return data;
          throw error;
        }
      } catch (e) {
        console.error("Error saving web story:", e);
        throw e;
      }
    }
    // Fallback
    const stories = getLocalStorageData('digilokam_web_stories', []);
    if (storyData.id) {
      const index = stories.findIndex(s => s.id === storyData.id);
      if (index !== -1) {
        stories[index] = { ...stories[index], ...storyData };
        setLocalStorageData('digilokam_web_stories', stories);
        return stories[index];
      }
    } else {
      const newStory = {
        ...storyData,
        id: 'story-' + Date.now(),
        created_at: new Date().toISOString()
      };
      stories.push(newStory);
      setLocalStorageData('digilokam_web_stories', stories);
      return newStory;
    }
  },

  async delete(id) {
    if (isSupabaseConfigured && !id.startsWith('story-')) {
      try {
        const { error } = await supabase
          .from('web_stories')
          .delete()
          .eq('id', id);
        if (!error) return;
        throw error;
      } catch (e) {
        console.error("Error deleting web story:", e);
        throw e;
      }
    }
    // Fallback
    const stories = getLocalStorageData('digilokam_web_stories', []);
    const updated = stories.filter(s => s.id !== id);
    setLocalStorageData('digilokam_web_stories', updated);
  }
};

// 16. Social Publishing Logs Services
export const socialPublishService = {
  async getAll() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('social_publish_logs')
          .select('*')
          .order('shared_at', { ascending: false });
        if (!error) return data;
      } catch (e) {
        console.error("Error fetching social publish logs:", e);
      }
    }
    return getLocalStorageData('digilokam_social_publish_logs', []);
  },

  async add(logData) {
    const payload = {
      ...logData,
      shared_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && !logData.article_id.startsWith('art-')) {
      try {
        const { data, error } = await supabase
          .from('social_publish_logs')
          .insert([payload])
          .select()
          .single();
        if (!error) return data;
        throw error;
      } catch (e) {
        console.error("Error creating social publish log:", e);
      }
    }
    // Fallback
    const logs = getLocalStorageData('digilokam_social_publish_logs', []);
    const newLog = {
      ...payload,
      id: 'soc-' + Date.now()
    };
    logs.push(newLog);
    setLocalStorageData('digilokam_social_publish_logs', logs);
    return newLog;
  }
};


