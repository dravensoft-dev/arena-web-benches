import { bootstrapApplication } from '@angular/platform-browser';
import { provideArenaIcons, provideArenaThemes } from '@dravensoft/arena-angular';
import { Openings } from './app/openings';
import { ARENA_SPRITE } from './arena.icons.generated.js';

bootstrapApplication(Openings, {
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
