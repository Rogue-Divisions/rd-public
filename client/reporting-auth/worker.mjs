import { C3_HOST, c3Portal } from './c3-host.mjs';
// Prepared for the existing client site's owner. No secret or CRM content in this module.
const PREFIX='/c3/reporting';
const COOKIE='__Secure-c3-reporting';
const TTL=8*60*60;
const enc=new TextEncoder();
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const equal=(a,b)=>{let d=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return salt+':'+hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256));}
async function hmac(value,env){const key=await crypto.subtle.importKey('raw',enc.encode(env.C3_SESSION_SECRET+'|'+env.C3_PASSWORD_HASH),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,enc.encode(value)));}
async function validSession(req,env,now){const cookie=req.headers.get('Cookie')||'';const token=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token)return false;const parts=token.split('.');if(parts.length!==2||!/^\d+$/.test(parts[0])||!/^[a-f0-9]{64}$/.test(parts[1]))return false;const expires=Number(parts[0]);return expires>now&&expires<=now+TTL&&equal(parts[1],await hmac(PREFIX+'|'+parts[0],env));}
function secure(response){const h=new Headers(response.headers);h.set('Cache-Control','private, no-store');h.set('Vary','Cookie');h.set('X-Robots-Tag','noindex, nofollow, noarchive');h.set('Referrer-Policy','same-origin');h.set('X-Content-Type-Options','nosniff');h.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");return new Response(response.body,{status:response.status,headers:h});}
function login(message='',status=401,concept=false){return secure(new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C3 Reporting & Forecasting</title><style>body{font:16px Arial,sans-serif;background:#f5f5f4;color:#191919;margin:0}header{background:#191919;color:white;padding:24px 7vw}main{max-width:380px;margin:12vh auto;padding:30px}h1{font-size:29px;letter-spacing:-1px}label{display:block;font-size:14px;margin:25px 0 9px}input,button{box-sizing:border-box;width:100%;padding:13px;font:inherit}input{border:1px solid #bbb}button{margin-top:15px;background:#1863dc;color:white;border:0;cursor:pointer}p{font-size:14px;color:#666;line-height:1.6}.error{color:#9a3412}</style><header>C3.ai · Reporting & Forecasting</header><main><h1>Your reporting workspace.</h1><p>Enter the password shared with you to open the reporting preview.</p>${message?'<p class="error">'+escape(message)+'</p>':''}<form method="post" action="${PREFIX}/_session${concept?'?view=concept':''}"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button>Open reports</button></form></main></html>`,{status,headers:{'Content-Type':'text/html;charset=utf-8'}}));}
export default {async fetch(request,env){
 const u=new URL(request.url);let path;try{path=new URL(decodeURIComponent(u.pathname).replace(/\\/g,'/').replace(/\/+/g,'/'),u.origin).pathname}catch{return new Response('Invalid path',{status:400})}
 const protectedPath=path===PREFIX||path.startsWith(PREFIX+'/');
 if(!protectedPath)return u.hostname===C3_HOST ? c3Portal(request,env,path) : env.ASSETS.fetch(request); // Existing unrelated client publications stay unchanged.
 if(u.protocol!=='https:')return new Response('HTTPS required',{status:400});
 if(!env.C3_PASSWORD_HASH||!env.C3_SESSION_SECRET||env.C3_SESSION_SECRET.length<32)return secure(new Response('Reporting access is not configured.',{status:503}));
 const now=Math.floor(Date.now()/1000);
 if(path===PREFIX+'/_session'){
  if(request.method!=='POST')return secure(new Response('Method not allowed',{status:405}));
  if(request.headers.get('Origin')!==u.origin)return secure(new Response('Invalid origin',{status:403}));
  if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return secure(new Response('Unsupported form',{status:415}));
  if(!env.C3_LOGIN_LIMITER)return secure(new Response('Reporting access is not configured.',{status:503}));
  try{const {success}=await env.C3_LOGIN_LIMITER.limit({key:PREFIX+'/_session'});if(!success)return secure(new Response('Too many attempts. Please wait a minute.',{status:429,headers:{'Retry-After':'60'}}));}catch{return secure(new Response('Reporting access is temporarily unavailable.',{status:503}));}
  const body=await request.text();if(body.length>4096)return secure(new Response('Form too large',{status:413}));
  const password=new URLSearchParams(body).get('password')||'';if(!password||password.length>256)return login('The password was not recognised.',401,u.searchParams.get('view')==='concept');
  const salt=env.C3_PASSWORD_HASH.split(':')[0];const digest=await passwordHash(password,salt);
  if(!equal(digest,env.C3_PASSWORD_HASH))return login('The password was not recognised.',401,u.searchParams.get('view')==='concept');
  const expiry=String(now+TTL),token=expiry+'.'+await hmac(PREFIX+'|'+expiry,env);
  return secure(new Response(null,{status:303,headers:{Location:PREFIX+(u.searchParams.get('view')==='concept'?'/concept/':'/'), 'Set-Cookie':`${COOKIE}=${token}; Path=${PREFIX}; Secure; HttpOnly; SameSite=Strict; Max-Age=${TTL}`}}));
 }
 if(!['GET','HEAD'].includes(request.method))return secure(new Response('Method not allowed',{status:405}));
 if(!await validSession(request,env,now)){
  if([PREFIX,PREFIX+'/',PREFIX+'/concept',PREFIX+'/concept/',PREFIX+'/concept/index.html'].includes(path))return request.method==='HEAD'?secure(new Response(null,{status:401})):login('',401,path.startsWith(PREFIX+'/concept'));
  return secure(new Response('Password required.',{status:401}));
 }
 if(path===PREFIX)return secure(new Response(null,{status:308,headers:{Location:PREFIX+'/'}}));
 return secure(await env.ASSETS.fetch(request));
}};
