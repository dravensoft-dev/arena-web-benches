import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  ArenaAction, ArenaBoard, ArenaBoardColumn, ArenaButton, ArenaFooter, ArenaIcon, ArenaIconButton,
  ArenaProgressBar,
} from '@dravensoft/arena-angular';
import type { ArenaCatSlot } from '@dravensoft/arena-angular';
import { Assignees, PriorityFlag, Tags } from '../Chrome';
import { STATUS_ORDER, STATUS_SLOT, TASKS } from '../data/Space';
import type { Status, Task } from '../data/Space';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaIcon, ArenaIconButton, ArenaProgressBar, Assignees, PriorityFlag, Tags],
  host: { style: 'display: contents' },
  template: `
    <article class="kcard">
      <header class="kcard__head">
        <span class="kcard__id arena-num">{{ task().id }}</span>
        <app-priority-flag [priority]="task().priority" />
        <span class="kcard__gap"></span>
        <arena-icon-button icon="ph-bold ph-dots-three" [label]="'Actions for ' + task().name" class="arena-size-sm" />
      </header>

      <p class="kcard__name">{{ task().name }}</p>
      <app-tags [tags]="task().tags" />

      @if (task().progress > 0 && task().progress < 100) {
        <arena-progress-bar [label]="task().name + ' progress'" [progressPercentage]="task().progress" class="arena-size-sm" [showLabel]="false" [showPercentage]="false" />
      }

      <footer class="kcard__foot">
        <app-assignees [ids]="task().assignees" />
        <span class="kcard__gap"></span>
        <span class="kcard__stat"><arena-icon icon="ph-bold ph-chat-circle" />{{ task().comments }}</span>
        <span class="kcard__stat"><arena-icon icon="ph-bold ph-tree-structure" />{{ task().subtasks }}</span>
        <span class="kcard__due arena-num">{{ task().due }}</span>
      </footer>
    </article>
  `,
})
export class Card {
  readonly task = input.required<Task>();
}

@Component({
  selector: 'app-board-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaAction, ArenaBoard, ArenaBoardColumn, ArenaButton, ArenaFooter, ArenaIconButton, Card,
  ],
  host: { class: 'screen' },
  template: `
    <div class="toolbar">
      <span class="toolbar__label">Grouped by status</span>
      <div class="toolbar__gap"></div>
      <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-funnel">Filter</arena-button>
      <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-users-three">Me mode</arena-button>
      <arena-button class="arena-size-sm" icon="ph-bold ph-plus">Add task</arena-button>
    </div>

    <arena-board label="Sprint 32 tasks by status">
      @for (status of statusOrder; track status) {
        <arena-board-column
          [title]="status"
          [count]="column(status).length"
          [summary]="points(status) + ' pts'"
          [colorId]="slot(status)"
        >
          <arena-icon-button action icon="ph-bold ph-plus" [label]="'Add a task to ' + status" class="arena-size-sm" />
          @for (task of column(status); track task.id) {
            <app-card [task]="task" />
          }
          <arena-button footer class="arena-emphasis-ghost arena-size-sm arena-fill" icon="ph-bold ph-plus">Add task</arena-button>
        </arena-board-column>
      }
    </arena-board>
  `,
})
export class BoardView {
  protected readonly statusOrder = STATUS_ORDER;

  protected column(status: Status): readonly Task[] {
    return TASKS.filter((task) => task.status === status);
  }

  protected points(status: Status): number {
    return this.column(status).reduce((sum, task) => sum + task.points, 0);
  }

  protected slot(status: Status): ArenaCatSlot {
    return STATUS_SLOT[status];
  }
}
