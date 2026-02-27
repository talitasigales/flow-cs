
-- Fix chat_conversations INSERT policy: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Authenticated can create conversations" ON public.chat_conversations;
CREATE POLICY "Authenticated can create conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Also fix chat_participants INSERT policy (same issue)
DROP POLICY IF EXISTS "Authenticated can insert participants" ON public.chat_participants;
CREATE POLICY "Authenticated can insert participants"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
