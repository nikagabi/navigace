import type { ReactNode } from 'react';

interface PitchSlideProps {
  children: ReactNode;
  className?: string;
}

export function PitchSlide({ children, className = '' }: PitchSlideProps) {
  return <section className={`pitch-slide ${className}`}>{children}</section>;
}
