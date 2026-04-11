'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageSquare, Send, Users } from 'lucide-react';
import { AsyncStateCard, EmptyState, SurfaceSection } from '@/components/ui';
import type { MessageThread, ThreadMessage } from '@/lib/contracts/messages';
import { useMarkThreadReadMutation, useMessageThreadsQuery, useSendThreadMessageMutation, useThreadMessagesQuery } from '@/hooks/useMessages';
import { formatRelativeTime } from '@/lib/utils';

function ThreadKindPill({ kind }: { kind: MessageThread['kind'] }) {
  const label = kind === 'kul' ? 'Kul' : kind === 'mandali' ? 'Mandali' : 'Direct';
  return (
    <span className="type-chip rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[color:var(--text-cream)]">
      {label}
    </span>
  );
}

function MessageBubble({ message }: { message: ThreadMessage }) {
  return (
    <div className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-[1.4rem] px-4 py-3 ${
          message.isCurrentUser
            ? 'bg-[color:var(--surface-raised)] border border-white/8'
            : 'bg-white/[0.04] border border-white/6'
        }`}
      >
        {!message.isCurrentUser ? (
          <p className="type-card-label mb-1 text-[color:var(--text-muted-warm)]">{message.senderName}</p>
        ) : null}
        <p className="type-body text-[color:var(--text-cream)]">{message.body}</p>
        <div className="mt-2 flex items-center justify-end gap-2">
          <span className="type-micro">{formatRelativeTime(message.createdAt)}</span>
          {message.isCurrentUser ? <span className="type-micro">{message.deliveryState}</span> : null}
        </div>
      </div>
    </div>
  );
}

export default function MessagesClient({
  userId,
  userName,
  initialThreads,
  initialMessages,
}: {
  userId: string;
  userName: string;
  initialThreads: MessageThread[];
  initialMessages: ThreadMessage[];
}) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialThreads[0]?.id ?? null);
  const [draft, setDraft] = useState('');

  const threadsQuery = useMessageThreadsQuery(userId, initialThreads);
  const threads = useMemo(() => threadsQuery.data ?? [], [threadsQuery.data]);
  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? threads[0] ?? null,
    [selectedThreadId, threads]
  );

  const messagesQuery = useThreadMessagesQuery(
    selectedThread?.id ?? null,
    userId,
    selectedThread?.id === initialThreads[0]?.id ? initialMessages : undefined
  );
  const sendMutation = useSendThreadMessageMutation(userId, userName);
  const markReadMutation = useMarkThreadReadMutation(userId);

  useEffect(() => {
    if (selectedThread && selectedThread.unreadCount > 0) {
      void markReadMutation.mutateAsync(selectedThread.id);
    }
  }, [markReadMutation, selectedThread]);

  if (threadsQuery.isPending && !threadsQuery.data) {
    return <AsyncStateCard state="loading" title="Messages are loading" description="Preparing your conversation space." />;
  }

  if (threadsQuery.isError && !threadsQuery.data) {
    return <AsyncStateCard state="error" title="Messages could not load" description="The conversation shell is available, but this inbox did not come through." />;
  }

  if (!threads.length) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Kul, Mandali, and direct conversations will appear here once shared messaging is turned on."
      />
    );
  }

  async function handleSend() {
    const body = draft.trim();
    if (!body || !selectedThread) return;
    setDraft('');
    await sendMutation.mutateAsync({ threadId: selectedThread.id, body });
  }

  const messages = messagesQuery.data ?? [];

  return (
    <div className="space-y-4 md:grid md:grid-cols-[0.92fr_1.28fr] md:gap-4 md:space-y-0">
      <SurfaceSection
        eyebrow="Inbox"
        title="Sacred conversations"
        description="A dedicated shell for Kul, Mandali, and direct messages."
        className={`${selectedThread ? 'hidden md:block' : ''}`}
      >
        <div className="space-y-2">
          {threads.map((thread) => {
            const active = selectedThread?.id === thread.id;
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
                className={`flex w-full items-start gap-3 rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  active
                    ? 'bg-[color:var(--surface-raised)] border-white/10'
                    : 'bg-white/[0.03] border-white/6 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] text-sm font-medium theme-ink">
                  {thread.avatarFallback}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="type-card-heading truncate">{thread.title}</p>
                    <span className="type-micro whitespace-nowrap">{formatRelativeTime(thread.lastMessageAt)}</span>
                  </div>
                  <p className="type-body mt-1 line-clamp-2">{thread.lastMessagePreview}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ThreadKindPill kind={thread.kind} />
                      <span className="type-micro">{thread.participantCount} people</span>
                    </div>
                    {thread.unreadCount > 0 ? (
                      <span className="flex min-w-6 items-center justify-center rounded-full bg-[color:var(--text-saffron-strong)] px-2 py-1 text-[10px] font-medium text-[color:var(--surface-base)]">
                        {thread.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </SurfaceSection>

      <SurfaceSection
        eyebrow={selectedThread?.contextLabel ?? 'Conversation'}
        title={selectedThread?.title ?? 'Conversation'}
        description={selectedThread?.subtitle ?? 'A focused thread for shared practice and planning.'}
        className={`${selectedThread ? '' : 'hidden md:block'}`}
        actions={
          <button
            type="button"
            onClick={() => setSelectedThreadId(null)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] md:hidden"
            aria-label="Back to thread list"
          >
            <ArrowLeft size={16} className="theme-ink" />
          </button>
        }
      >
        {selectedThread ? (
          <>
            <div className="flex items-center gap-2 rounded-[1.2rem] border border-white/6 bg-white/[0.03] px-3 py-3">
              {selectedThread.kind === 'direct' ? (
                <MessageSquare size={15} className="theme-dim" />
              ) : (
                <Users size={15} className="theme-dim" />
              )}
              <p className="type-body">
                {selectedThread.kind === 'direct'
                  ? 'Direct conversation shell'
                  : `${selectedThread.participantCount} participants in this space`}
              </p>
            </div>

            <div className="space-y-3">
              {messagesQuery.isPending && !messagesQuery.data ? (
                <AsyncStateCard state="loading" title="Opening thread" description="Pulling the latest replies into view." />
              ) : messages.length ? (
                messages.map((message) => <MessageBubble key={message.id} message={message} />)
              ) : (
                <EmptyState title="No messages yet" description="This thread is ready for the first note." />
              )}
            </div>

            <div className="sticky bottom-20 md:bottom-0">
              <div className="rounded-[1.5rem] border border-white/8 bg-[color:var(--surface-raised)] px-3 py-3">
                <div className="flex items-end gap-3">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Send a focused update, plan, or prayer note"
                    rows={2}
                    className="min-h-[74px] flex-1 resize-none bg-transparent px-2 py-1 outline-none type-body"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sendMutation.isPending || !draft.trim()}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--text-saffron-strong)] text-[color:var(--surface-base)] transition disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="Choose a conversation" description="Select a thread to open the dedicated message shell." />
        )}
      </SurfaceSection>
    </div>
  );
}
