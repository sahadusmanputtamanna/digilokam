-- DigiLokam Phase 4 Database Setup
-- Run this in your Supabase SQL Editor to support Phase 4 features:
-- Sponsored content flags, affiliate link tracking, Google Web Stories, and social sharing logs.

-- 1. Extend Articles table with Sponsored Content fields
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS sponsor_name TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS sponsor_logo TEXT;

-- 2. Create Affiliate Links Table
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    target_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Affiliate Links
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

-- Affiliate Links Policies
DROP POLICY IF EXISTS "Affiliate links viewable by everyone" ON public.affiliate_links;
DROP POLICY IF EXISTS "Admins can manage affiliate links" ON public.affiliate_links;

CREATE POLICY "Affiliate links viewable by everyone" ON public.affiliate_links 
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage affiliate links" ON public.affiliate_links 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Create Google Web Stories Table
CREATE TABLE IF NOT EXISTS public.web_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    cover_url TEXT NOT NULL,
    pages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of pages: { image_url, text }
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Web Stories
ALTER TABLE public.web_stories ENABLE ROW LEVEL SECURITY;

-- Web Stories Policies
DROP POLICY IF EXISTS "Web stories viewable by everyone" ON public.web_stories;
DROP POLICY IF EXISTS "Authenticated users can create stories" ON public.web_stories;
DROP POLICY IF EXISTS "Admins can delete stories" ON public.web_stories;

CREATE POLICY "Web stories viewable by everyone" ON public.web_stories 
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create stories" ON public.web_stories 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete stories" ON public.web_stories 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Create Social Publishing Logs Table
CREATE TABLE IF NOT EXISTS public.social_publish_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'twitter', 'facebook', etc.
    status TEXT NOT NULL, -- 'success', 'failed'
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Social Logs
ALTER TABLE public.social_publish_logs ENABLE ROW LEVEL SECURITY;

-- Social Logs Policies
DROP POLICY IF EXISTS "Social logs viewable by admins" ON public.social_publish_logs;
CREATE POLICY "Social logs viewable by admins" ON public.social_publish_logs 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
