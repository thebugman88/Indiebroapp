export const LYRIC_RETENTION_MS = 24 * 60 * 60 * 1000;
export const MAX_LYRIC_PAIRS = 5; // Ten individual songs, A and B per generation.
export function retainLyricPairs<T extends { id: string; timestamp: number }>(
  entries: T[],
  now = Date.now(),
): T[] {
  const ids = new Set<string>();
  return entries
    .filter(
      (e) =>
        e &&
        typeof e.id === "string" &&
        Number.isFinite(e.timestamp) &&
        e.timestamp <= now &&
        e.timestamp + LYRIC_RETENTION_MS > now,
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((e) => {
      if (ids.has(e.id)) return false;
      ids.add(e.id);
      return true;
    })
    .slice(0, MAX_LYRIC_PAIRS);
}
