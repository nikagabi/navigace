import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { logWork } from '../lib/hr.functions';

export function WorkLogForm() {
  const logWorkFn = useServerFn(logWork);
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [status, setStatus] = useState<'odvedeno' | 'chybi' | 'nedokonceno'>('odvedeno');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!description.trim()) return;
    setSaving(true);
    try {
      await logWorkFn({
        data: {
          description,
          hours: hours ? Number(hours) : undefined,
          status,
        },
      });
      setDescription('');
      setHours('');
      setStatus('odvedeno');
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-2">
        <button type="button" className="btn btn-secondary text-sm" onClick={() => setOpen(true)}>
          + Zaznamenat odvedenou/chybějící práci
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-2">
      <div className="card !p-3 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">Záznam práce za dnešní den</p>
          <button type="button" className="text-[var(--muted)] text-sm" onClick={() => setOpen(false)}>✕</button>
        </div>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Co jste dělal/a..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <input
            className="input w-24"
            type="number"
            min={0}
            max={24}
            placeholder="Hodiny"
            value={hours}
            onChange={e => setHours(e.target.value)}
          />
          <select
            className="input"
            value={status}
            onChange={e => setStatus(e.target.value as typeof status)}
          >
            <option value="odvedeno">Odvedeno</option>
            <option value="nedokonceno">Nedokončeno</option>
            <option value="chybi">Chybí</option>
          </select>
          <button type="button" className="btn" disabled={saving || !description.trim()} onClick={submit}>
            {saving ? 'Ukládám…' : 'Uložit'}
          </button>
          {done && <span className="text-sm text-[var(--success)]">Uloženo ✓</span>}
        </div>
      </div>
    </div>
  );
}
