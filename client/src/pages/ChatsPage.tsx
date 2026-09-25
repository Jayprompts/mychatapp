import { useParams } from 'react-router';
import { MessageCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChatView } from '@/features/chat/components/ChatView';
import { ConversationList } from '@/features/chat/components/ConversationList';
import { cn } from '@/lib/cn';

// /chats and /chats/:conversationId, per the design:
//   mobile        list OR conversation (full screen, back button)
//   tablet+ (md)  list column + conversation side by side
export function ChatsPage() {
  const { conversationId } = useParams();

  return (
    <div className="flex min-h-0 flex-1">
      <section
        aria-label="Conversations"
        className={cn(
          'min-h-0 w-full flex-col border-border bg-card md:flex md:w-80 md:shrink-0 md:border-r lg:w-[360px]',
          conversationId ? 'hidden' : 'flex',
        )}
      >
        <ConversationList activeId={conversationId} />
      </section>

      <section
        aria-label="Conversation"
        className={cn('min-h-0 min-w-0 flex-1 flex-col bg-bg', conversationId ? 'flex' : 'hidden md:flex')}
      >
        {conversationId ? (
          <ChatView key={conversationId} conversationId={conversationId} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={MessageCircle}
              title="Your messages"
              description="Pick a conversation from the list, or start a new one."
            />
          </div>
        )}
      </section>
    </div>
  );
}
