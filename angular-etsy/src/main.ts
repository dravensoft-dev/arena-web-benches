import { bootstrapApplication } from '@angular/platform-browser';
import { provideArenaThemes } from '@dravensoft/arena-angular';
import { Shop } from './app/shop';

bootstrapApplication(Shop, {
  providers: [
    provideArenaThemes({
      palettes: [
        { name: 'light', polarity: 'light' },
        { name: 'dark', polarity: 'dark' },
      ],
      default: 'light',
    }),
  ],
});
