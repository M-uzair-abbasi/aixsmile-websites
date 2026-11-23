// Vercel Routing Middleware (runs before static files).
// Markdown for agents: a request for the home page with `Accept: text/markdown`
// gets about.md (as text/markdown) instead of the HTML page. Everyone else gets the page unchanged.
export const config = { matcher: ['/', '/en/'] };

export default async function middleware(request) {
  const accept = request.headers.get('accept') || '';
  if (!/\btext\/markdown\b/i.test(accept)) {
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }
  const md = await fetch(new URL('/about.md', request.url), { headers: { accept: 'text/plain' } });
  return new Response(md.body, {
    status: md.status,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'vary': 'Accept',
      'cache-control': 'public, max-age=0, must-revalidate',
      'link': '<https://veneers-aachen.de/>; rel="canonical"',
    },
  });
}
