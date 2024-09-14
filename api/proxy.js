const fetch = require('node-fetch');

export default async function(req, res) {
  const targetUrl = 'https://paginaoriginal.com' + req.url;

  const response = await fetch(targetUrl);
  const contentType = response.headers.get('content-type');

  res.setHeader('Content-Type', contentType);  // Define o header correto
  const body = await response.buffer();
  
  res.status(response.status).send(body);
}
