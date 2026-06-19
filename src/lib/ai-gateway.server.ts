const BASE = 'https://openrouter.ai/api/v1';

function openRouterKey(): string {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new Error('OPENROUTER_API_KEY není nastaven');
  return k;
}

function chatModel(): string {
  return process.env.OPENROUTER_CHAT_MODEL ?? 'openai/gpt-oss-20b:free';
}

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(`${BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openRouterKey()}`,
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding selhal: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

export async function chatComplete(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openRouterKey()}`,
    },
    body: JSON.stringify({
      model: chatModel(),
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.1,
      max_tokens: 1500,
    }),
  });

  if (res.status === 429) throw new Error('TOO_MANY_REQUESTS');
  if (res.status === 402) throw new Error('CREDIT_EXHAUSTED');
  if (!res.ok) throw new Error(`AI Gateway chyba: ${res.status}`);

  const data = await res.json();
  return data.choices[0].message.content;
}
