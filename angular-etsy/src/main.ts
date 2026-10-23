import { bootstrapApplication } from '@angular/platform-browser';
import { provideArenaIcons, provideArenaThemes } from '@dravensoft/arena-angular';
import { Shop } from './app/shop';
import { ARENA_SPRITE } from './arena.icons.generated.js';

bootstrapApplication(Shop, {
  providers: [
    provideArenaIcons(ARENA_SPRITE),
    provideArenaThemes({
      palettes: [
        { name: 'light', polarity: 'light' },
        { name: 'dark', polarity: 'dark' },
      ],
      default: 'light',
    }),
  ],
});
