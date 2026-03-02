
-- Table to persist Nanda chat history per user
CREATE TABLE public.nanda_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX idx_nanda_messages_user_id ON public.nanda_messages (user_id, created_at);

-- Enable RLS
ALTER TABLE public.nanda_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own messages
CREATE POLICY "Users can view their own nanda messages"
ON public.nanda_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nanda messages"
ON public.nanda_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nanda messages"
ON public.nanda_messages FOR DELETE
USING (auth.uid() = user_id);
