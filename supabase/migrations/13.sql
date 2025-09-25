-- Create announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0, -- Higher priority announcements show first
  start_date timestamptz DEFAULT now(),
  end_date timestamptz, -- Optional end date for announcement
  background_color text DEFAULT '#000000',
  text_color text DEFAULT '#ffffff',
  link_url text, -- Optional link when announcement is clicked
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_priority ON announcements(priority DESC);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing of active announcements
CREATE POLICY "Anyone can view active announcements" ON announcements
  FOR SELECT USING (
    is_active = true
    AND start_date <= now()
    AND (end_date IS NULL OR end_date >= now())
  );


-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER announcements_updated_at_trigger
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

-- Insert a default announcement
INSERT INTO announcements (title, message, priority, background_color, text_color)
VALUES (
  'Welcome to Kixora',
  '🚚 Island-wide delivery available across Sri Lanka',
  1,
  '#000000',
  '#ffffff'
);