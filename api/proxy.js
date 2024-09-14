import fetch from 'node-fetch';

export default async function handler(req, res) {
  const targetUrl = 'https://standing-gear-ccb.notion.site/Green-Home-101473e7a2bc8043a739c5bc4920943f';

  try {
    const response = await fetch(targetUrl + req.url, {
      method: req.method,
      headers: req.headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'text/html';
    res.setHeader('Content-Type', contentType);

    const body = await response.text();
    res.status(response.status).send(body);
  } catch (error) {
    console.error('Erro ao buscar a página:', error);
    res.status(500).send('Erro no proxy.');
  }
}
