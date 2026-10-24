import { ChangeDetectionStrategy, Component, afterRenderEffect, computed, inject, signal } from '@angular/core';
import { ArenaIcon, ArenaIconButton, ArenaOnboarding, ArenaThemeService } from '@dravensoft/arena-angular';
import { PathScreen } from './screens/PathScreen';
import { LessonScreen } from './screens/LessonScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { TOUR, TOUR_SEEN } from './data/Course';

type Screen = 'path' | 'lesson' | 'profile';

type Anchor = { left: number; bottom: number };

/* Storage can be absent or refuse, in a private window or a sandboxed frame; the tour then
   opens on every visit, which is the first run repeated rather than an error. */
function tourSeen(): boolean {
  try { return window.localStorage.getItem(TOUR_SEEN) === '1'; } catch { return false; }
}

function markTourSeen(): void {
  try { window.localStorage.setItem(TOUR_SEEN, '1'); } catch { /* the tour reopens next visit */ }
}

/* The coachmark positions from viewport coordinates, so the anchor is read from the target
   after it has been scrolled into view, and read again whenever the page scrolls or resizes. */
function anchorFor(target: string, reveal: boolean): Anchor | undefined {
  const element = document.querySelector(`[data-tour="${target}"]`);
  if (!element) return undefined;
  if (reveal) element.scrollIntoView({ block: 'center' });
  const { left, bottom } = element.getBoundingClientRect();
  return { left, bottom };
}

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
  imports: [ArenaIcon, ArenaIconButton, ArenaOnboarding, LessonScreen, PathScreen, ProfileScreen],
  // The React shell returns a different root element per branch: `<div className="app">` for the
  // two shell screens and `<div className="lesson">` for the lesson. An Angular host element is
  // always in the document, so the layout class is a conditional binding rather than a branch.
  host: {
    '[class.app]': "screen() !== 'lesson'",
    '(window:scroll)': 'measure()',
    '(window:resize)': 'measure()',
  },
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
                [attr.data-tour]="item.id === 'profile' ? 'profile' : null"
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
          <arena-icon-button icon="ph-bold ph-question" label="Take the tour" (activate)="startTour()" />
          <arena-icon-button [icon]="themeIcon()" label="Switch appearance" (activate)="toggleTheme()" />
        </div>
      </nav>

      <main class="main">
        @if (screen() === 'path') { <app-path-screen (start)="screen.set('lesson')" /> }
        @if (screen() === 'profile') { <app-profile-screen /> }
      </main>

      <arena-onboarding
        [open]="showing()"
        [steps]="tour"
        [index]="step()"
        [anchor]="anchor()"
        (next)="step.set(step() + 1)"
        (back)="step.set(step() - 1)"
        (skip)="endTour()"
        (done)="endTour()"
      />
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
  protected readonly tour = TOUR;

  protected readonly touring = signal(this.screen() === 'path' && !tourSeen());
  protected readonly step = signal(0);
  protected readonly anchor = signal<Anchor | undefined>(undefined);

  protected readonly showing = computed(() => this.touring() && this.screen() === 'path');
  private readonly target = computed(() => TOUR[this.step()]?.target);

  constructor() {
    afterRenderEffect(() => {
      const target = this.target();
      if (this.showing() && target) this.anchor.set(anchorFor(target, true));
    });
  }

  protected readonly themeIcon = computed(() =>
    this.themes.theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon',
  );

  protected go(id: Screen | string): void {
    if (id === 'path' || id === 'profile') this.screen.set(id);
  }

  protected measure(): void {
    const target = this.target();
    if (this.showing() && target) this.anchor.set(anchorFor(target, false));
  }

  protected startTour(): void {
    this.step.set(0);
    this.screen.set('path');
    this.touring.set(true);
  }

  protected endTour(): void {
    this.touring.set(false);
    markTourSeen();
  }

  protected toggleTheme(): void {
    this.themes.set(this.themes.theme() === 'dark' ? 'light' : 'dark');
  }
}
