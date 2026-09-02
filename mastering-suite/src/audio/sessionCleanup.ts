export interface ReleasableAudioNode { disconnect: () => void }
export interface ReleasableSource extends ReleasableAudioNode { stop: () => void }
export interface ReleasableContext { close: () => Promise<void> }

export async function releaseAudioSession(session: {
  source?: ReleasableSource | null;
  nodes?: Array<ReleasableAudioNode | null | undefined>;
  context?: ReleasableContext | null;
  objectUrls?: Iterable<string | null | undefined>;
}): Promise<void> {
  try { session.source?.stop(); } catch { /* already stopped */ }
  try { session.source?.disconnect(); } catch { /* already disconnected */ }
  for (const node of session.nodes || []) {
    try { node?.disconnect(); } catch { /* already disconnected */ }
  }
  for (const url of session.objectUrls || []) {
    if (url) URL.revokeObjectURL(url);
  }
  try { await session.context?.close(); } catch { /* context may already be closed */ }
}
