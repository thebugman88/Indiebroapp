import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

test('audio uses authenticated fetching, ignores downloads after logout and never fabricates unavailable playback', async () => {
  // Bundle the actual engine with only the authentication transport replaced.
  const { outputFiles } = await build({entryPoints:['judgement-zone/src/utils/audioEngine.ts'],bundle:true,format:'esm',platform:'node',write:false,
    plugins:[{name:'test-auth-transport',setup(b){b.onResolve({filter:/authService$/},()=>({path:'auth',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const authenticatedFetch = (...args) => globalThis.__auditAudioFetch(...args);',loader:'js'}));}}]});
  const globals=globalThis as any, oldWindow=globals.window, oldAudio=globals.Audio;
  const listeners=new Map<string,()=>void>();let plays=0;let resolves!:(r:Response)=>void;let requested='';
  globals.window={addEventListener:(name:string,fn:()=>void)=>listeners.set(name,fn),setInterval:()=>1,clearInterval:()=>{}};
  globals.Audio=class { src='';currentTime=0;crossOrigin='';play(){plays++;return Promise.resolve()}pause(){}removeAttribute(){this.src=''}};
  globals.__auditAudioFetch=async (path:string)=>{requested=path;return new Promise<Response>(r=>{resolves=r})};
  try {
    const {audioEngine}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
    audioEngine.init=()=>{};
    let failures=0;audioEngine.setCallbacks(()=>{},()=>{},()=>{failures++});
    audioEngine.loadTrack('/api/judgement/tracks/track-1/audio',60);
    const pending=audioEngine.play();assert.equal(requested,'/api/judgement/tracks/track-1/audio');
    listeners.get('ib_auth_changed')!();resolves(new Response(new Blob(['old-account-bytes'])));await pending;
    assert.equal(plays,0);
    await audioEngine.play();assert.equal(plays,0);assert.equal(failures,1);
    globals.__auditAudioFetch=async()=>new Response('unavailable',{status:503});
    audioEngine.loadTrack('/api/judgement/tracks/track-2/audio',60);await audioEngine.play();assert.equal(plays,0);assert.equal(failures,2);
    globals.__auditAudioFetch=async()=>new Response(new Blob(['audio']));
    await audioEngine.play();assert.equal(plays,1);
    audioEngine.stop();audioEngine.loadTrack(undefined,60);await audioEngine.play();assert.equal(plays,1);assert.equal(failures,3);
  } finally {
    if(oldWindow===undefined) delete globals.window;else globals.window=oldWindow;
    if(oldAudio===undefined) delete globals.Audio;else globals.Audio=oldAudio;
    delete globals.__auditAudioFetch;
  }
});
