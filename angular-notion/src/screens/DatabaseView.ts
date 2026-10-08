import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  ArenaAction, ArenaAvatar, ArenaBoard, ArenaBoardColumn, ArenaBreadcrumbs, ArenaButton,
  ArenaFooter, ArenaIconButton, ArenaInput, ArenaMenu, ArenaTab, ArenaTable, ArenaTableCell,
  ArenaTableRow, ArenaTabs, ArenaTag,
} from '@dravensoft/arena-angular';
import type {
  ArenaCatSlot, ArenaCrumb, ArenaMenuItem, ArenaTableColumn, ArenaTagTone,
} from '@dravensoft/arena-angular';
import { BOARD_COLUMNS, TAG_SLOT, TASKS } from '../data/Workspace';
import type { Task } from '../data/Workspace';

const CRUMBS: ArenaCrumb[] = [
  { label: 'Acme Platform', href: '#/' },
  { label: 'Engineering', href: '#/engineering' },
  { label: 'Sprint tasks' },
];

const COLUMNS: ArenaTableColumn[] = [
  { header: 'Name' },
  { header: 'Status' },
  { header: 'Owner' },
  { header: 'Tags' },
  { header: 'Due', key: 'due' },
  { header: 'Effort', key: 'effort', numeric: true },
];

const STATUS_TONE: Record<Task['status'], ArenaTagTone> = {
  'Not started': 'neutral',
  'In progress': 'neutral',
  'In review': 'warning',
  Done: 'success',
};

const FILTER_MENU: ArenaMenuItem[] = [
  { header: 'Filter' },
  { label: 'Status', icon: 'ph-bold ph-circle-half' },
  { label: 'Owner', icon: 'ph-bold ph-user' },
  { label: 'Due date', icon: 'ph-bold ph-calendar-blank' },
];

const SORT_MENU: ArenaMenuItem[] = [
  { header: 'Sort by' },
  { label: 'Due date', icon: 'ph-bold ph-sort-ascending' },
  { label: 'Effort', icon: 'ph-bold ph-sort-descending' },
];

@Component({
  selector: 'app-tags',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaTag],
  host: { class: 'tags' },
  template: `
    @for (tag of tags(); track tag) {
      <arena-tag [colorId]="slot(tag)">{{ tag }}</arena-tag>
    }
  `,
})
export class Tags {
  readonly tags = input.required<readonly string[]>();
  protected slot(tag: string): ArenaCatSlot {
    return TAG_SLOT[tag] ?? 1;
  }
}

@Component({
  selector: 'app-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaButton, ArenaInput, ArenaMenu],
  host: { class: 'db__toolbar' },
  template: `
    <div class="db__toolbar-spacer"></div>
    <div class="db__search">
      <arena-input
        type="search"
        placeholder="Search tasks"
        icon="ph-bold ph-magnifying-glass"
        [value]="query()"
        (change)="queryChange.emit($event)"
      />
    </div>
    <arena-menu align="end" [items]="filter">
      <arena-button trigger class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-funnel">Filter</arena-button>
    </arena-menu>
    <arena-menu align="end" [items]="sort">
      <arena-button trigger class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-arrows-down-up">Sort</arena-button>
    </arena-menu>
    <arena-button class="arena-size-sm" icon="ph-bold ph-plus">New</arena-button>
  `,
})
export class Toolbar {
  readonly query = input.required<string>();
  readonly queryChange = output<string>();
  protected readonly filter = FILTER_MENU;
  protected readonly sort = SORT_MENU;
}

@Component({
  selector: 'app-board-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar, Tags],
  host: { style: 'display: contents' },
  template: `
    <article class="board__card">
      <p class="board__name">{{ task().name }}</p>
      <app-tags [tags]="task().tags" />
      <footer class="board__foot">
        <span class="board__owner">
          <arena-avatar [name]="task().owner" [src]="task().ownerImage" class="arena-size-xs" />
          {{ task().owner }}
        </span>
        <span class="board__due arena-num">{{ task().due }}</span>
      </footer>
    </article>
  `,
})
export class BoardCard {
  readonly task = input.required<Task>();
}

