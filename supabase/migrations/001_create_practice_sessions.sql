-- Create practice_sessions table for storing user practice data
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL,
  category TEXT NOT NULL,
  metrics JSONB NOT NULL,
  transcript TEXT,
  speech_analysis JSONB,
  content_analysis JSONB,
  feedback TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_category ON practice_sessions(category);

-- Enable Row Level Security (RLS)
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only access their own sessions
CREATE POLICY "Users can view their own practice sessions" ON practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions" ON practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions" ON practice_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own practice sessions" ON practice_sessions
  FOR DELETE USING (auth.uid() = user_id);
