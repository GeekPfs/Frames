export default async function handler(req, res) {
  try {
    // Remove a rota da API
    const path = req.url.replace(/^\/api\/proxy/, '') || '/';

    // Domínio do Super
    const origin = 'https://wisp.super.site';

    // URL final
    const targetUrl = `${origin}${path}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
      },
    });

    const contentType = response.headers.get('content-type') || '';

    res.status(response.status);

    // Cache CDN
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );

    // HTML
    if (contentType.includes('text/html')) {
      let body = await response.text();

      // Remove badge
      body = body.replace(
        '</head>',
        `
        <style>
          .super-badge,
          a[href*="super.so"],
          a[href*="super.site"][style*="position: fixed"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        </style>
        </head>
        `
      );

      // Faz links internos continuarem no proxy
      body = body.replace(
        /href="https:\/\/wisp\.super\.site(.*?)"/g,
        'href="/api/proxy$1"'
      );

      body = body.replace(
        /href="\/(?!\/)(.*?)"/g,
        'href="/api/proxy/$1"'
      );

      // Corrige assets absolutos
      body = body.replace(
        /(src|href)="\/_next\//g,
        `$1="${origin}/_next/`
      );

      body = body.replace(
        /(src|href)="\/images\//g,
        `$1="${origin}/images/`
      );

      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      return res.send(body);
    }

    // Stream de assets
    res.setHeader('Content-Type', contentType);

    if (response.body) {
      response.body.pipe(res);
    } else {
      res.end();
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}
