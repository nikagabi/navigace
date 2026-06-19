interface ExportableConversation {
  user_email: string;
  title: string;
  message_count: number;
  created_at: string;
}

export function exportConversationsToCSV(conversations: ExportableConversation[]): void {
  const headers = ['Email uživatele', 'Název konverzace', 'Počet zpráv', 'Datum vytvoření'];
  const rows = conversations.map(c => [c.user_email, c.title, c.message_count, c.created_at]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `navigace-konverzace-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
