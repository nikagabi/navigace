export type AppRole = 'hr_admin' | 'employee' | 'manazer' | 'mistr' | 'zamestnanec';

export type DocumentStatus = 'processing' | 'ready' | 'error';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  uploaded_by: string;
  title: string;
  filename: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: DocumentStatus;
  chunks_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageSource {
  document_id: string;
  title: string;
  chunk_index: number;
  similarity: number;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: MessageSource[];
  created_at: string;
}

export interface MessageFeedback {
  id: string;
  message_id: string;
  user_id: string;
  rating: 1 | -1;
  created_at: string;
}

export interface ChunkMatch {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
  document_title: string;
}

export interface Stats {
  total_users: number;
  total_documents: number;
  total_chunks: number;
  total_conversations: number;
  total_messages: number;
  avg_satisfaction: number | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile };
      user_roles: { Row: UserRole };
      documents: { Row: DocumentRow };
      document_chunks: { Row: DocumentChunk };
      conversations: { Row: Conversation };
      messages: { Row: MessageRow };
      message_feedback: { Row: MessageFeedback };
    };
    Functions: {
      has_role: { Args: { _user_id: string; _role: AppRole }; Returns: boolean };
      match_chunks: {
        Args: { query_embedding: string; match_count?: number; similarity_threshold?: number };
        Returns: ChunkMatch[];
      };
      get_stats: { Args: Record<string, never>; Returns: Stats };
    };
  };
}
