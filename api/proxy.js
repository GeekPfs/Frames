export default async function handler(req, res) {
  const url = `https://technological-marten.super.site/${req.url}`;

  try {
    const response = await fetch(url);
    let body = await response.text();

    // Remove ou modifica cabeçalhos que podem bloquear iframes
    body = body.replace(
      /<meta http-equiv="Content-Security-Policy"[^>]*>/gi,
      '<meta http-equiv="Content-Security-Policy" content="frame-ancestors *;">'
    ).replace(
      /<meta http-equiv="X-Frame-Options"[^>]*>/gi,
      ''
    );

    // Adiciona o CSS para esconder a marca d'água
    const modifiedBody = body.replace(
      '</head>',
      '<style>.super-badge { display: none !important; }</style></head>'
    );

    res.setHeader('Content-Type', 'text/html');
    res.status(response.status).send(modifiedBody);
  } catch (error) {
    console.error('Error fetching the page:', error);
    res.status(500).send('Error fetching the page');
  }
}
