import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideArenaThemes } from '@dravensoft/arena-angular';
import { App } from './App';

// The React bench reaches the icon font with `import '@phosphor-icons/web/regular'` from
// `Main.tsx`. The Angular builder cannot resolve that: the package's `style.css` names a
// `.svg` font source and the esbuild pipeline has no loader for it inside a TS import chain.
// It is also dead weight on both layers -- `icons.generated.css` already declares the two
// weights this bench actually draws, Bold and Fill, and no regular-weight glyph is used.

bootstrapApplication(App, {
  providers: [
    provideZonelessChangeDetection(),
    provideArenaThemes({
      palettes: [
        { name: 'dark', polarity: 'dark' },
        { name: 'light', polarity: 'light' },
      ],
      default: 'dark',
    }),
  ],
});
