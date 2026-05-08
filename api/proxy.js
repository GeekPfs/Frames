export default async function handler(req, res) {
  try {
    const origin = 'https://wisp.super.site';

    const targetUrl = origin + (req.url || '/');

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
      },
    });

    const contentType = response.headers.get('content-type') || '';

    res.status(response.status);

    // 🔥 sem cache (sempre atualizado)
    res.setHeader('Cache-Control', 'no-store');

    if (contentType.includes('text/html')) {
      let body = await response.text();

      // corrige links relativos
      body = body.replace(
        /(src|href)="\/(?!\/)/g,
        `$1="${origin}/`
      );

      // injeta UI (tema + fade + botão)
      body = body.replace(
        '</head>',
        `
        <style>
          html, body {
            margin: 0;
            padding: 0;
            transition: background .25s ease, color .25s ease;
          }

          html.theme-dark, html.theme-dark body {
            background: #111;
            color: #f0f0f0;
          }

          html.theme-light, html.theme-light body {
            background: #f0f0f0;
            color: #111;
          }

          html {
            animation: fade .25s ease;
          }

          @keyframes fade {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .notion-navbar__actions {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          #theme-toggle {
            width: 34px;
            height: 34px;
            border-radius: 999px;
            border: none;
            cursor: pointer;
          }
        </style>
        </head>
        `
      );

      body = body.replace(
        '</body>',
        `
        <script>
          (() => {
            const html = document.documentElement;

            html.classList.add('theme-dark');

            document.addEventListener('click', (e) => {
              const a = e.target.closest('a');
              if (!a) return;

              if (a.href.startsWith('https://wisp.super.site')) {
                e.preventDefault();
                window.location.href = a.href.replace(
                  'https://wisp.super.site',
                  ''
                );
              }
            });

          })();
        </script>
        </body>
        `
      );

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(body);
    }

    // assets (css, js, imagens)
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
