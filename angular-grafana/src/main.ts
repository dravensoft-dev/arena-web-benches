import { bootstrapApplication } from '@angular/platform-browser';
import { provideArenaIcons, provideArenaThemes } from '@dravensoft/arena-angular';
import { Vantage } from './app/vantage';
import { ARENA_SPRITE } from './arena.icons.generated.js';

bootstrapApplication(Vantage, {
  providers: [
    provideArenaIcons(ARENA_SPRITE),
    provideArenaThemes({
      palettes: [
        { name: 'dark', polarity: 'dark' },
        { name: 'light', polarity: 'light' },
      ],
      default: 'dark',
    }),
  ],
});
