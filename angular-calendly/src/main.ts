import { bootstrapApplication } from '@angular/platform-browser';
import { provideArenaThemes } from '@dravensoft/arena-angular';
import { Openings } from './app/openings';

bootstrapApplication(Openings, {
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
