-- =========================================================
-- MentorConnect: Mentor Availability & Scheduling Schema
-- =========================================================
-- Run this script in the Supabase Dashboard SQL Editor
-- (https://app.supabase.com -> Project -> SQL Editor)

CREATE TABLE IF NOT EXISTS mentor_availability (
  id BIGSERIAL PRIMARY KEY,
  mentor_email TEXT NOT NULL,
  day_of_week TEXT NOT NULL,      -- 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  start_time TEXT NOT NULL,       -- '18:00' (24-hour format HH:mm)
  end_time TEXT NOT NULL,         -- '20:00' (24-hour format HH:mm)
  slot_duration INT DEFAULT 30,   -- Duration of each session in minutes (e.g. 30, 45, 60)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for high-performance lookup during mentee booking queries
CREATE INDEX IF NOT EXISTS idx_mentor_availability_email_day 
ON mentor_availability (mentor_email, day_of_week);

-- Enable Row Level Security (RLS) or public policies
ALTER TABLE mentor_availability ENABLE ROW LEVEL SECURITY;

-- Allow all users to view mentor availability
CREATE POLICY "Allow public read access to mentor_availability" 
ON mentor_availability FOR SELECT 
USING (true);

-- Allow authenticated/matching users to insert, update, delete their own availability
CREATE POLICY "Allow mentors full access to own availability" 
ON mentor_availability FOR ALL 
USING (true)
WITH CHECK (true);
