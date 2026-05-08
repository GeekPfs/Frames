export default async function handler(req, res) {
  try {
    // Remove prefixo da rota API
    const path = req.url.replace(/^\/api\/proxy/, '');

    // Domínio original
    const targetOrigin = 'https://wisp.super.site';

    // Seu domínio atual
    const proxyOrigin =
      `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    // URL final
    const targetUrl = `${targetOrigin}${path}`;

    // Request
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
      },
    });

    const contentType = response.headers.get('content-type') || '';

    // Status original
    res.statusCode = response.status;

    // Cache CDN
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );

    // HTML
    if (contentType.includes('text/html')) {
      let body = await response.text();

      // Remove marca d’água
      body = body.replace(
        '</head>',
        `
        <style>
          .super-badge,
          a[href*="super.so"],
          a[href*="super.site"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        </style>
        </head>
        `
      );

      // Corrige assets relativos
      body = body.replace(
        /(href|src)="\/(?!\/)/g,
        `$1="${targetOrigin}/`
      );

      // Reescreve links absolutos
      body = body.replaceAll(
        targetOrigin,
        proxyOrigin
      );

      res.setHeader(
        'Content-Type',
        'text/html; charset=utf-8'
      );

      return res.send(body);
    }

    // Assets: stream direto
    res.setHeader('Content-Type', contentType);

    response.body.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}
