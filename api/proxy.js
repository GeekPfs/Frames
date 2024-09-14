const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const url = 'https://paginaoriginal.com' + req.url;
  try {
    const response = await fetch(url);
    const text = await response.text();

    // Adicione o CSS diretamente ao HTML retornado
    const modifiedText = text.replace(
      '</head>',
      `<style>
        .super-badge {
          display: none !important;
        }
      </style></head>`
    );

    res.setHeader('Content-Type', 'text/html');
    res.send(modifiedText);
  } catch (error) {
    res.status(500).send('Erro ao acessar a página');
  }
};
