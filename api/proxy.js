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

    // cache
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );

    // cache agressivo para assets
    if (
      contentType.includes('javascript') ||
      contentType.includes('css') ||
      contentType.includes('image') ||
      contentType.includes('font')
    ) {
      res.setHeader(
        'Cache-Control',
        'public, max-age=31536000, immutable'
      );
    }

    // html
    if (contentType.includes('text/html')) {
      let body = await response.text();

      // assets relativos
      body = body.replace(
        /(src|href)="\/(?!\/)/g,
        `$1="${origin}/`
      );

      // css
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

          html,
          body {
            transition:
              background .25s ease,
              color .25s ease;
          }

          html.theme-light,
          html.theme-light body {
            background:
              var(--bg-light) !important;

            color:
              var(--text-light) !important;
          }

          /* corrige elementos invisíveis no light mode */

          html.theme-light .notion-divider {
            background: #d0d0d0 !important;
            border-color: #d0d0d0 !important;
          }

          html.theme-dark,
          html.theme-dark body {
            background:
              var(--bg-dark) !important;

            color:
              var(--text-dark) !important;
          }

          /* fade simples */

          html {
            animation:
              pageFade .25s ease;
          }

          body {
            animation:
              pageFade .25s ease;
          }

          .notion-frame,
          .notion-page,
          .notion-scroller,
          .notion-collection_view,
          .notion-column-list,
          .notion-text,
          .notion-image,
          .notion-header,
          .notion-navbar {
            animation:
              pageFade .3s ease;
          }

          @keyframes pageFade {
            from {
              opacity: 0;
              transform:
                translateY(4px);
            }

            to {
              opacity: 1;
              transform:
                translateY(0);
            }
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

            border: none;
            border-radius: 999px;

            display: flex;
            align-items: center;
            justify-content: center;

            cursor: pointer;

            transition:
              transform .2s ease,
              opacity .2s ease;
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

      // js
      body = body.replace(
        '</body>',
        `
        <script>
          (() => {
            const html =
              document.documentElement;

            // tema inicial
            html.classList.remove(
              'theme-light'
            );

            html.classList.add(
              'theme-dark'
            );

            // navegação interna
            document.addEventListener(
              'click',
              e => {
                const a =
                  e.target.closest('a');

                if (!a) return;

                const href = a.href;

                if (
                  href &&
                  href.startsWith(
                    'https://wisp.super.site'
                  )
                ) {
                  e.preventDefault();

                  const proxied =
                    href.replace(
                      'https://wisp.super.site',
                      '/api/proxy'
                    );

                  window.location.href =
                    proxied;
                }
              }
            );

            function injectButton() {
              const actions =
                document.querySelector(
                  '.notion-navbar__actions'
                );

              if (!actions) {
                setTimeout(
                  injectButton,
                  100
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
                const dark =
                  html.classList.contains(
                    'theme-dark'
                  );

                if (dark) {
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

                  // dark -> light
                  if (dark) {
                    html.style.transition =
                      'background .25s ease, color .25s ease';

                    setTimeout(() => {
                      html.classList.remove(
                        'theme-dark'
                      );

                      html.classList.add(
                        'theme-light'
                      );

                      updateIcon();
                    }, 120);
                  }

                  // light -> dark
                  else {
                    html.classList.remove(
                      'theme-light'
                    );

                    html.classList.add(
                      'theme-dark'
                    );

                    updateIcon();
                  }
                }
              );

              updateIcon();

              actions.appendChild(
                button
              );
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