@Component({
  selector: 'app-database-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaAction, ArenaAvatar, ArenaBoard, ArenaBoardColumn, ArenaBreadcrumbs, ArenaButton,
    ArenaFooter, ArenaIconButton, ArenaTab, ArenaTable, ArenaTableCell, ArenaTableRow, ArenaTabs,
    ArenaTag, BoardCard, Tags, Toolbar,
  ],
  host: { class: 'doc' },
  template: `
    <header class="topbar">
      <arena-breadcrumbs ariaLabel="Page location" [items]="crumbs" />
      <div class="topbar__actions">
        <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-share-network">Share</arena-button>
        <arena-icon-button icon="ph-bold ph-dots-three" label="More actions" class="arena-size-sm" />
      </div>
    </header>

    <div class="doc__scroll">
      <div class="db">
        <div class="db__head">
          <div class="doc__icon doc__icon--inline">
            <i class="ph-fill ph-kanban" aria-hidden="true"></i>
          </div>
          <h1 class="doc__title doc__title--db">Sprint tasks</h1>
        </div>

        <div class="db__views" style="--arena-column-due-align: right; --arena-column-effort-align: right">
          <arena-tabs [value]="view()" (change)="view.set($event)">
            <arena-tab value="table" label="Table">
              <app-toolbar [query]="query()" (queryChange)="query.set($event)" />
              <arena-table label="Sprint tasks" [columns]="columns">
                @for (task of rows(); track task.id) {
                  <tr arena-table-row interactive>
                    <td arena-table-cell>
                      <span class="db__name">
                        <i class="ph-bold ph-file-text" aria-hidden="true"></i>
                        {{ task.name }}
                      </span>
                    </td>
                    <td arena-table-cell><arena-tag [tone]="tone(task.status)" [class.arena-accent-primary]="task.status === 'In progress'">{{ task.status }}</arena-tag></td>
                    <td arena-table-cell>
                      <span class="db__owner">
                        <arena-avatar [name]="task.owner" [src]="task.ownerImage" class="arena-size-xs" />
                        {{ task.owner }}
                      </span>
                    </td>
                    <td arena-table-cell><app-tags [tags]="task.tags" /></td>
                    <td arena-table-cell>{{ task.due }}</td>
                    <td arena-table-cell>{{ task.effort }}</td>
                  </tr>
                }
              </arena-table>
            </arena-tab>

            <arena-tab value="board" label="Board">
              <app-toolbar [query]="query()" (queryChange)="query.set($event)" />
              <arena-board label="Sprint tasks by status">
                @for (status of boardColumns; track status) {
                  <arena-board-column [title]="status" [count]="column(status).length">
                    <arena-icon-button action icon="ph-bold ph-plus" [label]="'Add to ' + status" class="arena-size-sm" />
                    @for (task of column(status); track task.id) {
                      <app-board-card [task]="task" />
                    }
                    <arena-button footer class="arena-emphasis-ghost arena-size-sm arena-fill" icon="ph-bold ph-plus">New</arena-button>
                  </arena-board-column>
                }
              </arena-board>
            </arena-tab>
          </arena-tabs>
        </div>
      </div>
    </div>
  `,
})
export class DatabaseView {
  protected readonly view = signal('table');
  protected readonly query = signal('');

  protected readonly crumbs = CRUMBS;
  protected readonly columns = COLUMNS;
  protected readonly boardColumns = BOARD_COLUMNS;

  protected readonly rows = computed(() => {
    const needle = this.query().toLowerCase();
    return TASKS.filter((task) => task.name.toLowerCase().includes(needle));
  });

  protected tone(status: Task['status']): ArenaTagTone {
    return STATUS_TONE[status];
  }

  protected column(status: string): readonly Task[] {
    return this.rows().filter((task) => task.status === status);
  }
}
