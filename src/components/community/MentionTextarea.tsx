import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UserSuggestion {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>;
  className?: string;
}

export function MentionTextarea({ value, onChange, placeholder, rows = 3, onPaste, className }: MentionTextareaProps) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const allUsersRef = useRef<UserSuggestion[]>([]);

  // Fetch all users once
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('public_profiles')
        .select('user_id, full_name, avatar_url, company');
      allUsersRef.current = data || [];
    })();
  }, []);

  const detectMention = useCallback((text: string, cursorPos: number) => {
    // Look backwards from cursor for @
    const textBeforeCursor = text.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex === -1) {
      setShowSuggestions(false);
      return;
    }

    // Make sure @ is at start or after whitespace
    if (atIndex > 0 && !/\s/.test(textBeforeCursor[atIndex - 1])) {
      setShowSuggestions(false);
      return;
    }

    const query = textBeforeCursor.slice(atIndex + 1);

    // If there's a newline after @, cancel
    if (query.includes('\n')) {
      setShowSuggestions(false);
      return;
    }

    setMentionQuery(query);
    setMentionStart(atIndex);

    const q = query.toLowerCase();
    const filtered = allUsersRef.current
      .filter(u => u.full_name?.toLowerCase().includes(q))
      .slice(0, 6);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    detectMention(newValue, e.target.selectionStart || 0);
  };

  const insertMention = (user: UserSuggestion) => {
    if (mentionStart === -1 || !user.full_name) return;
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + mentionQuery.length);
    const newValue = `${before}@${user.full_name} ${after}`;
    onChange(newValue);
    setShowSuggestions(false);

    // Set cursor position after mention
    setTimeout(() => {
      const pos = mentionStart + user.full_name!.length + 2;
      textareaRef.current?.setSelectionRange(pos, pos);
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && suggestions[selectedIndex]) {
      e.preventDefault();
      insertMention(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
        >
          {suggestions.map((user, i) => (
            <button
              key={user.user_id}
              onClick={() => insertMention(user)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors',
                i === selectedIndex && 'bg-muted/50'
              )}
            >
              <Avatar className="h-7 w-7">
                {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback className="text-xs">{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.full_name}</p>
                {user.company && (
                  <p className="text-xs text-muted-foreground truncate">{user.company}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
