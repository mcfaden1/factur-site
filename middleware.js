// Vercel Routing Middleware: counts page requests to www.factur.art, including
// visitors that run no JavaScript (most AI agents, which Cloudflare Web
// Analytics can't see). For each matched request it sends one small line to
// api.factur.art/api/hit, where traffic_report.py reads it for the weekly
// report. It never changes the response: it returns nothing, so the request
// continues as before, and any failure is swallowed.
export const config = {
  matcher: ['/', '/piece/:n*', '/llms.txt', '/robots.txt', '/agents/:path*'],
};

const HIT_URL = 'https://api.factur.art/api/hit';

export default function middleware(request, context) {
  try {
    const h = request.headers;
    const url = new URL(request.url);
    const body = JSON.stringify({
      path: url.pathname,
      ua: h.get('user-agent') || '',
      ref: h.get('referer') || '',
      country: h.get('x-vercel-ip-country') || '',
      ip: h.get('x-real-ip') || (h.get('x-forwarded-for') || '').split(',')[0].trim(),
      owner: url.searchParams.has('owner') || /(?:^|;\s*)factur_owner=1/.test(h.get('cookie') || ''),
      dest: h.get('sec-fetch-dest') || '',
    });
    const send = fetch(HIT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      signal: AbortSignal.timeout(2000),
    }).catch(() => {});
    if (context && typeof context.waitUntil === 'function') context.waitUntil(send);
  } catch (e) {
    // never block the page
  }
}
