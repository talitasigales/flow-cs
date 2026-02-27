import { supabase } from '@/integrations/supabase/client';

// Matches @Name (supports multi-word names up to 4 words)
const MENTION_REGEX = /@([\w\sÀ-ÿ]+?)(?=\s@|\s[^@\w]|$)/g;

export interface MentionedUser {
  user_id: string;
  full_name: string;
}

/**
 * Extracts mentioned user names from text and resolves them to user IDs.
 */
export async function resolveMentions(text: string): Promise<MentionedUser[]> {
  const matches = [...text.matchAll(MENTION_REGEX)];
  if (matches.length === 0) return [];

  const names = [...new Set(matches.map(m => m[1].trim()))];

  const { data: profiles } = await (supabase as any)
    .from('public_profiles')
    .select('user_id, full_name');

  if (!profiles) return [];

  const resolved: MentionedUser[] = [];
  for (const name of names) {
    const match = profiles.find((p: any) =>
      p.full_name?.toLowerCase() === name.toLowerCase()
    );
    if (match) resolved.push({ user_id: match.user_id, full_name: match.full_name });
  }
  return resolved;
}

/**
 * Creates mention notifications for all mentioned users.
 */
export async function notifyMentions(
  text: string,
  actorId: string,
  postId?: string,
  commentId?: string,
) {
  const mentioned = await resolveMentions(text);
  if (mentioned.length === 0) return;

  const notifications = mentioned
    .filter(m => m.user_id !== actorId)
    .map(m => ({
      user_id: m.user_id,
      actor_id: actorId,
      type: 'mention',
      message: `mencionou você em ${commentId ? 'um comentário' : 'uma publicação'}`,
      post_id: postId || null,
      comment_id: commentId || null,
    }));

  if (notifications.length > 0) {
    await (supabase as any).from('notifications').insert(notifications);
  }
}

/**
 * Renders text with @mentions highlighted as links.
 */
export function renderMentionText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /@([\w\sÀ-ÿ]+?)(?=\s@|\s[^@\w]|$)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const name = match[1].trim();
    parts.push(
      <span
        key={match.index}
        className="text-primary font-medium cursor-pointer hover:underline"
      >
        @{name}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}
