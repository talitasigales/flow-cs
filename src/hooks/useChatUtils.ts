import { supabase } from '@/integrations/supabase/client';

/**
 * Find or create a direct conversation between two users.
 * Returns the conversation ID.
 */
export async function findOrCreateConversation(currentUserId: string, otherUserId: string): Promise<string | null> {
  // Find existing direct conversation between these two users
  const { data: myParticipations } = await (supabase as any)
    .from('chat_participants')
    .select('conversation_id')
    .eq('user_id', currentUserId);

  if (myParticipations && myParticipations.length > 0) {
    const myConvIds = myParticipations.map((p: any) => p.conversation_id);

    const { data: shared } = await (supabase as any)
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', myConvIds);

    if (shared && shared.length > 0) {
      // Verify it's a direct conversation
      const { data: conv } = await (supabase as any)
        .from('chat_conversations')
        .select('id')
        .eq('id', shared[0].conversation_id)
        .eq('type', 'direct')
        .single();

      if (conv) return conv.id;
    }
  }

  // Create new conversation with client-generated ID
  const convId = crypto.randomUUID();
  const { error: convError } = await (supabase as any)
    .from('chat_conversations')
    .insert({ id: convId, type: 'direct' });

  if (convError) return null;

  // Add both participants
  const { error: partError } = await (supabase as any)
    .from('chat_participants')
    .insert([
      { conversation_id: convId, user_id: currentUserId },
      { conversation_id: convId, user_id: otherUserId },
    ]);

  if (partError) return null;

  return convId;
}
