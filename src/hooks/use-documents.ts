import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { listDocuments, createDocument, processDocument, deleteDocument } from '../lib/documents.functions';
import { extractText } from '../lib/extract-text';
import { getSupabaseBrowserClient } from '../integrations/supabase/client';
import type { DocumentRow } from '../integrations/supabase/types';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export function useDocuments() {
  const listFn = useServerFn(listDocuments);
  const createFn = useServerFn(createDocument);
  const processFn = useServerFn(processDocument);
  const deleteFn = useServerFn(deleteDocument);

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFn();
      setDocuments(data as DocumentRow[]);
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`Nepodporovaný formát: .${ext}`);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Soubor je větší než 20 MB.');
      }

      setUploadProgress('Extrakce textu...');
      const text = await extractText(file);

      const storagePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await getSupabaseBrowserClient().storage
        .from('documents')
        .upload(storagePath, file, { contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);

      const doc = await createFn({
        data: {
          title: file.name,
          filename: file.name,
          storagePath,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
        },
      });

      setUploadProgress('Indexace...');
      await processFn({ data: { documentId: (doc as DocumentRow).id, text } });

      setUploadProgress('Dokončeno ✓');
      await refresh();
      setUploadProgress(null);
    },
    [createFn, processFn, refresh]
  );

  const remove = useCallback(
    async (documentId: string, storagePath: string) => {
      await deleteFn({ data: { documentId, storagePath } });
      await refresh();
    },
    [deleteFn, refresh]
  );

  return { documents, loading, uploadProgress, upload, remove, refresh };
}
