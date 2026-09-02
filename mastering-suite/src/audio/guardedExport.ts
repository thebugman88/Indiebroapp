import { SessionToken } from './sessionGuard';

export async function runGuardedExport<TRendered, TEncoded>(options: {
  token: SessionToken;
  render: () => Promise<TRendered>;
  encode: (rendered: TRendered) => TEncoded | Promise<TEncoded>;
  createObjectUrl: (encoded: TEncoded) => string;
  trackObjectUrl?: (url: string) => void;
  revokeObjectUrl: (url: string) => void;
  triggerDownload: (url: string) => void;
}): Promise<string> {
  options.token.throwIfCancelled();
  const rendered = await options.render();
  options.token.throwIfCancelled();
  const encoded = await options.encode(rendered);
  options.token.throwIfCancelled();
  const url = options.createObjectUrl(encoded);
  options.trackObjectUrl?.(url);
  if (!options.token.isActive()) {
    options.revokeObjectUrl(url);
    options.token.throwIfCancelled();
  }
  try {
    options.token.throwIfCancelled();
    options.triggerDownload(url);
    return url;
  } catch (error) {
    options.revokeObjectUrl(url);
    throw error;
  }
}
