import { bootstrapApplication } from '@angular/platform-browser';
import { provideArenaThemes } from '@dravensoft/arena-angular';
import { Vantage } from './app/vantage';

bootstrapApplication(Vantage, {
  providers: [
    provideArenaThemes({
      palettes: [
        { name: 'dark', polarity: 'dark' },
        { name: 'light', polarity: 'light' },
      ],
      default: 'dark',
    }),
  ],
});
