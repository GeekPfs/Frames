export default async function handler(req, res) {
  try {
    const path = req.url.replace(/^\/api\/proxy/, '');

    const targetUrl =
      `https://technological-marten.super.site${path}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
      },
    });

    const contentType =
      response.headers.get('content-type') || '';

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
          a[href*="super.so"] {
            display: none !important;
          }
        </style>
        </head>
        `
      );

      // Corrige assets relativos
      body = body.replace(
        /(href|src)="\/(?!\/)/g,
        `$1="https://technological-marten.super.site/`
      );

      res.setHeader(
        'Content-Type',
        'text/html; charset=utf-8'
      );

      return res.send(body);
    }

    // Assets
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', contentType);

    return res.send(buffer);

  } catch (error) {
    console.error(error);

    return res.status(500).send('Internal Server Error');
  }
}
