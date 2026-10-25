import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  ArenaAppLogo,
  ArenaAvatar,
  ArenaIcon,
  ArenaIconButton,
  ArenaSideNav,
  ArenaSideNavCollapsible,
  ArenaSideNavItem,
  ArenaSideNavSection,
  ArenaTag,
  ArenaTooltip,
  arenaCatColor,
} from '@dravensoft/arena-angular';
import { PEOPLE, PRIORITY_SLOT, STATUS_SLOT } from './data/Space';
import type { Priority, Status } from './data/Space';

export type Screen = 'list' | 'board' | 'dashboard' | 'palette';

@Component({
  selector: 'app-status-dot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dot', '[style.background]': 'fill()' },
  template: '',
})
export class StatusDot {
  readonly status = input.required<Status>();
  protected readonly fill = computed(() => arenaCatColor(STATUS_SLOT[this.status()]));
}

@Component({
  selector: 'app-status-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaTag],
  host: { style: 'display: contents' },
  template: `<arena-tag [colorId]="slot()">{{ status() }}</arena-tag>`,
})
export class StatusPill {
  readonly status = input.required<Status>();
  protected readonly slot = computed(() => STATUS_SLOT[this.status()]);
}

@Component({
  selector: 'app-priority-flag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaIcon, ArenaTooltip],
  host: { style: 'display: contents' },
  template: `
    <arena-tooltip [label]="priority() + ' priority'">
      <span class="flag" [style.color]="ink()" aria-hidden="true"><arena-icon icon="ph-fill ph-flag" /></span>
    </arena-tooltip>
  `,
})
export class PriorityFlag {
  readonly priority = input.required<Priority>();
  protected readonly ink = computed(() => arenaCatColor(PRIORITY_SLOT[this.priority()]));
}

/* Arena ships no avatar group, so the bench draws the overlap and the overflow count. */
@Component({
  selector: 'app-assignees',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar],
  host: { class: 'stack', '[attr.aria-label]': 'names()' },
  template: `
    @for (id of shown(); track id) {
      <span class="stack__slot">
        <arena-avatar [name]="person(id).name" [src]="person(id).image" class="arena-size-xs" />
      </span>
    }
    @if (rest() > 0) { <span class="stack__more arena-num">+{{ rest() }}</span> }
  `,
})
export class Assignees {
  readonly ids = input.required<readonly string[]>();
  protected readonly shown = computed(() => this.ids().slice(0, 3));
  protected readonly rest = computed(() => this.ids().length - this.shown().length);
  protected readonly names = computed(() => this.ids().map((id) => PEOPLE[id].name).join(', '));
  protected person(id: string) {
    return PEOPLE[id];
  }
}

@Component({
  selector: 'app-tags',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tags' },
  template: `@for (tag of tags(); track tag) { <span class="tag">{{ tag }}</span> }`,
})
export class Tags {
  readonly tags = input.required<readonly string[]>();
}

const SCREEN_OF: Record<string, Screen> = {
  list: 'list', board: 'board', dashboard: 'dashboard',
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaAppLogo, ArenaAvatar, ArenaIcon, ArenaIconButton, ArenaSideNav, ArenaSideNavCollapsible,
    ArenaSideNavItem, ArenaSideNavSection,
  ],
  host: { class: 'side' },
  template: `
    <div class="side__brand">
      <arena-app-logo class="arena-size-sm" name="ClickUp">
        <img mark src="img/brand-mark.svg" alt="" class="side__mark" />
      </arena-app-logo>
      <span class="side__brand-gap"></span>
      <arena-icon-button icon="ph-bold ph-caret-up-down" label="Switch workspace" class="arena-size-sm" />
    </div>

    <div class="side__quick">
      <button type="button" class="q"><span class="q__i" aria-hidden="true"><arena-icon icon="ph-bold ph-house" /></span>Home</button>
      <button type="button" class="q"><span class="q__i" aria-hidden="true"><arena-icon icon="ph-bold ph-tray" /></span>Inbox<span class="q__n arena-num">7</span></button>
      <button type="button" class="q"><span class="q__i" aria-hidden="true"><arena-icon icon="ph-bold ph-magnifying-glass" /></span>Search<kbd class="q__k arena-num">Ctrl K</kbd></button>
      <button type="button" class="q"><span class="q__i" aria-hidden="true"><arena-icon icon="ph-bold ph-clock-counter-clockwise" /></span>Recents</button>
    </div>

    <div class="side__tree">
      <arena-side-nav ariaLabel="Spaces" [active]="screen()" (nav)="onNav($event)">
        <arena-side-nav-section label="Favourites">
          <arena-side-nav-item id="list" label="Sprint 32" icon="ph-bold ph-list-checks" />
          <arena-side-nav-item id="dashboard" label="Team dashboard" icon="ph-bold ph-chart-line-up" />
        </arena-side-nav-section>

        <arena-side-nav-section label="Spaces">
          <arena-side-nav-collapsible id="product" label="Product" icon="ph-bold ph-rocket-launch" defaultExpanded>
            <arena-side-nav-item id="list" label="Sprint 32" icon="ph-bold ph-list-bullets" />
            <arena-side-nav-item id="board" label="Board" icon="ph-bold ph-kanban" />
            <arena-side-nav-item id="dashboard" label="Dashboard" icon="ph-bold ph-chart-bar" />
            <arena-side-nav-item id="backlog" label="Backlog" icon="ph-bold ph-stack" [badge]="41" />
          </arena-side-nav-collapsible>

          <arena-side-nav-collapsible id="growth" label="Growth" icon="ph-bold ph-trend-up">
            <arena-side-nav-item id="experiments" label="Experiments" icon="ph-bold ph-flask" />
            <arena-side-nav-item id="funnel" label="Funnel" icon="ph-bold ph-funnel" />
          </arena-side-nav-collapsible>

          <arena-side-nav-collapsible id="ops" label="Operations" icon="ph-bold ph-gear-six">
            <arena-side-nav-item id="oncall" label="On-call" icon="ph-bold ph-phone-call" />
            <arena-side-nav-item id="vendors" label="Vendors" icon="ph-bold ph-buildings" />
          </arena-side-nav-collapsible>
        </arena-side-nav-section>

        <arena-side-nav-section label="More">
          <arena-side-nav-item id="docs" label="Docs" icon="ph-bold ph-file-text" />
          <arena-side-nav-item id="goals" label="Goals" icon="ph-bold ph-target" />
          <arena-side-nav-item id="trash" label="Trash" icon="ph-bold ph-trash" />
        </arena-side-nav-section>
      </arena-side-nav>
    </div>

    <div class="side__foot">
      <arena-avatar [name]="ada.name" [src]="ada.image" class="arena-size-sm" status="online" />
      <span class="side__me">
        <span class="side__me-name">Ada Okonjo</span>
        <span class="side__me-role">Workspace owner</span>
      </span>
      <arena-icon-button icon="ph-bold ph-gear" label="Settings" class="arena-size-sm" />
    </div>
  `,
})
export class Sidebar {
  readonly screen = input.required<Screen>();
  readonly screenChange = output<Screen>();

  protected readonly ada = PEOPLE['ada'];

  protected onNav(id: string): void {
    const next = SCREEN_OF[id];
    if (next) this.screenChange.emit(next);
  }
}
