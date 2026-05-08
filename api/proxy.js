export default async function handler(req, res) {
  try {
    const origin = 'https://wisp.super.site';

    const path =
      req.url.replace(/^\/api\/proxy/, '') || '/';

    const targetUrl = `${origin}${path}`;

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

      // Remove badge + botão tema
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
            top: 18px;
            right: 18px;

            width: 38px;
            height: 38px;

            border: none;
            border-radius: 999px;

            display: flex;
            align-items: center;
            justify-content: center;

            cursor: pointer;

            z-index: 999999;

            background: rgba(255,255,255,0.06);
            backdrop-filter: blur(10px);

            transition:
              transform .2s ease,
              background .2s ease,
              opacity .2s ease;
          }

          #theme-toggle:hover {
            transform: scale(1.05);
            background: rgba(255,255,255,0.12);
          }

          html.theme-light #theme-toggle {
            background: rgba(0,0,0,0.06);
          }

          html.theme-light #theme-toggle:hover {
            background: rgba(0,0,0,0.10);
          }

          #theme-toggle svg {
            width: 18px;
            height: 18px;

            stroke: currentColor;
            fill: none;
            stroke-width: 2;

            transition:
              opacity .2s ease,
              transform .2s ease;
          }

          html.theme-dark #theme-toggle {
            color: white;
          }

          html.theme-light #theme-toggle {
            color: black;
          }
        </style>

        <button id="theme-toggle" aria-label="Toggle theme">
          <svg id="theme-icon" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3c0 .28.02.56.05.83A7 7 0 0 0 20.17 12c.27.03.55.05.83.05Z"/>
          </svg>
        </button>

        <script>
          (() => {
            const button =
              document.getElementById('theme-toggle');

            const icon =
              document.getElementById('theme-icon');

            const html =
              document.documentElement;

            function setMoon() {
              icon.innerHTML = \`
                <path d="M21 12.79A9 9 0 1 1 11.21 3c0 .28.02.56.05.83A7 7 0 0 0 20.17 12c.27.03.55.05.83.05Z"/>
              \`;
            }

            function setSun() {
              icon.innerHTML = \`
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2"></path>
                <path d="M12 20v2"></path>
                <path d="m4.93 4.93 1.41 1.41"></path>
                <path d="m17.66 17.66 1.41 1.41"></path>
                <path d="M2 12h2"></path>
                <path d="M20 12h2"></path>
                <path d="m6.34 17.66-1.41 1.41"></path>
                <path d="m19.07 4.93-1.41 1.41"></path>
              \`;
            }

            function updateIcon() {
              if (
                html.classList.contains('theme-dark')
              ) {
                setSun();
              } else {
                setMoon();
              }
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

    // Assets
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
