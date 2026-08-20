import { bootstrapApplication } from '@angular/platform-browser';
import { provideArenaThemes } from '@dravensoft/arena-angular';
import { Relay } from './app/relay';

bootstrapApplication(Relay, {
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
