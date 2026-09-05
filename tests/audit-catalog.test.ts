import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createArtistCatalog } from '../src/services/artistCatalog';
const artist = { artistName: 'Private artist', artistId: '1', primaryGenreName: 'Rap', artworkUrl: '', claimedAt: 1, totalCatalogTracks: 1 };
const track = { trackId: 'song-1', trackName: 'Private song', artistName: 'Private artist' } as any;
test('catalogs isolate accounts, preserve legacy data and reject stale saves after logout', () => {
  const data = new Map([['ib_artist_verified_catalog_v2','legacy private song']]);
  const storage = {getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
  let session=1;
  const a=createArtistCatalog('a',()=>session===1,()=>storage);a.save(artist,[track]);
  session=2;const b=createArtistCatalog('b',()=>session===2,()=>storage);
  assert.deepEqual(b.load().tracks,[]);b.save(artist,[]);
  assert.throws(()=>a.save(artist,[]),/Account changed/);assert.throws(()=>a.load(),/Account changed/);
  session=3;const guest=createArtistCatalog('guest',()=>true,()=>storage);
  assert.deepEqual(guest.load().tracks,[]);assert.throws(()=>guest.save(artist,[track]),/Sign in/);
  const returning=createArtistCatalog('a',()=>session===3,()=>storage);
  assert.deepEqual(returning.load().tracks,[track]); assert.throws(()=>a.add(track),/Account changed/);
  assert.equal(data.get('ib_artist_verified_catalog_v2'),'legacy private song');
});
test('corrupt or foreign catalogs and storage failures never silently overwrite data', () => {
  let raw='{"version":1,"ownerUid":"other","artist":null,"tracks":[]}';
  const v=createArtistCatalog('a',()=>true,()=>({getItem:()=>raw,setItem:(k,v)=>{raw=v}}));
  assert.throws(()=>v.save(artist,[]),/invalid/); assert.equal(JSON.parse(raw).ownerUid,'other');
  raw='{broken'; assert.throws(()=>v.save(artist,[])); assert.equal(raw,'{broken');
  const fail=createArtistCatalog('a',()=>true,()=>({getItem:()=>null,setItem:()=>{throw new Error('quota')}}));
  assert.throws(()=>fail.save(artist,[track]),/quota/);
});
