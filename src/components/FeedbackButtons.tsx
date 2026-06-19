import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { submitFeedback } from '../lib/chat.functions';

export function FeedbackButtons({ messageId }: { messageId: string }) {
  const submitFn = useServerFn(submitFeedback);
  const [rating, setRating] = useState<1 | -1 | null>(null);

  const vote = async (value: 1 | -1) => {
    setRating(value);
    await submitFn({ data: { messageId, rating: value } });
  };

  return (
    <div className="flex gap-2 text-sm">
      <button
        type="button"
        onClick={() => vote(1)}
        aria-pressed={rating === 1}
        className={`px-2 py-1 rounded-[var(--radius-sm)] ${rating === 1 ? 'text-[var(--success)]' : 'text-[var(--muted)]'} hover:bg-[var(--surface-2)]`}
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => vote(-1)}
        aria-pressed={rating === -1}
        className={`px-2 py-1 rounded-[var(--radius-sm)] ${rating === -1 ? 'text-[var(--danger)]' : 'text-[var(--muted)]'} hover:bg-[var(--surface-2)]`}
      >
        👎
      </button>
    </div>
  );
}
