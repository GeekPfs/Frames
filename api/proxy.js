export default async function handler(req, res) {
  try {
    // Remove o prefixo da API da URL
    const path = req.url.replace(/^\/api\/proxy/, '');

    // URL do Super
    const targetUrl = `https://technological-marten.super.site${path}`;

    // Faz a requisição
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
      },
    });

    // Copia status
    res.statusCode = response.status;

    // Cache agressivo na CDN da Vercel
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );

    // Copia content-type original
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      // Só processa HTML
      let body = await response.text();

      // Remove badge do Super
      body = body.replace(
        '</head>',
        `
        <style>
          .super-badge,
          a[href*="super.so"] {
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
      body = body
        .replace(/(href|src)="\/(?!\/)/g, `$1="https://technological-marten.super.site/`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      return res.send(body);
    }

    // Assets NÃO passam por replace
    // Stream direto = muito mais rápido
    res.setHeader('Content-Type', contentType);

    response.body.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}
