import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

test('rate limits expire, cancellation stays reachable, and unblocks survive restart', async t => {
  const cwd = process.cwd(), dir = mkdtempSync(join(tmpdir(), 'ib-sentinel-test-'));
  const moduleUrl = pathToFileURL(resolve('server/codeSentinel.ts')).href;
  const loader = resolve('node_modules/tsx/dist/loader.mjs');
  process.chdir(dir);
  try {
    const m = await import(moduleUrl);
    let now = Date.now();
    t.mock.method(Date, 'now', () => now);
    const request = (uid: string, endpoint = '/api/health', method = 'GET') => {
      let status = 200, body: any, next = false; const headers: Record<string, any> = {};
      m.codeSentinelMiddleware({ip: '127.0.0.1', socket: {}, headers: {}, originalUrl: endpoint, url: endpoint, method, query: {}, params: {}} as any,
        {locals: {identity: {uid, email_verified: true}}, status(n: number){status=n;return this}, json(b: any){body=b;return this}, setHeader(k: string,v: any){headers[k]=v}} as any,
        () => {next=true});
      return {status,body,next,headers};
    };
    for (let i=0;i<120;i++) assert.equal(request('a').next,true);
    assert.equal(request('a').status,429); assert.equal(m.getSecurityStats().activeQuarantinedIps,0);
    assert.equal(request('b').next,true);
    assert.equal(request('a','/API/STRIPE/CANCEL/','POST').next,true);
    now += 60001; assert.equal(request('a').next,true);
    const block = (uid: string) => m.recordSecurityIncident({threatOriginIp:`uid:${uid}`,endpoint:'/api/test',method:'POST',severity:'HIGH',threatType:'TEST_THREAT',rawSignatureExcerpt:'test',actionTaken:'BLOCKED_AND_QUARANTINED',recommendedRemediation:'test'});
    block('a'); assert.equal(request('a').status,403); assert.ok(request('a').headers['Retry-After'] > 0);
    assert.equal(request('a','/api/stripe/cancel','POST').next,true);
    for (let i=0;i<9;i++) assert.equal(request('a','/api/stripe/cancel','POST').next,true);
    assert.equal(request('a','/api/stripe/cancel','POST').status,429);
    now+=60001; assert.equal(request('a','/api/stripe/cancel','POST').next,true);
    now+=300001; assert.equal(request('a').next,true);
    block('a'); assert.equal(m.remediateUnquarantineIp('uid:a'),true);
    assert.equal(request('a').next,true);
    const child = spawnSync(process.execPath,['--import',loader,'--input-type=module','-e',`const m=await import(${JSON.stringify(moduleUrl)});console.log(JSON.stringify(m.getSecurityStats().quarantinedIps))`],{cwd:dir,encoding:'utf8'});
    assert.equal(child.status,0,child.stderr); assert.deepEqual(JSON.parse(child.stdout),[]);
  } finally { t.mock.restoreAll(); process.chdir(cwd); rmSync(dir,{recursive:true,force:true}); }
});
