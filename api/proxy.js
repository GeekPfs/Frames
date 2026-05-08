export default async function handler(req, res) {
  try {
    const origin = 'https://wisp.super.site';

    // remove /api/proxy da URL
    const path =
      req.url.replace(/^\/api\/proxy/, '') || '/';

    const targetUrl = `${origin}${path}`;

    // request original
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          req.headers['user-agent'] || '',
      },
    });

    const contentType =
      response.headers.get('content-type') || '';

    res.status(response.status);

    // cache CDN
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );

    // páginas HTML
    if (contentType.includes('text/html')) {
      let body = await response.text();

      // corrige assets relativos
      body = body.replace(
        /(src|href)="\/(?!\/)/g,
        `$1="${origin}/`
      );

      // mantém navegação no proxy
      body = body.replace(
        /<a([^>]+)href="https:\/\/wisp\.super\.site(.*?)"/g,
        '<a$1href="/api/proxy$2"'
      );

      // injeta estilos + botão de tema
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

          .notion-navbar__actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          #theme-toggle {
            width: 32px;
            height: 32px;

            border-radius: 999px;
            border: 1px solid var(--color-border-default);

            display: flex;
            align-items: center;
            justify-content: center;

            cursor: pointer;

            color: inherit;
            background: var(--color-bg-secondary);

            transition:
              background .2s ease,
              transform .2s ease,
              opacity .2s ease,
              border-color .2s ease;
          }

          #theme-toggle:hover {
            background: var(--color-bg-hover);
            transform: scale(1.05);
          }

          #theme-toggle svg {
            width: 17px;
            height: 17px;

            stroke: currentColor;
            fill: none;
            stroke-width: 2;
          }
        </style>

        <script>
          (() => {
            const html =
              document.documentElement;

            function injectButton() {
              const actions =
                document.querySelector(
                  '.notion-navbar__actions'
                );

              if (!actions) {
                requestAnimationFrame(
                  injectButton
                );

                return;
              }

              // evita duplicação
              if (
                document.getElementById(
                  'theme-toggle'
                )
              ) {
                return;
              }

              const button =
                document.createElement(
                  'button'
                );

              button.id =
                'theme-toggle';

              const icon =
                document.createElementNS(
                  'http://www.w3.org/2000/svg',
                  'svg'
                );

              icon.setAttribute(
                'viewBox',
                '0 0 24 24'
              );

              button.appendChild(icon);

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
                const isDark =
                  html.classList.contains(
                    'theme-dark'
                  );

                if (isDark) {
                  setSun();
                } else {
                  setMoon();
                }
              }

              button.addEventListener(
                'click',
                () => {
                  const isDark =
                    html.classList.contains(
                      'theme-dark'
                    );

                  html.classList.toggle(
                    'theme-dark',
                    !isDark
                  );

                  html.classList.toggle(
                    'theme-light',
                    isDark
                  );

                  updateIcon();
                }
              );

              updateIcon();

              actions.appendChild(button);
            }

            injectButton();
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

    // assets
    res.setHeader(
      'Content-Type',
      contentType
    );

    if (response.body) {
      response.body.pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error(err);

    res
      .status(500)
      .send('Internal Server Error');
  }
}
