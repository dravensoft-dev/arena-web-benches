import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  ArenaBulkActionBar,
  ArenaButton,
  ArenaCheckbox,
  ArenaIcon,
  ArenaIconButton,
  ArenaInput,
  ArenaMenu,
  ArenaProgressBar,
  ArenaSegmentedControl,
  arenaCatColor,
} from '@dravensoft/arena-angular';
import type {
  ArenaBulkAction, ArenaCatSlot, ArenaMenuItem, ArenaSegmentOption,
} from '@dravensoft/arena-angular';
import { Assignees, PriorityFlag, StatusDot, StatusPill, Tags } from '../Chrome';
import { STATUS_ORDER, STATUS_SLOT, TASKS } from '../data/Space';
import type { Status, Task } from '../data/Space';

const GROUPINGS: ArenaSegmentOption[] = [
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'priority', label: 'Priority' },
];

const BULK: ArenaBulkAction[] = [
  { id: 'status', label: 'Set status', icon: 'ph-bold ph-circle-half' },
  { id: 'assign', label: 'Assign', icon: 'ph-bold ph-user-plus' },
  { id: 'due', label: 'Set due date', icon: 'ph-bold ph-calendar-plus' },
  { id: 'delete', label: 'Delete', icon: 'ph-bold ph-trash', destructive: true },
];

const ROW_MENU: ArenaMenuItem[] = [
  { label: 'Open task', icon: 'ph-bold ph-arrow-square-out' },
  { label: 'Copy link', icon: 'ph-bold ph-link' },
  { label: 'Duplicate', icon: 'ph-bold ph-copy' },
  { divider: true },
  { label: 'Delete', icon: 'ph-bold ph-trash', destructive: true },
];

@Component({
  selector: 'app-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaCheckbox, ArenaIcon, ArenaIconButton, ArenaMenu, ArenaProgressBar, Assignees, PriorityFlag,
    StatusPill, Tags,
  ],
  host: { class: 'row', '[attr.data-checked]': "checked() ? 'yes' : 'no'" },
  template: `
    <span class="row__check"><arena-checkbox [checked]="checked()" (change)="check.emit($event)" /></span>
    <span class="row__grip"><arena-icon icon="ph-bold ph-dots-six-vertical" /></span>
    <span class="row__name">
      <span class="row__title">{{ task().name }}</span>
      <span class="row__meta">
        <span class="row__id arena-num">{{ task().id }}</span>
        @if (task().subtasks > 0) {
          <span class="row__chip"><arena-icon icon="ph-bold ph-tree-structure" />{{ task().subtasks }}</span>
        }
        @if (task().comments > 0) {
          <span class="row__chip"><arena-icon icon="ph-bold ph-chat-circle" />{{ task().comments }}</span>
        }
      </span>
    </span>
    <span class="row__cell"><app-status-pill [status]="task().status" /></span>
    <span class="row__cell"><app-assignees [ids]="task().assignees" /></span>
    <span class="row__cell"><app-priority-flag [priority]="task().priority" /></span>
    <span class="row__cell row__cell--date arena-num">{{ task().due }}</span>
    <span class="row__cell row__cell--bar">
      <arena-progress-bar [label]="task().name + ' progress'" [progressPercentage]="task().progress" class="arena-size-sm" [showLabel]="false" [showPercentage]="false" />
    </span>
    <span class="row__cell row__cell--tags"><app-tags [tags]="task().tags" /></span>
    <span class="row__cell row__cell--pts arena-num">{{ task().points }}</span>
    <span class="row__cell">
      <arena-menu align="end" [items]="menu">
        <arena-icon-button trigger icon="ph-bold ph-dots-three" [label]="'Actions for ' + task().name" class="arena-size-sm" />
      </arena-menu>
    </span>
  `,
})
export class Row {
  readonly task = input.required<Task>();
  readonly checked = input.required<boolean>();
  readonly check = output<boolean>();
  protected readonly menu = ROW_MENU;
}

@Component({
  selector: 'app-list-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaBulkActionBar, ArenaButton, ArenaIcon, ArenaIconButton, ArenaInput, ArenaSegmentedControl, Row,
    StatusDot,
  ],
  host: { class: 'screen' },
  template: `
    <div class="toolbar">
      <arena-segmented-control
        ariaLabel="Group tasks by"
        [options]="groupings"
        [value]="grouping()"
        (change)="grouping.set($event)"
        class="arena-size-sm"
      />
      <div class="toolbar__gap"></div>
      <div class="toolbar__search">
        <arena-input type="search" placeholder="Search tasks" icon="ph-bold ph-magnifying-glass" [value]="query()" (change)="query.set($event)" />
      </div>
      <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-funnel">Filter</arena-button>
      <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-eye">Show</arena-button>
      <arena-button class="arena-size-sm" icon="ph-bold ph-plus">Add task</arena-button>
    </div>

    <div class="list">
      @for (status of statusOrder; track status) {
        @if (group(status).length > 0) {
          <section class="group">
            <header class="group__head" [style.borderInlineStartColor]="edge(status)">
              <span class="group__caret" aria-hidden="true"><arena-icon icon="ph-bold ph-caret-down" /></span>
              <app-status-dot [status]="status" />
              <h2 class="group__name">{{ status }}</h2>
              <span class="group__count arena-num">{{ group(status).length }}</span>
              <span class="group__gap"></span>
              <span class="group__points arena-num">{{ points(status) }} pts</span>
              <arena-icon-button icon="ph-bold ph-plus" [label]="'Add a task to ' + status" class="arena-size-sm" />
            </header>

            <div class="group__head-row">
              <span></span>
              <span></span>
              <span>Name</span>
              <span>Status</span>
              <span>Assignees</span>
              <span>Priority</span>
              <span>Due</span>
              <span>Progress</span>
              <span>Tags</span>
              <span>Pts</span>
              <span></span>
            </div>

            @for (task of group(status); track task.id) {
              <app-row [task]="task" [checked]="isChecked(task.id)" (check)="onCheck(task.id, $event)" />
            }
          </section>
        }
      }
    </div>

    @if (selected().length > 0) {
      <div class="bulk">
        <arena-bulk-action-bar
          [count]="selected().length"
          noun="task"
          [actions]="bulk"
          clearable
          (clear)="checked.set({})"
        />
      </div>
    }
  `,
})
export class ListView {
  protected readonly checked = signal<Record<string, boolean>>({});
  protected readonly query = signal('');
  protected readonly grouping = signal('status');

  protected readonly groupings = GROUPINGS;
  protected readonly bulk = BULK;
  protected readonly statusOrder = STATUS_ORDER;

  protected readonly rows = computed(() => {
    const needle = this.query().toLowerCase();
    return TASKS.filter((task) => task.name.toLowerCase().includes(needle));
  });

  protected readonly selected = computed(() => {
    const map = this.checked();
    return Object.keys(map).filter((id) => map[id]);
  });

  protected group(status: Status): readonly Task[] {
    return this.rows().filter((task) => task.status === status);
  }

  protected points(status: Status): number {
    return this.group(status).reduce((sum, task) => sum + task.points, 0);
  }

  protected edge(status: Status): string {
    const slot: ArenaCatSlot = STATUS_SLOT[status];
    return arenaCatColor(slot);
  }

  protected isChecked(id: string): boolean {
    return Boolean(this.checked()[id]);
  }

  protected onCheck(id: string, next: boolean): void {
    this.checked.update((prev) => ({ ...prev, [id]: next }));
  }
}
