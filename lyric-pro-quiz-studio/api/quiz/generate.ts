import type { IncomingMessage, ServerResponse } from 'node:http';

// The authenticated root suite owns AI quota, billing, and provider calls.
// Never expose this obsolete standalone route as an unmetered alternative.
export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ error: 'Use the authenticated IndieBrotherhood suite.' }));
}
