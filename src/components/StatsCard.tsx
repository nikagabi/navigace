import type { ReactNode } from 'react';

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
}

export function StatsCard({ icon, label, value }: StatsCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-[var(--font-display)] font-semibold">{value}</p>
        <p className="text-sm text-[var(--muted)]">{label}</p>
      </div>
    </div>
  );
}
