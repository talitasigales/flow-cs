
-- 1. Create tables first (no RLS policies yet)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL DEFAULT 'direct',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

-- 2. Security definer function
CREATE OR REPLACE FUNCTION public.is_chat_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  )
$$;

-- 3. Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Participants can view conversations"
  ON public.chat_conversations FOR SELECT
  USING (public.is_chat_participant(id, auth.uid()));

CREATE POLICY "Authenticated can create conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants can view participants"
  ON public.chat_participants FOR SELECT
  USING (public.is_chat_participant(conversation_id, auth.uid()));

CREATE POLICY "Authenticated can insert participants"
  ON public.chat_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own participation"
  ON public.chat_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Participants can view messages"
  ON public.chat_messages FOR SELECT
  USING (public.is_chat_participant(conversation_id, auth.uid()));

CREATE POLICY "Participants can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_chat_participant(conversation_id, auth.uid())
  );

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();
