-- Supabase Comments Update RLS Policy
-- Run this in your Supabase SQL Editor to allow admins to approve/reject comments.

-- 1. Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Only admins can update comments" ON public.comments;

-- 2. Create the update policy for admins
CREATE POLICY "Only admins can update comments" ON public.comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Output confirmation
SELECT 'Comments update policy created successfully' as status;
