import fetch from 'node-fetch';

export default async function handler(req, res) {
  const url = `https://technological-marten.super.site/${req.url}`;
  const response = await fetch(url);
  const content = await response.text();
  res.setHeader('Content-Type', response.headers.get('Content-Type'));
  res.send(content);
}
