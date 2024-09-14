const fetch = require('node-fetch');

export default async function(req, res) {
  const targetUrl = 'https://standing-gear-ccb.notion.site/Green-Home-101473e7a2bc8043a739c5bc4920943f' + req.url;

  try {
    const response = await fetch(targetUrl);
    const contentType = response.headers.get('content-type');

    // Define o tipo correto de conteúdo para o arquivo
    res.setHeader('Content-Type', contentType);

    const body = await response.buffer();
    res.status(response.status).send(body);
  } catch (error) {
    console.error('Erro ao buscar a página:', error);
    res.status(500).send('Erro no proxy.');
  }
}
