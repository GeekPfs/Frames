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

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );

    // HTML
    if (contentType.includes('text/html')) {
      let body = await response.text();

      // Corrige assets
      body = body.replace(
        /(src|href)="\/(?!\/)/g,
        `$1="${origin}/`
      );

      // Remove badge + corrige tema
      body = body.replace(
        '</head>',
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
        </style>

        <script>
          // Corrige toggle de tema
          (() => {
            const applyTheme = () => {
              const saved =
                localStorage.getItem('theme');

              if (
                saved === 'dark' ||
                document.documentElement.classList.contains('dark')
              ) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            };

            applyTheme();

            // Observa mudanças do tema
            const observer = new MutationObserver(() => {
              const dark =
                document.documentElement.classList.contains('dark');

              localStorage.setItem(
                'theme',
                dark ? 'dark' : 'light'
              );
            });

            observer.observe(
              document.documentElement,
              {
                attributes: true,
                attributeFilter: ['class']
              }
            );
          })();

          // Navegação pelo proxy
          document.addEventListener('click', e => {
            const a = e.target.closest('a');

            if (!a) return;

            const href = a.getAttribute('href');

            if (!href) return;

            // externos
            if (
              href.startsWith('http') &&
              !href.includes('wisp.super.site')
            ) {
              return;
            }

            // especiais
            if (
              href.startsWith('#') ||
              href.startsWith('mailto:') ||
              href.startsWith('tel:')
            ) {
              return;
            }

            e.preventDefault();

            let path = href;

            if (
              href.startsWith('https://wisp.super.site')
            ) {
              path = href.replace(
                'https://wisp.super.site',
                ''
              );
            }

            window.location.href =
              '/api/proxy' + path;
          });
        </script>

        </head>
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
