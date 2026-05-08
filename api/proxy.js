export default async function handler(req, res) {
  try {
    const origin = 'https://wisp.super.site';

    const path =
      req.url.replace(/^\/api\/proxy/, '') || '/';

    const targetUrl = `${origin}${path}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          req.headers['user-agent'] || '',
      },
    });

    const contentType =
      response.headers.get('content-type') || '';

    res.status(response.status);

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );

    if (contentType.includes('text/html')) {
      let body = await response.text();

      // assets relativos
      body = body.replace(
        /(src|href)="\/(?!\/)/g,
        `$1="${origin}/`
      );

      // links internos continuam no proxy
      body = body.replace(
        /<a([^>]+)href="https:\/\/wisp\.super\.site(.*?)"/g,
        '<a$1href="/api/proxy$2"'
      );

      body = body.replace(
        '</head>',
        `
        <style>
          :root {
            --bg-light: #f0f0f0;
            --text-light: #111111;

            --bg-dark: #111111;
            --text-dark: #f0f0f0;
          }

          html.theme-light,
          html.theme-light body {
            background: var(--bg-light) !important;
            color: var(--text-light) !important;
          }

          html.theme-dark,
          html.theme-dark body {
            background: var(--bg-dark) !important;
            color: var(--text-dark) !important;
          }

          html.theme-light * {
            border-color:
              rgba(0,0,0,.08) !important;
          }

          html.theme-dark * {
            border-color:
              rgba(255,255,255,.08) !important;
          }

          .super-badge,
          a[href*="super.so"],
          a[href*="super.site"][style*="position: fixed"] {
            display: none !important;
          }

          .notion-navbar__actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          #theme-toggle {
            width: 34px;
            height: 34px;

            border-radius: 999px;
            border: none;

            display: flex;
            align-items: center;
            justify-content: center;

            cursor: pointer;

            transition:
              transform .2s ease,
              background .2s ease;
          }

          html.theme-light #theme-toggle {
            background: #111111;
            color: #f0f0f0;
          }

          html.theme-dark #theme-toggle {
            background: #f0f0f0;
            color: #111111;
          }

          #theme-toggle:hover {
            transform: scale(1.05);
          }

          #theme-toggle svg {
            width: 18px;
            height: 18px;

            stroke: currentColor;
            fill: none;
            stroke-width: 2;
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
            const html =
              document.documentElement;

            // tema inicial
            if (
              !html.classList.contains(
                'theme-dark'
              )
            ) {
              html.classList.add(
                'theme-light'
              );
            }

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
                if (
                  html.classList.contains(
                    'theme-dark'
                  )
                ) {
                  setSun();
                } else {
                  setMoon();
                }
              }

              button.addEventListener(
                'click',
                () => {
                  const dark =
                    html.classList.contains(
                      'theme-dark'
                    );

                  html.classList.toggle(
                    'theme-dark',
                    !dark
                  );

                  html.classList.toggle(
                    'theme-light',
                    dark
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
