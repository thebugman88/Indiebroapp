const configuredBackendUrl = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export const backendUrl = configuredBackendUrl || window.location.origin;

export function backendWebSocketUrl(): string {
    const url = new URL(backendUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.toString().replace(/\/$/, '');
}

export function backendApiUrl(path: string): string {
    return `${backendUrl}${path.startsWith('/') ? path : `/${path}`}`;
}