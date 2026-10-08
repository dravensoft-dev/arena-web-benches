import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  ArenaAvatar,
  ArenaBreadcrumbs,
  ArenaButton,
  ArenaCommandPalette,
  ArenaIconButton,
  ArenaThemeService,
  ArenaToast,
  ArenaToastHost,
  ArenaToastQueue,
} from '@dravensoft/arena-angular';
import type { ArenaCommand, ArenaCrumb } from '@dravensoft/arena-angular';

import { Sidebar } from './Chrome';
import type { Screen } from './Chrome';
import { ListView } from './screens/ListView';
import { BoardView } from './screens/BoardView';
import { Dashboard } from './screens/Dashboard';
import { PEOPLE } from './data/Space';

const COMMANDS: ArenaCommand[] = [
  { id: 'list', label: 'Sprint 32 list', icon: 'ph-bold ph-list-checks', group: 'Views' },
  { id: 'board', label: 'Board', icon: 'ph-bold ph-kanban', group: 'Views' },
  { id: 'dashboard', label: 'Team dashboard', icon: 'ph-bold ph-chart-bar', group: 'Views' },
  { id: 'task', label: 'Create task', icon: 'ph-bold ph-plus', group: 'Create', shortcut: 'T' },
  { id: 'doc', label: 'Create doc', icon: 'ph-bold ph-file-text', group: 'Create' },
  { id: 'sprint', label: 'Start a sprint', icon: 'ph-bold ph-flag-banner', group: 'Create' },
  { id: 'theme', label: 'Switch appearance', icon: 'ph-bold ph-moon', group: 'Settings' },
];

const TABS: { id: Screen; label: string; icon: string }[] = [
  { id: 'list', label: 'List', icon: 'ph-bold ph-list-bullets' },
  { id: 'board', label: 'Board', icon: 'ph-bold ph-kanban' },
  { id: 'dashboard', label: 'Dashboard', icon: 'ph-bold ph-chart-bar' },
];

const CRUMBS: ArenaCrumb[] = [
  { label: 'Acme', href: '#/' },
  { label: 'Product', href: '#/product' },
  { label: 'Sprint 32' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaAvatar, ArenaBreadcrumbs, ArenaButton, ArenaCommandPalette, ArenaIconButton, ArenaToast,
    ArenaToastHost, BoardView, Dashboard, ListView, Sidebar,
  ],
  host: {
    class: 'app',
    '(window:keydown)': 'onKey($event)',
  },
  template: `
    <app-sidebar [screen]="screen()" (screenChange)="screen.set($event)" />

    <main class="main">
      <header class="bar">
        <arena-breadcrumbs ariaLabel="Location" [items]="crumbs" />
        <div class="bar__gap"></div>
        <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-magnifying-glass" (click)="palette.set(true)">
          Search
        </arena-button>
        <arena-icon-button icon="ph-bold ph-bell" label="Notifications" class="arena-size-sm" />
        <arena-icon-button
          [icon]="themeIcon()"
          label="Switch appearance"
          class="arena-size-sm"
          (click)="toggleTheme()"
        />
        <arena-avatar [name]="ada.name" [src]="ada.image" class="arena-size-sm" />
      </header>

      <div class="head">
        <div class="head__title">
          <span class="head__icon"><i class="ph-fill ph-rocket-launch" aria-hidden="true"></i></span>
          <div>
            <h1 class="head__h1">Sprint 32</h1>
            <p class="head__sub">12 tasks &middot; 5 people &middot; ends in 11 days</p>
          </div>
        </div>
        <div class="head__gap"></div>
        <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-share-network">Share</arena-button>
        <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-robot">Automate</arena-button>
      </div>

      <nav class="views" aria-label="Views">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="views__tab"
            [attr.aria-current]="screen() === tab.id ? 'page' : null"
            (click)="screen.set(tab.id)"
          >
            <i class="{{ tab.icon }} views__icon" aria-hidden="true"></i>
            {{ tab.label }}
          </button>
        }
        <span class="views__gap"></span>
        <arena-icon-button icon="ph-bold ph-plus" label="Add a view" class="arena-size-sm" />
      </nav>

      <div class="body">
        @if (screen() === 'list') { <app-list-view /> }
        @if (screen() === 'board') { <app-board-view /> }
        @if (screen() === 'dashboard') { <app-dashboard /> }
      </div>
    </main>

    <arena-command-palette
      [open]="palette()"
      [commands]="commands"
      placeholder="Search tasks, docs and actions"
      (close)="palette.set(false)"
      (run)="run($event)"
    />

    <arena-toast-host>
      @for (toast of toasts.toasts(); track toast.id) {
        <arena-toast [tone]="toast.tone" [title]="toast.title" (close)="toasts.dismiss(toast.id)" />
      }
    </arena-toast-host>
  `,
})
export class App {
  private readonly themes = inject(ArenaThemeService);
  private readonly asked = new URLSearchParams(window.location.search).get('screen');

  protected readonly toasts = inject(ArenaToastQueue);

  protected readonly screen = signal<Screen>(
    this.asked === 'board' || this.asked === 'dashboard' ? this.asked : 'list',
  );
  protected readonly palette = signal(false);

  protected readonly commands = COMMANDS;
  protected readonly tabs = TABS;
  protected readonly crumbs = CRUMBS;
  protected readonly ada = PEOPLE['ada'];

  protected readonly themeIcon = computed(() =>
    this.themes.theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon',
  );

  protected onKey(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.palette.set(true);
    }
  }

  protected toggleTheme(): void {
    this.themes.set(this.themes.theme() === 'dark' ? 'light' : 'dark');
  }

  protected run(command: ArenaCommand): void {
    this.palette.set(false);
    if (command.id === 'theme') this.toggleTheme();
    if (command.id === 'list' || command.id === 'board' || command.id === 'dashboard') {
      this.screen.set(command.id);
    }
    if (command.id === 'task') this.toasts.raise({ title: 'Task created', tone: 'success' });
  }
}
