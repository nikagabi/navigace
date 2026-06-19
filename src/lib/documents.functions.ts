import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '../integrations/supabase/auth-middleware';
import { embedText } from './ai-gateway.server';
import { chunkText } from './chunking';

async function requireAdmin(supabase: any, userId: string) {
  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'hr_admin')
    .maybeSingle();
  if (!role) throw new Error('Nedostatečná oprávnění.');
}

export const listDocuments = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    return data ?? [];
  });

const CreateDocumentInput = z.object({
  title: z.string().min(1).max(200),
  filename: z.string().min(1),
  storagePath: z.string().min(1),
  fileSize: z.number().int().positive().max(20 * 1024 * 1024),
  mimeType: z.string().min(1),
});

export const createDocument = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator(CreateDocumentInput)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.user.id);

    const { data: doc, error } = await context.supabase
      .from('documents')
      .insert({
        uploaded_by: context.user.id,
        title: data.title,
        filename: data.filename,
        storage_path: data.storagePath,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        status: 'processing',
      })
      .select()
      .single();

    if (error || !doc) throw new Error('Dokument se nepodařilo vytvořit.');
    return doc;
  });

const ProcessInput = z.object({
  documentId: z.string().uuid(),
  text: z.string().min(1),
});

export const processDocument = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator(ProcessInput)
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    await requireAdmin(supabase, context.user.id);

    try {
      const chunks = chunkText(data.text);

      const BATCH_SIZE = 10;
      const insertedChunks: any[] = [];

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchWithEmbeddings = await Promise.all(
          batch.map(async (content, j) => {
            const embedding = await embedText(content);
            return {
              document_id: data.documentId,
              chunk_index: i + j,
              content,
              embedding: `[${embedding.join(',')}]`,
            };
          })
        );

        const { data: inserted } = await supabase
          .from('document_chunks')
          .insert(batchWithEmbeddings)
          .select('id');

        insertedChunks.push(...(inserted ?? []));
      }

      await supabase
        .from('documents')
        .update({
          status: 'ready',
          chunks_count: insertedChunks.length,
        })
        .eq('id', data.documentId);

      return { chunksCreated: insertedChunks.length };
    } catch (err: any) {
      await supabase
        .from('documents')
        .update({ status: 'error', error_message: err.message ?? 'Zpracování selhalo.' })
        .eq('id', data.documentId);
      throw err;
    }
  });

const DeleteDocumentInput = z.object({
  documentId: z.string().uuid(),
  storagePath: z.string().min(1),
});

export const deleteDocument = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator(DeleteDocumentInput)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.user.id);

    await context.supabase.storage.from('documents').remove([data.storagePath]);
    await context.supabase.from('documents').delete().eq('id', data.documentId);

    return { success: true };
  });
