
-- Update existing support_requests to link with users based on email
-- This will only work if the email in support_requests matches a user's email
UPDATE support_requests
SET user_id = auth.users.id
FROM auth.users
WHERE support_requests.email = auth.users.email
AND support_requests.user_id IS NULL;

-- Create index for better performance when querying by user_id
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON support_requests(user_id);

-- Create index for better performance when querying by status and user_id
CREATE INDEX IF NOT EXISTS idx_support_requests_user_status ON support_requests(user_id, status);