export class SessionCancelledError extends Error {
  constructor() {
    super('Audio session changed before the operation completed.');
    this.name = 'SessionCancelledError';
  }
}

export interface SessionToken {
  isActive(): boolean;
  throwIfCancelled(): void;
}

export class AudioSessionGuard {
  private generation = 0;
  private listeners = new Set<() => void>();
  private objectUrls = new Set<string>();

  capture(): SessionToken {
    const captured = this.generation;
    return {
      isActive: () => captured === this.generation,
      throwIfCancelled: () => {
        if (captured !== this.generation) throw new SessionCancelledError();
      },
    };
  }

  invalidate(): void {
    this.generation += 1;
    for (const url of this.objectUrls) URL.revokeObjectURL(url);
    this.objectUrls.clear();
    for (const listener of this.listeners) listener();
  }

  trackObjectUrl(url: string): void {
    this.objectUrls.add(url);
  }

  releaseObjectUrl(url: string): void {
    if (this.objectUrls.delete(url)) URL.revokeObjectURL(url);
  }

  onInvalidate(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export async function createGuardedObjectUrl<T>(options: {
  token: SessionToken;
  prepare: () => Promise<T>;
  createObjectUrl: (value: T) => string;
  trackObjectUrl?: (url: string) => void;
  revokeObjectUrl?: (url: string) => void;
}): Promise<string | null> {
  const value = await options.prepare();
  if (!options.token.isActive()) return null;
  const url = options.createObjectUrl(value);
  options.trackObjectUrl?.(url);
  if (!options.token.isActive()) {
    (options.revokeObjectUrl || URL.revokeObjectURL)(url);
    return null;
  }
  return url;
}
