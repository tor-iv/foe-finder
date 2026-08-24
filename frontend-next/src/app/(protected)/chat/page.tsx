'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';
import { fadeInUp } from '@/lib/animations';
import { MatchDisplay } from '@/types';

interface MatchResponse {
  match: MatchDisplay | null;
}

interface ChatMessage {
  id: number;
  matchId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

async function fetchMatch(): Promise<MatchResponse> {
  const res = await fetch('/api/match');
  if (!res.ok) throw new Error('Failed to load match');
  return res.json();
}

async function fetchMessages(matchId: string): Promise<{ messages: ChatMessage[] }> {
  const res = await fetch(`/api/chat/${matchId}`);
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

export default function ChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: matchData, isLoading: isLoadingMatch } = useQuery({
    queryKey: ['match'],
    queryFn: fetchMatch,
  });
  const match = matchData?.match ?? null;

  const { data: messagesData } = useQuery({
    queryKey: ['chat', match?.id],
    queryFn: () => fetchMessages(match!.id),
    enabled: !!match,
    refetchInterval: 3000,
  });
  const messages = messagesData?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match || !draft.trim()) return;

    setSending(true);
    setError(null);
    const body = draft.trim();
    setDraft('');

    try {
      const res = await fetch(`/api/chat/${match.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to send');
        setDraft(body);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['chat', match.id] });
    } finally {
      setSending(false);
    }
  };

  if (isLoadingMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-muted-foreground uppercase tracking-wide">Loading...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial="initial" animate="animate" variants={fadeInUp} className="win95-panel max-w-md w-full text-center">
          <div className="win95-titlebar -mx-4 -mt-4 mb-4">
            <span className="text-sm">NO MATCH YET</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            You need a nemesis before you can chat with them.
          </p>
          <Link href="/results" className="win95-btn win95-btn-primary inline-block px-6 py-3">
            Back to Results
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="win95-panel flex-1 flex flex-col overflow-hidden">
          <div className="win95-titlebar -mx-4 -mt-4 mb-4 flex justify-between items-center">
            <span className="text-sm">CHAT WITH {match.opponent.displayName.toUpperCase()}</span>
            <Link href="/results" className="text-xs underline">
              Back
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-[300px] max-h-[50vh]">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages yet. Say hello to your nemesis.
              </p>
            )}
            {messages.map((m) => {
              const isMine = m.senderId === user?.uid;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`win95-inset px-3 py-2 max-w-[75%] text-sm ${
                      isMine ? 'bg-foe-accent/10' : ''
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {error && <div className="text-foe-error text-xs mb-2">{error}</div>}

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="win95-input flex-1"
              placeholder="Type a message..."
              maxLength={2000}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="win95-btn win95-btn-primary px-4"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
