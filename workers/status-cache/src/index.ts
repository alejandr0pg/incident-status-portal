export interface Env {
  UPSTREAM_URL: string;
  CACHE_TTL: string;
}

const CACHE_KEY_PREFIX = 'incidents-status-';

async function fetchFromUpstream(upstreamUrl: string): Promise<Response> {
  const url = `${upstreamUrl}/public/status`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Forwarded-By': 'cloudflare-worker',
    },
  });

  if (!response.ok) {
    throw new Error(`Upstream error: ${response.status} ${response.statusText}`);
  }

  return response;
}

function buildCachedResponse(body: string, ttl: number, cfRay: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${ttl}`,
      'X-Cache': 'HIT',
      'X-Cache-TTL': String(ttl),
      'CF-Ray': cfRay,
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function buildMissResponse(body: string, ttl: number, cfRay: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${ttl}`,
      'X-Cache': 'MISS',
      'X-Cache-TTL': String(ttl),
      'CF-Ray': cfRay,
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function buildErrorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message, timestamp: new Date().toISOString() }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'BYPASS',
      },
    },
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const cfRay = request.headers.get('CF-Ray') ?? crypto.randomUUID();
    const cacheTtl = parseInt(env.CACHE_TTL ?? '60', 10);

    if (!url.pathname.endsWith('/status')) {
      return buildErrorResponse('Not found', 404);
    }

    if (request.method !== 'GET') {
      return buildErrorResponse('Method not allowed', 405);
    }

    const cache = caches.default;
    const cacheKey = new Request(`${CACHE_KEY_PREFIX}${url.pathname}`, { method: 'GET' });

    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const body = await cachedResponse.text();
      return buildCachedResponse(body, cacheTtl, cfRay);
    }

    try {
      const upstreamResponse = await fetchFromUpstream(env.UPSTREAM_URL);
      const body = await upstreamResponse.text();

      const responseToCache = new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${cacheTtl}`,
        },
      });

      ctx.waitUntil(cache.put(cacheKey, responseToCache));

      return buildMissResponse(body, cacheTtl, cfRay);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return buildErrorResponse(`Upstream unavailable: ${message}`, 503);
    }
  },
};
