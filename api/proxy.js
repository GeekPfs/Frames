const fetch = require('node-fetch');

export default async function(req, res) {
  const targetUrl = 'https://standing-gear-ccb.notion.site/101473e7a2bc8043a739c5bc4920943f' + req.url;

  try {
    const response = await fetch(targetUrl);
    const contentType = response.headers.get('content-type');
    
    // Define o cabeçalho correto para a resposta
    res.setHeader('Content-Type', contentType);
    const body = await response.buffer();
    
    // Retorna o conteúdo original com o status adequado
    res.status(response.status).send(body);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar o conteúdo.');
  }
}
