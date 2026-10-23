import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  ArenaAvatar, ArenaIcon, ArenaIconButton, ArenaSideNav, ArenaSideNavCollapsible, ArenaSideNavItem,
  ArenaSideNavSection,
} from '@dravensoft/arena-angular';

export type Screen = 'home' | 'doc' | 'database';

const SCREEN_OF: Record<string, Screen> = {
  home: 'home',
  wiki: 'doc',
  tasks: 'database',
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaAvatar, ArenaIcon, ArenaIconButton, ArenaSideNav, ArenaSideNavCollapsible, ArenaSideNavItem,
    ArenaSideNavSection,
  ],
  host: { class: 'sidebar' },
  template: `
    <div class="sidebar__account">
      <arena-avatar name="Acme Platform" class="arena-size-sm" kind="team" src="img/brand-logo.svg" />
      <div class="sidebar__account-text">
        <span class="sidebar__workspace">Acme Platform</span>
        <span class="sidebar__plan">Team plan</span>
      </div>
      <arena-icon-button icon="ph-bold ph-caret-up-down" label="Switch workspace" class="arena-size-sm" />
    </div>

    <div class="sidebar__quick">
      <button type="button" class="quick" (click)="search.emit()">
        <span class="quick__icon" aria-hidden="true"><arena-icon icon="ph-bold ph-magnifying-glass" /></span>
        <span>Search</span>
        <kbd class="quick__key arena-num">Ctrl K</kbd>
      </button>
      <button type="button" class="quick" (click)="screenChange.emit('home')">
        <span class="quick__icon" aria-hidden="true"><arena-icon icon="ph-bold ph-house" /></span>
        <span>Home</span>
      </button>
      <button type="button" class="quick">
        <span class="quick__icon" aria-hidden="true"><arena-icon icon="ph-bold ph-tray" /></span>
        <span>Inbox</span>
        <span class="quick__count arena-num">3</span>
      </button>
    </div>

    <div class="sidebar__tree">
      <arena-side-nav ariaLabel="Workspace pages" [active]="active()" (nav)="onNav($event)">
        <arena-side-nav-section label="Favourites">
          <arena-side-nav-item id="wiki" label="Engineering wiki" icon="ph-bold ph-book-open-text" />
          <arena-side-nav-item id="tasks" label="Sprint tasks" icon="ph-bold ph-kanban" />
        </arena-side-nav-section>

        <arena-side-nav-section label="Workspace">
          <arena-side-nav-collapsible id="engineering" label="Engineering" icon="ph-bold ph-code" defaultExpanded>
            <arena-side-nav-item id="wiki" label="Engineering wiki" icon="ph-bold ph-file-text" />
            <arena-side-nav-item id="tasks" label="Sprint tasks" icon="ph-bold ph-file-text" />
            <arena-side-nav-item id="oncall" label="On-call rota" icon="ph-bold ph-file-text" />
            <arena-side-nav-item id="incident" label="July outage review" icon="ph-bold ph-file-text" />
          </arena-side-nav-collapsible>

          <arena-side-nav-collapsible id="product" label="Product" icon="ph-bold ph-compass">
            <arena-side-nav-item id="roadmap" label="Q3 roadmap" icon="ph-bold ph-file-text" />
            <arena-side-nav-item id="research" label="User research" icon="ph-bold ph-file-text" />
          </arena-side-nav-collapsible>

          <arena-side-nav-collapsible id="people" label="People" icon="ph-bold ph-users-three">
            <arena-side-nav-item id="hiring" label="Hiring pipeline" icon="ph-bold ph-file-text" />
            <arena-side-nav-item id="handbook" label="Handbook" icon="ph-bold ph-file-text" />
          </arena-side-nav-collapsible>
        </arena-side-nav-section>

        <arena-side-nav-section label="Shared">
          <arena-side-nav-item id="brand" label="Brand guidelines" icon="ph-bold ph-palette" />
          <arena-side-nav-item id="trash" label="Trash" icon="ph-bold ph-trash" />
        </arena-side-nav-section>
      </arena-side-nav>
    </div>

    <div class="sidebar__foot">
      <button type="button" class="quick">
        <span class="quick__icon" aria-hidden="true"><arena-icon icon="ph-bold ph-plus" /></span>
        <span>New page</span>
      </button>
    </div>
  `,
})
export class Sidebar {
  readonly screen = input.required<Screen>();
  readonly screenChange = output<Screen>();
  readonly search = output<void>();

  protected readonly active = computed(() => {
    const current = this.screen();
    return current === 'home' ? 'home' : current === 'doc' ? 'wiki' : 'tasks';
  });

  protected onNav(id: string): void {
    const next = SCREEN_OF[id];
    if (next) this.screenChange.emit(next);
  }
}
