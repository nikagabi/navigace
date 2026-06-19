import { createFileRoute } from '@tanstack/react-router';
import { SlideLayout } from '../components/SlideLayout';
import { PitchSlide } from '../components/PitchSlide';

export const Route = createFileRoute('/pitch')({
  component: PitchPage,
});

const FEATURES = [
  { icon: '🔍', title: 'Sémantické vyhledávání', text: 'Chápeme záměr dotazu, ne jen klíčová slova.' },
  { icon: '📎', title: 'Citace zdrojů', text: 'Každá odpověď odkazuje na konkrétní dokument.' },
  { icon: '🔒', title: 'RLS na úrovni řádků', text: 'Přístup k datům kontroluje databáze, ne kód.' },
  { icon: '⚡', title: 'Odpověď do 3 s', text: 'Rychlý retrieval díky HNSW indexu.' },
  { icon: '🗂️', title: 'Vícekrokové konverzace', text: 'Asistent si pamatuje kontext rozhovoru.' },
  { icon: '📊', title: 'Admin přehledy', text: 'Statistiky využití a spokojenosti na jednom místě.' },
];

const ROADMAP = [
  { milestone: 'Audit log', estimate: '1–2 dny' },
  { milestone: 'Doménové omezení registrace', estimate: '0.5 dne' },
  { milestone: 'Feedback thumbs', estimate: '1 den' },
  { milestone: 'Automatický reindex', estimate: '2 dny' },
  { milestone: 'Více jazyků', estimate: '2 dny' },
];

function PitchPage() {
  return (
    <SlideLayout>
      <PitchSlide className="items-center text-center bg-gradient-to-br from-[var(--bg)] to-[var(--surface)]">
        <h1 className="text-7xl font-[var(--font-display)] font-bold text-[var(--accent)] mb-4">Navigace</h1>
        <p className="text-2xl text-[var(--muted)] max-w-3xl">
          HR znalostní báze na jedno kliknutí
        </p>
        <p className="text-lg text-[var(--muted)] mt-12">Hackathon 2026</p>
      </PitchSlide>

      <PitchSlide>
        <h2 className="text-5xl font-[var(--font-display)] font-bold mb-12">Problém</h2>
        <p className="text-3xl mb-12 max-w-3xl">HR týmy opakují. Zaměstnanci hledají.</p>
        <div className="grid grid-cols-3 gap-8">
          <Stat value="40%" label="dotazů na HR je opakovaných" />
          <Stat value="15 min" label="průměrné hledání informace v dokumentech" />
          <Stat value="3×" label="týdně se zaměstnanec ptá na totéž" />
        </div>
      </PitchSlide>

      <PitchSlide className="items-center">
        <h2 className="text-5xl font-[var(--font-display)] font-bold mb-12">Řešení</h2>
        <div className="card w-full max-w-3xl">
          <p className="text-[var(--muted)] mb-2">Zaměstnanec:</p>
          <p className="mb-6 text-xl">„Kolik dní dovolené mám nárok?"</p>
          <p className="text-[var(--muted)] mb-2">Navigace:</p>
          <p className="text-xl">
            „Podle kolektivní smlouvy máte nárok na 25 dní dovolené ročně."
          </p>
          <span className="badge badge-ready mt-4 inline-block">📎 Kolektivní smlouva 2026 · 94%</span>
        </div>
      </PitchSlide>

      <PitchSlide className="items-center">
        <h2 className="text-5xl font-[var(--font-display)] font-bold mb-16">Jak to funguje</h2>
        <div className="flex gap-6 items-center text-2xl">
          <Step n={1} label="Upload" />
          <Arrow />
          <Step n={2} label="Indexace" />
          <Arrow />
          <Step n={3} label="Dotaz" />
          <Arrow />
          <Step n={4} label="Odpověď" />
        </div>
      </PitchSlide>

      <PitchSlide>
        <h2 className="text-5xl font-[var(--font-display)] font-bold mb-12">Features</h2>
        <div className="grid grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="card">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-1">{f.title}</h3>
              <p className="text-[var(--muted)]">{f.text}</p>
            </div>
          ))}
        </div>
      </PitchSlide>

      <PitchSlide className="bg-[var(--surface)]">
        <h2 className="text-5xl font-[var(--font-display)] font-bold mb-12">Bezpečnost</h2>
        <div className="grid grid-cols-3 gap-8 text-xl">
          <SecurityPoint icon="🔒" title="RLS" text="Row Level Security na všech tabulkách." />
          <SecurityPoint icon="🛡️" title="RBAC" text="Role oddělené od profilů, security definer funkce." />
          <SecurityPoint icon="🗄️" title="Privátní storage" text="Dokumenty nejsou veřejně dostupné." />
        </div>
      </PitchSlide>

      <PitchSlide className="items-center text-center">
        <h2 className="text-5xl font-[var(--font-display)] font-bold mb-12">Integrace</h2>
        <p className="text-2xl text-[var(--muted)] max-w-2xl">
          Supabase (PostgreSQL + pgvector) · Google Gemini 2.5 Flash · OpenAI text-embedding-3-small
        </p>
      </PitchSlide>

      <PitchSlide>
        <h2 className="text-5xl font-[var(--font-display)] font-bold mb-12">Roadmapa</h2>
        <div className="flex flex-col gap-4">
          {ROADMAP.map((r, i) => (
            <div key={r.milestone} className="flex items-center gap-4 text-xl">
              <span className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center font-semibold shrink-0">
                {i + 1}
              </span>
              <span className="flex-1">{r.milestone}</span>
              <span className="text-[var(--muted)]">{r.estimate}</span>
            </div>
          ))}
        </div>
      </PitchSlide>

      <PitchSlide className="items-center text-center">
        <h2 className="text-5xl font-[var(--font-display)] font-bold mb-8">
          Připraveni spustit Navigaci ve vaší firmě?
        </h2>
        <p className="text-2xl text-[var(--accent)]">navigace.app</p>
      </PitchSlide>
    </SlideLayout>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card text-center">
      <p className="text-4xl font-bold text-[var(--accent)] mb-2">{value}</p>
      <p className="text-[var(--muted)]">{label}</p>
    </div>
  );
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <div className="card text-center w-48">
      <p className="text-3xl font-bold text-[var(--accent)] mb-2">{n}</p>
      <p>{label}</p>
    </div>
  );
}

function Arrow() {
  return <span className="text-[var(--muted)]">→</span>;
}

function SecurityPoint({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="card text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-[var(--muted)] text-base">{text}</p>
    </div>
  );
}
