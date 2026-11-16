const EMBEDDING_MODEL = "text-embedding-3-small";

type OpenAiEmbeddingsResponse = {
  data?: Array<{ embedding?: number[] }>;
  error?: { message?: string };
};

/** Embed a query with the same model used to build embedding_document. */
export async function embedQuery(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetchImpl("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: query,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | OpenAiEmbeddingsResponse
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        `OpenAI embeddings failed (${response.status}).`,
    );
  }

  const embedding = payload?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("OpenAI embeddings response was empty.");
  }

  return embedding;
}
