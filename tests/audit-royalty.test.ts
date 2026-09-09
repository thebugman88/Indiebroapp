import {testBrowserSession} from './private-fixture';
import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDB } from 'idb';
import { createRoyaltyStorage, DEFAULT_SETTINGS } from '../royalty-and-isrc-metadata-extractor/src/services/storage';

test('RoyaltyOps isolates files, tracks, settings and resets across account switches', async () => {
  await testBrowserSession('royalty-a');
  let session=1;
  const a=createRoyaltyStorage('royalty-a',()=>session===1);
  const file={id:'same-id',dataUrl:'data:audio/private-a',trackCount:1} as any;
  const track={id:'same-id',fileId:'same-id',title:'Private A',folderId:null} as any;
  await a.saveFile(file);await a.saveTrack(track);
  await a.saveSettings({...DEFAULT_SETTINGS,ocrLanguage:'fra',geminiApiKey:'must-not-persist'});
  await testBrowserSession('royalty-b');
  session=2;const b=createRoyaltyStorage('royalty-b',()=>session===2);
  assert.deepEqual(await b.getAllFiles(),[]);assert.deepEqual(await b.getAllTracks(),[]);
  assert.equal((await b.getSettings()).ocrLanguage,'eng');
  await b.saveTrack({...track,title:'Private B'});await b.clearAllData();
  for(const action of [()=>a.saveFile(file),()=>a.saveTrack(track),()=>a.clearAllData(),()=>a.getAllTracks()]) await assert.rejects(action,/Account changed/);
  await testBrowserSession('royalty-a');
  session=3;const returning=createRoyaltyStorage('royalty-a',()=>session===3);
  assert.deepEqual(await returning.getAllFiles(),[file]); assert.deepEqual(await returning.getAllTracks(),[track]);
  assert.equal((await returning.getSettings()).ocrLanguage,'fra');assert.equal((await returning.getSettings()).geminiApiKey,'');
  await assert.rejects(()=>a.saveTrack(track),/Account changed/);
  const guest=createRoyaltyStorage('guest',()=>true);await assert.rejects(()=>guest.saveTrack(track),/Sign in/);
});

test('RoyaltyOps does not adopt legacy files and rejects a save when account changes during database open', async () => {
  const legacy=await openDB('royalty_isrc_extractor_db',1,{upgrade(db){db.createObjectStore('files',{keyPath:'id'})}});
  await legacy.put('files',{id:'legacy',dataUrl:'private legacy bytes'});
  await testBrowserSession('new-account');
  const clean=createRoyaltyStorage('new-account',()=>true);
  assert.deepEqual(await clean.getAllFiles(),[]);await clean.clearAllData();
  assert.equal((await legacy.get('files','legacy')).dataUrl,'private legacy bytes');legacy.close();
  await testBrowserSession('delayed-owner');
  let active=true, release!:()=>void;
  const gate=new Promise<void>(r=>{release=r});
  const delayed=(async (...args:any[])=>{await gate;return (openDB as any)(...args)}) as typeof openDB;
  const old=createRoyaltyStorage('delayed-owner',()=>active,delayed);
  const pending=old.saveTrack({id:'late',title:'must not be written'} as any);
  active=false;release();await assert.rejects(pending,/Account changed/);
  assert.deepEqual(await createRoyaltyStorage('delayed-owner',()=>true).getAllTracks(),[]);
});
