import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ArenaIcon, ArenaIconButton, ArenaThemeService } from '@dravensoft/arena-angular';
import { PathScreen } from './screens/PathScreen';
import { LessonScreen } from './screens/LessonScreen';
import { ProfileScreen } from './screens/ProfileScreen';

type Screen = 'path' | 'lesson' | 'profile';

const NAV: { id: Screen | string; label: string; icon: string; slot: number }[] = [
  { id: 'path', label: 'Learn', icon: 'ph-fill ph-house', slot: 1 },
  { id: 'letters', label: 'Letters', icon: 'ph-fill ph-text-aa', slot: 2 },
  { id: 'league', label: 'Leaderboards', icon: 'ph-fill ph-shield-star', slot: 4 },
  { id: 'quests', label: 'Quests', icon: 'ph-fill ph-scroll', slot: 6 },
  { id: 'shop', label: 'Shop', icon: 'ph-fill ph-storefront', slot: 5 },
  { id: 'profile', label: 'Profile', icon: 'ph-fill ph-user', slot: 3 },
];

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaIcon, ArenaIconButton, LessonScreen, PathScreen, ProfileScreen],
  // The React shell returns a different root element per branch: `<div className="app">` for the
  // two shell screens and `<div className="lesson">` for the lesson. An Angular host element is
  // always in the document, so the layout class is a conditional binding rather than a branch.
  host: { '[class.app]': "screen() !== 'lesson'" },
  template: `
    @if (screen() === 'lesson') {
      <app-lesson-screen (quit)="screen.set('path')" />
    } @else {
      <nav class="nav" aria-label="Primary">
        <a class="nav__brand" href="#/">
          <img src="img/brand-word.svg" alt="Duolingo" class="nav__word" />
        </a>

        <ul class="nav__list">
          @for (item of nav; track item.id) {
            <li>
              <button
                type="button"
                class="nav__item"
                [attr.aria-current]="screen() === item.id ? 'page' : null"
                (click)="go(item.id)"
              >
                <span class="nav__icon" aria-hidden="true" [attr.data-slot]="item.slot"><arena-icon [icon]="item.icon" /></span>
                <span class="nav__label">{{ item.label }}</span>
              </button>
            </li>
          }
        </ul>

        <div class="nav__foot">
          <arena-icon-button [icon]="themeIcon()" label="Switch appearance" (click)="toggleTheme()" />
        </div>
      </nav>

      <main class="main">
        @if (screen() === 'path') { <app-path-screen (start)="screen.set('lesson')" /> }
        @if (screen() === 'profile') { <app-profile-screen /> }
      </main>
    }
  `,
})
export class App {
  private readonly themes = inject(ArenaThemeService);
  private readonly asked = new URLSearchParams(window.location.search).get('screen');

  protected readonly screen = signal<Screen>(
    this.asked === 'lesson' || this.asked === 'profile' ? this.asked : 'path',
  );
  protected readonly nav = NAV;

  protected readonly themeIcon = computed(() =>
    this.themes.theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon',
  );

  protected go(id: Screen | string): void {
    if (id === 'path' || id === 'profile') this.screen.set(id);
  }

  protected toggleTheme(): void {
    this.themes.set(this.themes.theme() === 'dark' ? 'light' : 'dark');
  }
}
