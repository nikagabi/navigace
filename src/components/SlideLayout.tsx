import { useEffect, useState, type ReactNode } from 'react';

export function SlideLayout({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      setScale(Math.min(scaleX, scaleY));
      setIsMobile(window.innerWidth < 768);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  if (isMobile) {
    return (
      <div className="pitch-mobile-warning flex flex-col items-center justify-center h-screen text-center p-8 gap-2">
        <p className="text-lg font-medium">Pitch deck je optimalizován pro desktop</p>
        <p className="text-[var(--muted)]">Otevřete tuto stránku na větší obrazovce.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden h-screen bg-[var(--bg)]">
      <div
        className="pitch-wrapper"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
