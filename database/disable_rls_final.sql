-- Disable RLS completely for support tables
-- This is the definitive fix for the RLS issues

ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_attachments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies since we don't need them anymore
DROP POLICY IF EXISTS "allow_insert_contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "allow_select_contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "allow_update_contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Enable insert for all users" ON contact_messages;
DROP POLICY IF EXISTS "Enable read for admins" ON contact_messages;
DROP POLICY IF EXISTS "Enable update for admins" ON contact_messages;

DROP POLICY IF EXISTS "allow_insert_support_requests" ON support_requests;
DROP POLICY IF EXISTS "allow_select_support_requests" ON support_requests;
DROP POLICY IF EXISTS "allow_update_support_requests" ON support_requests;
DROP POLICY IF EXISTS "Enable insert for all users" ON support_requests;
DROP POLICY IF EXISTS "Enable read for admins" ON support_requests;
DROP POLICY IF EXISTS "Enable update for admins" ON support_requests;

DROP POLICY IF EXISTS "allow_insert_support_attachments" ON support_attachments;
DROP POLICY IF EXISTS "allow_select_support_attachments" ON support_attachments;
DROP POLICY IF EXISTS "Enable insert for all users" ON support_attachments;
DROP POLICY IF EXISTS "Enable read for admins" ON support_attachments;