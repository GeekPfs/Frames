export default async function handler(req, res) {
  const url = `https://technological-marten.super.site/${req.url}`;

  try {
    const response = await fetch(url);
    const body = await response.text();

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
