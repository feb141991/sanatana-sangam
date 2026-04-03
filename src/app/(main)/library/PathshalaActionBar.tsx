'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Bookmark } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { LibraryTradition } from '@/lib/library-content';

export default function PathshalaActionBar({
  userId,
  tradition,
  sectionId,
  entryId,
  initiallyBookmarked,
}: {
  userId: string;
  tradition: LibraryTradition;
  sectionId: string;
  entryId: string;
  initiallyBookmarked: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [bookmarked, setBookmarked] = useState(initiallyBookmarked);
  const [busy, setBusy] = useState(false);
  const didRecordView = useRef(false);

  useEffect(() => {
    if (!userId || didRecordView.current) return;

    didRecordView.current = true;
    const timestamp = new Date().toISOString();

    supabase
      .from('pathshala_user_state')
      .upsert({
        user_id: userId,
        tradition,
        section_id: sectionId,
        entry_id: entryId,
        last_opened_at: timestamp,
        bookmarked_at: initiallyBookmarked ? timestamp : null,
      }, { onConflict: 'user_id,entry_id' });
  }, [entryId, initiallyBookmarked, sectionId, supabase, tradition, userId]);

  async function toggleBookmark() {
    if (!userId || busy) return;

    setBusy(true);
    const nextBookmarked = !bookmarked;
    const timestamp = new Date().toISOString();

    const { error } = await supabase
      .from('pathshala_user_state')
      .upsert({
        user_id: userId,
        tradition,
        section_id: sectionId,
        entry_id: entryId,
        last_opened_at: timestamp,
        bookmarked_at: nextBookmarked ? timestamp : null,
      }, { onConflict: 'user_id,entry_id' });

    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }

    setBookmarked(nextBookmarked);
    setBusy(false);
    toast.success(nextBookmarked ? 'Saved to Pathshala bookmarks' : 'Removed from Pathshala bookmarks');
  }

  return (
    <div className="glass-panel rounded-[1.5rem] px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-900">Continue learning</p>
        <p className="text-sm text-gray-600 mt-1">
          This text is now remembered in your study history so you can return where you left off.
        </p>
      </div>
      <button
        type="button"
        onClick={toggleBookmark}
        disabled={busy}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50 ${
          bookmarked
            ? 'glass-button-primary text-white'
            : 'glass-button-secondary'
        }`}
        style={bookmarked ? undefined : { color: 'var(--brand-primary)' }}
      >
        <Bookmark size={15} className={bookmarked ? 'fill-current' : ''} />
        {bookmarked ? 'Bookmarked' : 'Save text'}
      </button>
    </div>
  );
}
