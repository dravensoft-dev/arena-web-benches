import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ArenaCommandPalette, ArenaIconButton, ArenaThemeService } from '@dravensoft/arena-angular';
import type { ArenaCommand } from '@dravensoft/arena-angular';
import { Sidebar } from './Sidebar';
import type { Screen } from './Sidebar';
import { DocPage } from './screens/DocPage';
import { DatabaseView } from './screens/DatabaseView';
import { Home } from './screens/Home';

const COMMANDS: ArenaCommand[] = [
  { id: 'home', label: 'Home', icon: 'ph-bold ph-house', group: 'Jump to' },
  { id: 'wiki', label: 'Engineering wiki', icon: 'ph-bold ph-book-open-text', group: 'Jump to', hint: 'onboarding setup' },
  { id: 'tasks', label: 'Sprint tasks', icon: 'ph-bold ph-kanban', group: 'Jump to', hint: 'board database' },
  { id: 'new-page', label: 'Create a new page', icon: 'ph-bold ph-plus', group: 'Actions', shortcut: 'Ctrl N' },
  { id: 'new-db', label: 'Create a new database', icon: 'ph-bold ph-table', group: 'Actions' },
  { id: 'import', label: 'Import from Markdown', icon: 'ph-bold ph-download-simple', group: 'Actions' },
  { id: 'trash', label: 'Open trash', icon: 'ph-bold ph-trash', group: 'Actions' },
  { id: 'theme', label: 'Switch appearance', icon: 'ph-bold ph-moon', group: 'Settings' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaCommandPalette, ArenaIconButton, DatabaseView, DocPage, Home, Sidebar],
  host: {
    class: 'app',
    '(document:keydown)': 'onKey($event)',
  },
  template: `
    <app-sidebar [screen]="screen()" (screenChange)="screen.set($event)" (search)="palette.set(true)" />

    <main class="main">
      @if (screen() === 'home') { <app-home (screenChange)="screen.set($event)" (search)="palette.set(true)" /> }
      @if (screen() === 'doc') { <app-doc-page (screenChange)="screen.set($event)" /> }
      @if (screen() === 'database') { <app-database-view /> }
    </main>

    <div class="theme-toggle">
      <arena-icon-button [icon]="themeIcon()" label="Switch appearance" (click)="toggleTheme()" />
    </div>

    <arena-command-palette
      [open]="palette()"
      [commands]="commands"
      placeholder="Search pages and actions"
      (close)="palette.set(false)"
      (run)="run($event)"
    />
  `,
})
export class App {
  private readonly themes = inject(ArenaThemeService);
  private readonly asked = new URLSearchParams(window.location.search).get('screen');

  readonly screen = signal<Screen>(
    this.asked === 'home' || this.asked === 'database' ? this.asked : 'doc',
  );
  protected readonly palette = signal(false);
  protected readonly commands = COMMANDS;

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
    if (command.id === 'home') this.screen.set('home');
    if (command.id === 'wiki') this.screen.set('doc');
    if (command.id === 'tasks') this.screen.set('database');
  }
}
