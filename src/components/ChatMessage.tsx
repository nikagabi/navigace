import ReactMarkdown from 'react-markdown';
import type { MessageRow } from '../integrations/supabase/types';
import { SourceCitation } from './SourceCitation';
import { FeedbackButtons } from './FeedbackButtons';

export function ChatMessage({ message }: { message: MessageRow }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isUser ? '' : 'w-full'}`}>
        <div
          className={
            isUser
              ? 'card !p-3 bg-[var(--accent)] text-[var(--bg)]'
              : 'card !p-3'
          }
        >
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {!isUser && message.sources?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.sources.map((s, i) => (
              <SourceCitation key={i} source={s} />
            ))}
          </div>
        )}

        {!isUser && <div className="mt-2"><FeedbackButtons messageId={message.id} /></div>}
      </div>
    </div>
  );
}
