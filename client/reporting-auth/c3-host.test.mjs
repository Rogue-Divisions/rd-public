import test from 'node:test';
import assert from 'node:assert/strict';
import gate,{passwordHash} from './worker.mjs';
const base='https://c3ai.roguedivisions.com';
const requests=[];
const env={ASSETS:{fetch:async request=>{requests.push(request.url);return new Response('asset')}},C3_SESSION_SECRET:'SYNTHETIC-session-secret-only-123456789',C3_PASSWORD_HASH:await passwordHash('SYNTHETIC-password','synthetic-salt'),C3_LOGIN_LIMITER:{limit:async()=>({success:true})}};
test('dedicated root enters the scoped Access portal',async()=>{const r=await gate.fetch(new Request(base+'/'),env);assert.equal(r.status,302);assert.equal(r.headers.get('Location'),'/c3/portal/');});
test('dedicated portal maps only to branded assets with private cache',async()=>{requests.length=0;const r=await gate.fetch(new Request(base+'/c3/portal/story/reporting.html'),env);assert.equal(r.status,200);assert.equal(requests[0],base+'/c3/portal/c3ai/story/reporting.html');assert.equal(r.headers.get('Cache-Control'),'private, no-store');});
test('canonical asset redirects retain external path',async()=>{const r=await gate.fetch(new Request(base+'/c3/portal/v3.html'),{...env,ASSETS:{fetch:async()=>new Response(null,{status:307,headers:{Location:'/c3/portal/c3ai/v3'}})}});assert.equal(r.headers.get('Location'),'/c3/portal/v3');});
test('unknown or nested alias files cannot reach assets',async()=>{requests.length=0;for(const path of ['/c3/london-accelerator-day-2026/','/c3/portal/c3ai/index.html','/c3/portal/unknown.json'])assert.equal((await gate.fetch(new Request(base+path),env)).status,404);assert.equal(requests.length,0);});
test('reporting password remains ahead of host mapping',async()=>{requests.length=0;const r=await gate.fetch(new Request(base+'/c3/reporting/'),env);assert.equal(r.status,401);assert((await r.text()).includes('type="password"'));assert.equal(requests.length,0);});
test('old client host asset request stays unchanged',async()=>{requests.length=0;await gate.fetch(new Request('https://client.roguedivisions.com/c3/portal/index.html'),env);assert.equal(requests[0],'https://client.roguedivisions.com/c3/portal/index.html');});

test('dedicated portal upgrades HTTP before reading assets',async()=>{requests.length=0;const r=await gate.fetch(new Request('http://c3ai.roguedivisions.com/c3/portal/'),env);assert.equal(r.status,308);assert(r.headers.get('Location').startsWith('https:'));assert.equal(requests.length,0);});

test('research page uses only the admitted branded file and preserves private headers',async()=>{requests.length=0;const r=await gate.fetch(new Request(base+'/c3/portal/research/'),env);assert.equal(r.status,200);assert.equal(requests[0],base+'/c3/portal/c3ai/research/');assert.equal(r.headers.get('Cache-Control'),'private, no-store');assert.equal(r.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');requests.length=0;const unknown=await gate.fetch(new Request(base+'/c3/portal/research/private.json'),env);assert.equal(unknown.status,404);assert.equal(requests.length,0);});

test('separate research review admits its exact page and script without exposing other files',async()=>{
  for(const suffix of ['research-next/','research-next/explorer.js']){
    requests.length=0;
    const response=await gate.fetch(new Request(base+'/c3/portal/'+suffix),env);
    assert.equal(response.status,200);
    assert.equal(requests[0],base+'/c3/portal/c3ai/'+suffix);
    assert.equal(response.headers.get('Cache-Control'),'private, no-store');
    assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');
  }
  requests.length=0;
  for(const suffix of ['research-next/raw.json','research-next/private/index.html']){
    assert.equal((await gate.fetch(new Request(base+'/c3/portal/'+suffix),env)).status,404);
  }
  assert.equal(requests.length,0);
});
