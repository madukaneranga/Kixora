-- Fix RLS policies for support tables
-- This will allow anonymous users to submit forms

-- Drop all existing policies first
DROP POLICY IF EXISTS "Enable insert for all users" ON contact_messages;
DROP POLICY IF EXISTS "Enable read for admins" ON contact_messages;
DROP POLICY IF EXISTS "Enable update for admins" ON contact_messages;

DROP POLICY IF EXISTS "Enable insert for all users" ON support_requests;
DROP POLICY IF EXISTS "Enable read for admins" ON support_requests;
DROP POLICY IF EXISTS "Enable update for admins" ON support_requests;

DROP POLICY IF EXISTS "Enable insert for all users" ON support_attachments;
DROP POLICY IF EXISTS "Enable read for admins" ON support_attachments;

-- Create simple, permissive policies that definitely work
CREATE POLICY "allow_insert_contact_messages" ON contact_messages
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "allow_select_contact_messages" ON contact_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "allow_update_contact_messages" ON contact_messages
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "allow_insert_support_requests" ON support_requests
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "allow_select_support_requests" ON support_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "allow_update_support_requests" ON support_requests
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "allow_insert_support_attachments" ON support_attachments
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "allow_select_support_attachments" ON support_attachments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Alternative: If the above still doesn't work, uncomment this to disable RLS entirely
-- ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE support_requests DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE support_attachments DISABLE ROW LEVEL SECURITY;