// Suite authentication tokens are sent only to this origin.
export const backendUrl = window.location.origin;
export function backendWebSocketUrl(): string {
  const url = new URL('/ws/hangout', backendUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
export function backendApiUrl(path: string): string { return new URL(path, backendUrl).toString(); }
