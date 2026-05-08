export default async function handler(req, res) {
  try {
    const origin = 'https://wisp.super.site';

    // Remove prefixo da API
    const path =
      req.url.replace(/^\/api\/proxy/, '') || '/';

    const targetUrl = `${origin}${path}`;

    // Busca página original
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

      // Corrige assets relativos
      body = body.replace(
        /(src|href)="\/(?!\/)/g,
        `$1="${origin}/`
      );

      // Navegação interna continua no proxy
      body = body.replace(
        /<a([^>]+)href="https:\/\/wisp\.super\.site(.*?)"/g,
        '<a$1href="/api/proxy$2"'
      );

      // Remove badge + adiciona botão de tema
      body = body.replace(
        '</body>',
        `
        <style>
          .super-badge,
          a[href*="super.so"],
          a[href*="super.site"][style*="position: fixed"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }

          #theme-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;

            width: 42px;
            height: 42px;

            border: none;
            border-radius: 999px;

            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(10px);

            color: white;
            font-size: 18px;

            cursor: pointer;

            display: flex;
            align-items: center;
            justify-content: center;

            transition:
              background 0.2s ease,
              transform 0.2s ease,
              opacity 0.2s ease;

            z-index: 999999;
          }

          #theme-toggle:hover {
            transform: scale(1.08);
            background: rgba(255,255,255,0.14);
          }

          html.theme-light #theme-toggle {
            color: black;
            background: rgba(0,0,0,0.08);
          }

          html.theme-light #theme-toggle:hover {
            background: rgba(0,0,0,0.14);
          }
        </style>

        <button id="theme-toggle">
          ☀️
        </button>

        <script>
          (() => {
            const button =
              document.getElementById('theme-toggle');

            const html =
              document.documentElement;

            function updateIcon() {
              button.textContent =
                html.classList.contains('theme-dark')
                  ? '☀️'
                  : '🌙';
            }

            button.addEventListener('click', () => {
              if (
                html.classList.contains('theme-dark')
              ) {
                html.classList.remove('theme-dark');
                html.classList.add('theme-light');
              } else {
                html.classList.remove('theme-light');
                html.classList.add('theme-dark');
              }

              updateIcon();
            });

            updateIcon();
          })();
        </script>

        </body>
        `
      );

      res.setHeader(
        'Content-Type',
        'text/html; charset=utf-8'
      );

      return res.send(body);
    }

    // Assets = stream direto
    res.setHeader('Content-Type', contentType);

    if (response.body) {
      response.body.pipe(res);
    } else {
      res.end();
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}
