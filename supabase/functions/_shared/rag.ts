import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.108.2';

declare const Supabase: {
  ai: { Session: new (model: string) => { run(input: string, options: Record<string, unknown>): Promise<number[]> } };
};

export async function embedText(text: string): Promise<number[]> {
  const model = new Supabase.ai.Session('gte-small');
  return await model.run(text, { mean_pool: true, normalize: true });
}

export async function retrieveContext(client: SupabaseClient, query: string): Promise<string[]> {
  try {
    const embedding = await embedText(query);
    const { data, error } = await client.rpc('match_knowledge_embeddings', {
      p_embedding: embedding,
      p_match_threshold: 0.25,
      p_match_count: 3,
    });
    if (error) throw error;
    return (data ?? []).map((row: { content: string }) => row.content);
  } catch {
    return [];
  }
}
