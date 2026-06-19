export function LoadingDots() {
  return (
    <span className="inline-flex gap-1 items-center" aria-label="Asistent píše">
      <span className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:300ms]" />
    </span>
  );
}
