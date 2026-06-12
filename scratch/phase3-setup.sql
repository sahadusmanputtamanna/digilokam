-- DigiLokam Phase 3 Database Setup
-- Run this in your Supabase SQL Editor to support Phase 3 features:
-- Multi-author bio, media library tracking, scheduled publishing, and admin notification system.

-- 1. Extend Users Table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Extend role CHECK constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'editor', 'author', 'contributor'));

-- 2. Add published_at column to Articles for scheduled publishing
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- 3. Create Media Library Table
CREATE TABLE IF NOT EXISTS public.media_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Media Library
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Media Library RLS Policies
DROP POLICY IF EXISTS "Media viewable by everyone" ON public.media_library;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON public.media_library;
DROP POLICY IF EXISTS "Admins or owners can delete media" ON public.media_library;

CREATE POLICY "Media viewable by everyone" ON public.media_library 
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload media" ON public.media_library 
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins or owners can delete media" ON public.media_library 
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        ) OR uploaded_by = auth.uid()
    );

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'comment', 'message', 'system'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS Policies
DROP POLICY IF EXISTS "Notifications viewable by owner" ON public.notifications;
DROP POLICY IF EXISTS "Notifications updateable by owner" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;

CREATE POLICY "Notifications viewable by owner" ON public.notifications 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Notifications updateable by owner" ON public.notifications 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert notifications" ON public.notifications 
    FOR INSERT WITH CHECK (true);
