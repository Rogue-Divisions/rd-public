import test from 'node:test';
import assert from 'node:assert/strict';
import gate from './worker.mjs';
const base='https://client.roguedivisions.com';
const env={C3_PASSWORD_HASH:'synthetic:deadbeef',C3_SESSION_SECRET:'synthetic-key-at-least-32-characters',ASSETS:{fetch:async()=>new Response('asset')},C3_LOGIN_LIMITER:{limit:async()=>({success:true})}};
test('login preserves same-origin form Origin without leaking referrer across origins',async()=>{const r=await gate.fetch(new Request(base+'/c3/reporting/'),env);assert.equal(r.headers.get('Referrer-Policy'),'same-origin')});
test('null and cross-site origins remain rejected',async()=>{for(const origin of ['null','https://other.invalid']){const r=await gate.fetch(new Request(base+'/c3/reporting/_session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:'password=test'}),env);assert.equal(r.status,403)}});
