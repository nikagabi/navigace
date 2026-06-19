import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

const FEATURES = [
  { icon: '🔍', title: 'Sémantické vyhledávání', text: 'Nehledáme slova, chápeme záměr dotazu.' },
  { icon: '📎', title: 'Citace zdrojů', text: 'Každá odpověď obsahuje odkaz na zdrojový dokument.' },
  { icon: '🔒', title: 'Firemní bezpečnost', text: 'Vaše data nikdy neopouštějí váš server.' },
];

const STEPS = ['Nahrajte dokumenty', 'Zaměstnanci se ptají', 'Dostávají odpovědi'];

function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 gap-6">
        <p className="text-sm tracking-widest text-[var(--accent)] font-semibold">NAVIGACE</p>
        <h1 className="text-4xl md:text-5xl font-[var(--font-display)] font-bold max-w-2xl">
          HR znalostní báze na jedno kliknutí
        </h1>
        <p className="text-[var(--muted)] max-w-xl">
          Vaši zaměstnanci se ptají česky, dostávají přesné odpovědi s citací zdrojů.
        </p>
        <div className="flex gap-3">
          <Link to="/auth" className="btn">Spustit demo</Link>
          <Link to="/pitch" className="btn btn-secondary">Vidět pitch</Link>
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto grid md:grid-cols-3 gap-6 w-full">
        {FEATURES.map(f => (
          <div key={f.title} className="card text-center">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-[var(--muted)]">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="px-6 py-16 max-w-3xl mx-auto text-center w-full">
        <h2 className="text-2xl font-[var(--font-display)] font-semibold mb-8">Jak to funguje</h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              <span>{s}</span>
              {i < STEPS.length - 1 && <span className="text-[var(--muted)] hidden md:inline">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 text-center bg-[var(--surface)]">
        <h2 className="text-2xl font-[var(--font-display)] font-semibold mb-4">Připraveni začít?</h2>
        <Link to="/auth" className="btn">Zaregistrovat se</Link>
      </section>

      <footer className="px-6 py-6 text-center text-sm text-[var(--muted)] flex flex-col gap-1">
        <span>© 2026 Navigace</span>
        <Link to="/pitch" className="underline">Pitch deck</Link>
      </footer>
    </main>
  );
}
