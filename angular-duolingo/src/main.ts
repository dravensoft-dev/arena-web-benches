import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideArenaIcons, provideArenaThemes } from '@dravensoft/arena-angular';
import { App } from './App';
import { ARENA_SPRITE } from './arena.icons.generated.js';

bootstrapApplication(App, {
  providers: [
    provideArenaIcons(ARENA_SPRITE),
    provideZonelessChangeDetection(),
    provideArenaThemes({
      palettes: [
        { name: 'light', polarity: 'light' },
        { name: 'dark', polarity: 'dark' },
      ],
      default: 'light',
    }),
  ],
});
