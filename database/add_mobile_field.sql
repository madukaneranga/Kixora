-- Add mobile field to contact_messages and support_requests tables

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS mobile TEXT;