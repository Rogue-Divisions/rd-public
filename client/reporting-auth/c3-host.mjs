// C3-only presentation under its dedicated hostname. The edge C3 Access app
// protects this portal prefix; reporting retains its separate password gate.
export const C3_HOST = 'c3ai.roguedivisions.com';
const PORTAL = '/c3/portal';
const BRANDED = PORTAL + '/c3ai';
const FILES = new Set([
  'index.html', 'v2.html', 'v3.html', 'v3-start.html', 'reporting.html',
  'workspace.html', 'workspace-guide.html', 'product.css', 'v3.css',
  'navigation.css', 'navigation.js', 'modules.css', 'c3-brand.css',
  'assets/c3-logo.png', 'assets/fonts/Poppins-Bold.ttf',
  'assets/fonts/Poppins-Medium.ttf', 'assets/fonts/Poppins-Regular.ttf',
  'assets/fonts/Poppins-SemiBold.ttf', 'story/index.html',
  'story/pipeline.html', 'story/reporting.html', 'story/story.css',
]);
export async function c3Portal(request, env, path) {
  const url = new URL(request.url);
  const noStore = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' };
  if (url.protocol !== 'https:') { url.protocol='https:'; return new Response(null,{status:308,headers:{...noStore,Location:url.toString()}}); }
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status:405, headers:{...noStore,Allow:'GET, HEAD'} });
  if (path === '/' || path === '/c3' || path === '/c3/' || path === PORTAL) {
    return new Response(null,{status:302,headers:{...noStore,Location:PORTAL+'/'}});
  }
  if (!path.startsWith(PORTAL+'/')) return new Response('Not found',{status:404,headers:noStore});
  const suffix = path.slice(PORTAL.length+1);
  // Fixed asset admission prevents the host alias becoming a route around
  // reporting's password guard or exposing unrelated client publications.
  const admitted = FILES.has(suffix) || FILES.has(suffix+'index.html') || FILES.has(suffix+'.html');
  if (!admitted) return new Response('Not found',{status:404,headers:noStore});
  url.pathname = BRANDED + '/' + suffix;
  const result = await env.ASSETS.fetch(new Request(url,request));
  const headers = new Headers(result.headers);
  for (const [key,value] of Object.entries(noStore)) headers.set(key,value);
  const location = headers.get('Location');
  if (location) {
    const redirect = new URL(location,url);
    if (redirect.origin !== url.origin || !(redirect.pathname === BRANDED || redirect.pathname.startsWith(BRANDED+'/'))) {
      return new Response('Invalid asset redirect',{status:502,headers:noStore});
    }
    redirect.pathname = PORTAL + redirect.pathname.slice(BRANDED.length);
    headers.set('Location',redirect.pathname+redirect.search+redirect.hash);
  }
  return new Response(result.body,{status:result.status,headers});
}
