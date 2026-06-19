import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
      <div className="text-4xl">{icon}</div>
      <p className="font-[var(--font-display)] text-lg">{title}</p>
      {description && <p className="text-[var(--muted)] max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
