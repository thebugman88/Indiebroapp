import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('large JSON bodies are limited to authenticated audio-upload routes', () => {
  const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const analyze = source.indexOf("app.use('/api/analyze', express.json({ limit: '22mb' }))");
  const judgement = source.indexOf("app.use('/api/judgement/tracks', express.json({ limit: '22mb' }))");
  const defaultLimit = source.indexOf("app.use(express.json({ limit: '1mb' }))");

  assert.ok(analyze >= 0, 'Hit Analyzer must retain its bounded audio allowance');
  assert.ok(judgement >= 0, 'Judgement uploads must retain their bounded audio allowance');
  assert.ok(defaultLimit > analyze && defaultLimit > judgement, 'the small default parser must follow route parsers');
  assert.equal(source.includes("app.use(express.json({ limit: '22mb' }))"), false, 'large parsing must not be global');
});
