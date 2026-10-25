import type { ReactNode } from 'react';

// The head of `src/index.html`: the base, the title and the theme script. Next writes the charset and the viewport itself.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="arena-comfortable">
      <head>
        <base href="./" />
        <title>Openings</title>
        <script dangerouslySetInnerHTML={{ __html: "\n      (function () {\n        var DEFAULT = 'light';\n        try {\n          var asked = new URLSearchParams(location.search).get('theme');\n          if (asked) localStorage.setItem('arena-theme', asked);\n          var name = localStorage.getItem('arena-theme');\n          if (!name && window.matchMedia('(prefers-color-scheme: dark)').matches) name = 'dark';\n          if (name && name !== DEFAULT && /^[a-z][a-z0-9-]*$/.test(name)) {\n            document.documentElement.classList.add('arena-' + name);\n          }\n        } catch (e) {}\n      })();\n    " }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
