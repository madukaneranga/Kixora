-- Create newsletter subscribers table
CREATE TABLE newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  is_active boolean DEFAULT true,
  source text DEFAULT 'footer', -- Track where they subscribed from
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL, -- Optional link to user account
  unsubscribe_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);
CREATE INDEX idx_newsletter_subscribers_token ON newsletter_subscribers(unsubscribe_token);

-- Enable Row Level Security
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for public subscription (insert only)
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Create policy for viewing own subscription (if logged in)
CREATE POLICY "Users can view their own subscription" ON newsletter_subscribers
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for unsubscribing
CREATE POLICY "Anyone can unsubscribe with token" ON newsletter_subscribers
  FOR UPDATE USING (true);

-- Create function to handle subscription
CREATE OR REPLACE FUNCTION subscribe_to_newsletter(
  p_email text,
  p_source text DEFAULT 'footer',
  p_user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscriber_id uuid;
  v_existing_subscriber newsletter_subscribers%ROWTYPE;
BEGIN
  -- Check if email already exists
  SELECT * INTO v_existing_subscriber
  FROM newsletter_subscribers
  WHERE email = p_email;

  IF v_existing_subscriber.id IS NOT NULL THEN
    -- If they were previously unsubscribed, reactivate them
    IF NOT v_existing_subscriber.is_active THEN
      UPDATE newsletter_subscribers
      SET
        is_active = true,
        unsubscribed_at = NULL,
        subscribed_at = now(),
        source = p_source,
        user_id = COALESCE(p_user_id, user_id),
        updated_at = now()
      WHERE id = v_existing_subscriber.id;

      RETURN json_build_object(
        'success', true,
        'message', 'Successfully resubscribed to newsletter',
        'subscriber_id', v_existing_subscriber.id,
        'action', 'resubscribed'
      );
    ELSE
      RETURN json_build_object(
        'success', false,
        'message', 'Email is already subscribed to newsletter',
        'subscriber_id', v_existing_subscriber.id,
        'action', 'already_subscribed'
      );
    END IF;
  ELSE
    -- Create new subscription
    INSERT INTO newsletter_subscribers (email, source, user_id)
    VALUES (p_email, p_source, p_user_id)
    RETURNING id INTO v_subscriber_id;

    RETURN json_build_object(
      'success', true,
      'message', 'Successfully subscribed to newsletter',
      'subscriber_id', v_subscriber_id,
      'action', 'subscribed'
    );
  END IF;
END;
$$;