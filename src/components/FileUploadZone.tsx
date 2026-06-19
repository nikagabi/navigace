import { useRef, useState } from 'react';

interface FileUploadZoneProps {
  onFile: (file: File) => Promise<void>;
  progress: string | null;
}

export function FileUploadZone({ onFile, progress }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      await onFile(file);
    } catch (err: any) {
      setError(err.message ?? 'Nahrání se nezdařilo.');
    }
  };

  return (
    <div>
      <div
        className={`card border-dashed flex flex-col items-center justify-center gap-2 py-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-[var(--accent)] bg-[var(--surface-2)]' : ''
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <p className="font-medium">Přetáhněte soubor nebo klikněte pro výběr</p>
        <p className="text-sm text-[var(--muted)]">PDF, DOCX, TXT, MD · max 20 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>
      {progress && <p className="text-sm text-[var(--warning)] mt-2">{progress}</p>}
      {error && <p className="text-sm text-[var(--danger)] mt-2">{error}</p>}
    </div>
  );
}
