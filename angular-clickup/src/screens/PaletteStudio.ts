import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  ArenaAction,
  ArenaActions,
  ArenaActivityFeed,
  ArenaAlert,
  ArenaAppLogo,
  ArenaAvatar,
  ArenaBarChart,
  ArenaBoard,
  ArenaBoardColumn,
  ArenaBreadcrumbs,
  ArenaBulkActionBar,
  ArenaButton,
  ArenaCard,
  ArenaChartCard,
  ArenaCheckbox,
  ArenaCommandPalette,
  ArenaDoughnutChart,
  ArenaFilterBar,
  ArenaFunnelChart,
  ArenaHorizontalBarChart,
  ArenaIcon,
  ArenaIconButton,
  ArenaInput,
  ArenaLineChart,
  ArenaMultiSelect,
  ArenaPaletteScope,
  ArenaPopover,
  ArenaProgressBar,
  ArenaPyramidChart,
  ArenaSegmentedControl,
  ArenaSelect,
  ArenaSideNav,
  ArenaSideNavCollapsible,
  ArenaSideNavItem,
  ArenaSideNavSection,
  ArenaStatCard,
  ArenaTag,
  ArenaThemeService,
  ArenaTimeline,
  ArenaToast,
  ArenaToastHost,
  ArenaToastQueue,
  ArenaTooltip,
} from '@dravensoft/arena-angular';
import type {
  ArenaAppliedFilter,
  ArenaBulkAction,
  ArenaCatSlot,
  ArenaCommand,
  ArenaCrumb,
  ArenaSegmentOption,
  ArenaSelectOption,
  ArenaStatDelta,
} from '@dravensoft/arena-angular';
import type { ArenaRuntimePalette } from '@dravensoft/arena-angular/palette';
import { CardActions } from './Dashboard';
import {
  ACTIVITY,
  BURNDOWN,
  BURNDOWN_LABELS,
  FUNNEL,
  FUNNEL_LABELS,
  MILESTONES,
  MILESTONE_NOW,
  OPEN_CLOSE,
  OPEN_CLOSE_LABELS,
  PEOPLE,
  STATUS_SPLIT,
  STATUS_SPLIT_LABELS,
  THROUGHPUT,
  THROUGHPUT_LABELS,
  WORKLOAD,
  WORKLOAD_LABELS,
} from '../data/Space';
import {
  DECLARED_NAMES,
  SLOT_GROUPS,
  draftFrom,
  evaluate,
  messagesOf,
  shownColour,
} from '../data/Palette';
import type { Draft, Evaluation, Polarity, Slot } from '../data/Palette';

const POLARITIES: ArenaSegmentOption[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const GROUPINGS: ArenaSegmentOption[] = [
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'priority', label: 'Priority' },
];

const ASSIGNEES: ArenaSelectOption[] = Object.keys(PEOPLE).map((id) => ({ value: id, label: PEOPLE[id].name }));

const PRIORITIES: ArenaSelectOption[] = [
  { value: '', label: 'Any priority' },
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
];

const BULK: ArenaBulkAction[] = [
  { id: 'status', label: 'Set status', icon: 'ph-bold ph-circle-half' },
  { id: 'assign', label: 'Assign', icon: 'ph-bold ph-user-plus' },
  { id: 'delete', label: 'Delete', icon: 'ph-bold ph-trash', destructive: true },
];

const COMMANDS: ArenaCommand[] = [
  { id: 'list', label: 'Sprint 32 list', icon: 'ph-bold ph-list-checks', group: 'Views' },
  { id: 'board', label: 'Board', icon: 'ph-bold ph-kanban', group: 'Views' },
  { id: 'task', label: 'Create task', icon: 'ph-bold ph-plus', group: 'Create', shortcut: 'T' },
];

const CRUMBS: ArenaCrumb[] = [
  { label: 'Acme', href: '#/' },
  { label: 'Product', href: '#/product' },
  { label: 'Sprint 32' },
];

const VELOCITY: ArenaStatDelta = { value: '+27%', direction: 'up', tone: 'positive' };
const BLOCKED: ArenaStatDelta = { value: '+1', direction: 'up', tone: 'negative' };
const SCOPE: ArenaStatDelta = { value: '+13', direction: 'up', tone: 'negative' };

/* ---- the slot editor ---- */

@Component({
  selector: 'app-slot-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaButton, ArenaInput, ArenaPopover],
  host: { class: 'slot', '[attr.data-slot]': 'slot().key' },
  template: `
    <arena-popover [label]="'Colour of ' + slot().key" [open]="open()" (openChange)="open.set($event)">
      <arena-button trigger class="arena-emphasis-ghost arena-size-sm arena-fill">
        <span class="slot__chip" [style.background]="shown()" aria-hidden="true"></span>
        <span class="slot__key">{{ slot().key }}</span>
        <span class="slot__hex arena-num">{{ given() === undefined ? 'derived' : given() }}</span>
      </arena-button>
      <div class="pick">
        <!-- A native colour input always holds a #rrggbb; it takes #000000 only when Arena has none to show. -->
        <input
          class="pick__native"
          type="color"
          [attr.aria-label]="'Pick ' + slot().key"
          [value]="shown() ?? '#000000'"
          (input)="onPick($event)"
        />
        <arena-input
          [label]="'Value of ' + slot().key"
          [value]="given() ?? ''"
          [placeholder]="shown() ?? ''"
          (valueChange)="colour.emit({ key: slot().key, value: $event })"
        />
        @if (slot().optional) {
          <arena-button class="arena-emphasis-secondary arena-size-sm" (activate)="colour.emit({ key: slot().key, value: null })">
            Derive it again
          </arena-button>
        }
      </div>
    </arena-popover>
    @if (messages().length > 0) {
      <ul class="slot__msgs" [attr.aria-label]="'Messages for ' + slot().key">
        @for (message of messages(); track $index) { <li>{{ message }}</li> }
      </ul>
    }
  `,
})
export class SlotEditor {
  readonly slot = input.required<Slot>();
  readonly draft = input.required<Draft>();
  readonly evaluation = input.required<Evaluation>();
  readonly applied = input.required<ArenaRuntimePalette | null>();
  readonly colour = output<{ key: string; value: string | null }>();

  protected readonly open = signal(false);
  protected readonly given = computed<string | undefined>(() => this.draft().colors[this.slot().key]);
  protected readonly shown = computed(() => shownColour(this.slot(), this.draft(), this.applied()));
  protected readonly messages = computed(() => messagesOf(this.slot(), this.draft(), this.evaluation()));

  protected onPick(event: Event): void {
    this.colour.emit({ key: this.slot().key, value: (event.target as HTMLInputElement).value });
  }
}

/* ---- the grid ---- */

@Component({
  selector: 'app-palette-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaAction, ArenaActions, ArenaActivityFeed, ArenaAppLogo, ArenaAvatar, ArenaBarChart, ArenaBoard, ArenaBoardColumn, ArenaBreadcrumbs,
    ArenaBulkActionBar, ArenaButton, ArenaCard, ArenaChartCard, ArenaCheckbox, ArenaCommandPalette, ArenaDoughnutChart,
    ArenaFilterBar, ArenaFunnelChart, ArenaHorizontalBarChart, ArenaIcon, ArenaIconButton, ArenaInput, ArenaLineChart,
    ArenaMultiSelect, ArenaProgressBar, ArenaPyramidChart, ArenaSegmentedControl, ArenaSelect, ArenaSideNav,
    ArenaSideNavCollapsible, ArenaSideNavItem, ArenaSideNavSection, ArenaStatCard, ArenaTag, ArenaTimeline, ArenaToast, ArenaToastHost,
    ArenaTooltip, CardActions,
  ],
  providers: [ArenaToastQueue],
  host: { class: 'grid' },
  template: `
    <section class="cell" data-wide="no" aria-labelledby="cell-arenabutton">
      <h3 class="cell__t" id="cell-arenabutton">ArenaButton</h3>
      <div class="cell__body"><div class="cell__row">
        <arena-button icon="ph-bold ph-plus">Primary</arena-button>
        <arena-button class="arena-emphasis-secondary">Secondary</arena-button>
        <arena-button class="arena-emphasis-ghost">Ghost</arena-button>
        <arena-button class="arena-emphasis-secondary arena-size-sm">Small</arena-button>
      </div></div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenaiconbutton-arenaicon-arenatooltip">
      <h3 class="cell__t" id="cell-arenaiconbutton-arenaicon-arenatooltip">ArenaIconButton, ArenaIcon, ArenaTooltip</h3>
      <div class="cell__body"><div class="cell__row">
        <arena-tooltip label="Notifications"><arena-icon-button icon="ph-bold ph-bell" label="Notifications" /></arena-tooltip>
        <arena-icon-button icon="ph-bold ph-gear" label="Settings" class="arena-size-sm" />
        <span class="cell__icon"><arena-icon icon="ph-fill ph-rocket-launch" /></span>
      </div></div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenatag">
      <h3 class="cell__t" id="cell-arenatag">ArenaTag</h3>
      <div class="cell__body"><div class="cell__row">
        @for (slot of slots; track slot) { <arena-tag [colorId]="slot">Slot {{ slot }}</arena-tag> }
      </div></div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenaavatar">
      <h3 class="cell__t" id="cell-arenaavatar">ArenaAvatar</h3>
      <div class="cell__body"><div class="cell__row">
        <arena-avatar [name]="ada.name" [src]="ada.image" status="online" />
        <arena-avatar [name]="ben.name" [src]="ben.image" class="arena-size-sm" />
        <arena-avatar [name]="cai.name" [src]="cai.image" class="arena-size-xs" />
      </div></div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenacheckbox">
      <h3 class="cell__t" id="cell-arenacheckbox">ArenaCheckbox</h3>
      <div class="cell__body"><div class="cell__row">
        <arena-checkbox label="Select task" [checked]="checked()" (valueChange)="checked.set($event)" />
        <arena-checkbox label="Not selected" [checked]="false" />
      </div></div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenainput">
      <h3 class="cell__t" id="cell-arenainput">ArenaInput</h3>
      <div class="cell__body">
        <arena-input label="Search tasks" icon="ph-bold ph-magnifying-glass" [value]="query()" (valueChange)="query.set($event)" />
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenaselect">
      <h3 class="cell__t" id="cell-arenaselect">ArenaSelect</h3>
      <div class="cell__body">
        <arena-select label="Priority" [options]="priorities" [value]="priority()" (valueChange)="priority.set($event)" />
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenamultiselect">
      <h3 class="cell__t" id="cell-arenamultiselect">ArenaMultiSelect</h3>
      <div class="cell__body">
        <arena-multi-select label="Assignees" placeholder="Anyone" [options]="assigneeOptions" [value]="assignees()" [maxVisible]="2" (valueChange)="assignees.set($event.values)" />
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenasegmentedcontrol">
      <h3 class="cell__t" id="cell-arenasegmentedcontrol">ArenaSegmentedControl</h3>
      <div class="cell__body">
        <arena-segmented-control ariaLabel="Group tasks by" [options]="groupings" [value]="grouping()" (valueChange)="grouping.set($event)" />
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenaprogressbar">
      <h3 class="cell__t" id="cell-arenaprogressbar">ArenaProgressBar</h3>
      <div class="cell__body"><div class="cell__stack">
        <arena-progress-bar label="Onboarding" [progressPercentage]="64" />
        <arena-progress-bar label="Search rewrite" [progressPercentage]="92" class="arena-size-sm" />
      </div></div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenamenu">
      <h3 class="cell__t" id="cell-arenamenu">ArenaMenu</h3>
      <div class="cell__body">
        <app-card-actions name="the widget" />
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenabreadcrumbs">
      <h3 class="cell__t" id="cell-arenabreadcrumbs">ArenaBreadcrumbs</h3>
      <div class="cell__body"><arena-breadcrumbs ariaLabel="Location" [items]="crumbs" /></div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenaapplogo">
      <h3 class="cell__t" id="cell-arenaapplogo">ArenaAppLogo</h3>
      <div class="cell__body">
        <arena-app-logo name="ClickUp"><img mark src="img/brand-mark.svg" alt="" class="side__mark" /></arena-app-logo>
      </div>
    </section>
    <section class="cell" data-wide="yes" aria-labelledby="cell-arenatoast">
      <h3 class="cell__t" id="cell-arenatoast">ArenaToast</h3>
      <div class="cell__body"><div class="cell__stack">
        <arena-toast tone="success" title="Task created" />
        <arena-toast tone="danger" title="Pipeline failed" message="e2e tests in checkout" />
      </div></div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenatoasthost">
      <h3 class="cell__t" id="cell-arenatoasthost">ArenaToastHost</h3>
      <div class="cell__body">
        <arena-button class="arena-emphasis-secondary" (activate)="toasts.raise({ title: 'Task created', tone: 'success' })">Raise a toast</arena-button>
        <arena-toast-host class="arena-placement-top-end">
          @for (toast of toasts.toasts(); track toast.id) {
            <arena-toast [tone]="toast.tone" [title]="toast.title" (close)="toasts.dismiss(toast.id)" />
          }
        </arena-toast-host>
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenacommandpalette">
      <h3 class="cell__t" id="cell-arenacommandpalette">ArenaCommandPalette</h3>
      <div class="cell__body">
        <arena-button class="arena-emphasis-secondary" icon="ph-bold ph-magnifying-glass" (activate)="palette.set(true)">Open the palette</arena-button>
        <arena-command-palette
          [open]="palette()"
          [commands]="commands"
          placeholder="Search tasks, docs and actions"
          (close)="palette.set(false)"
          (run)="palette.set(false)"
        />
      </div>
    </section>

    <section class="cell" data-wide="no" aria-labelledby="cell-arenastatcard">
      <h3 class="cell__t" id="cell-arenastatcard">ArenaStatCard</h3>
      <div class="cell__body">
        <arena-stat-card label="Velocity" value="19" sub="story points this week" icon="ph-bold ph-lightning" [delta]="velocity" />
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenastatcard-danger-">
      <h3 class="cell__t" id="cell-arenastatcard-danger-">ArenaStatCard (danger)</h3>
      <div class="cell__body">
        <arena-stat-card label="Blocked" value="2" sub="tasks waiting" icon="ph-bold ph-prohibit" tone="danger" [delta]="blocked" />
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenastatcard-warning-">
      <h3 class="cell__t" id="cell-arenastatcard-warning-">ArenaStatCard (warning)</h3>
      <div class="cell__body">
        <arena-stat-card label="Scope added" value="13" sub="points after start" icon="ph-bold ph-plus-circle" tone="warning" [delta]="scope" />
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenacard">
      <h3 class="cell__t" id="cell-arenacard">ArenaCard</h3>
      <div class="cell__body">
        <arena-card title="Sprint 32" eyebrow="Schedule">Twelve tasks, five people, eleven days left.</arena-card>
      </div>
    </section>

    <section class="cell" data-wide="yes" aria-labelledby="cell-arenafilterbar">
      <h3 class="cell__t" id="cell-arenafilterbar">ArenaFilterBar</h3>
      <div class="cell__body">
        <arena-filter-bar label="Task filters" [applied]="applied()" (remove)="onRemove($event)" (clear)="onClear()">
          <arena-select label="Priority" [options]="priorities" [value]="priority()" (valueChange)="priority.set($event)" />
        </arena-filter-bar>
      </div>
    </section>
    <section class="cell" data-wide="yes" aria-labelledby="cell-arenabulkactionbar">
      <h3 class="cell__t" id="cell-arenabulkactionbar">ArenaBulkActionBar</h3>
      <div class="cell__body">
        <arena-bulk-action-bar [count]="3" noun="task" [actions]="bulk" clearable />
      </div>
    </section>

    <section class="cell" data-wide="yes" aria-labelledby="cell-arenalinechart">
      <h3 class="cell__t" id="cell-arenalinechart">ArenaLineChart</h3>
      <div class="cell__body">
        <arena-chart-card title="Burndown">
          <app-card-actions actions name="Burndown" />
          <arena-line-chart label="Story points remaining against the ideal line" [labels]="burndownLabels" [series]="burndown" curve valueSuffix=" pts" />
        </arena-chart-card>
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenadoughnutchart">
      <h3 class="cell__t" id="cell-arenadoughnutchart">ArenaDoughnutChart</h3>
      <div class="cell__body">
        <arena-chart-card title="Tasks by status">
          <app-card-actions actions name="Tasks by status" />
          <arena-doughnut-chart label="How the sprint's tasks are split across statuses" [labels]="statusSplitLabels" [series]="statusSplit" />
        </arena-chart-card>
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenabarchart">
      <h3 class="cell__t" id="cell-arenabarchart">ArenaBarChart</h3>
      <div class="cell__body">
        <arena-chart-card title="Throughput">
          <app-card-actions actions name="Throughput" />
          <arena-bar-chart label="Tasks shipped and reopened per week" [labels]="throughputLabels" [series]="throughput" />
        </arena-chart-card>
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenahorizontalbarchart">
      <h3 class="cell__t" id="cell-arenahorizontalbarchart">ArenaHorizontalBarChart</h3>
      <div class="cell__body">
        <arena-chart-card title="Workload">
          <app-card-actions actions name="Workload" />
          <arena-horizontal-bar-chart label="Story points assigned per person" [labels]="workloadLabels" [series]="workload" valueSuffix=" pts" />
        </arena-chart-card>
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenafunnelchart">
      <h3 class="cell__t" id="cell-arenafunnelchart">ArenaFunnelChart</h3>
      <div class="cell__body">
        <arena-chart-card title="Status funnel">
          <app-card-actions actions name="Status funnel" />
          <arena-funnel-chart label="Tasks this sprint reaching each status" [labels]="funnelLabels" [series]="funnel" valueSuffix=" tasks" />
        </arena-chart-card>
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenapyramidchart">
      <h3 class="cell__t" id="cell-arenapyramidchart">ArenaPyramidChart</h3>
      <div class="cell__body">
        <arena-chart-card title="Opened and closed">
          <app-card-actions actions name="Opened and closed" />
          <arena-pyramid-chart label="Tasks opened and closed this sprint by priority" [labels]="openCloseLabels" [series]="openClose" />
        </arena-chart-card>
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenatimeline">
      <h3 class="cell__t" id="cell-arenatimeline">ArenaTimeline</h3>
      <div class="cell__body"><arena-timeline label="Sprint 32" [items]="milestones" [index]="milestoneNow" /></div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenaactivityfeed">
      <h3 class="cell__t" id="cell-arenaactivityfeed">ArenaActivityFeed</h3>
      <div class="cell__body"><arena-activity-feed [items]="activity" label="Recent activity in this space" /></div>
    </section>

    <section class="cell" data-wide="yes" aria-labelledby="cell-arenaboard-arenaboardcolumn">
      <h3 class="cell__t" id="cell-arenaboard-arenaboardcolumn">ArenaBoard, ArenaBoardColumn</h3>
      <div class="cell__body">
        <arena-board label="Sprint 32 tasks by status">
          @for (column of columns; track column.title) {
            <arena-board-column [title]="column.title" [count]="column.count" [summary]="column.summary" [colorId]="column.slot">
              <arena-icon-button action icon="ph-bold ph-plus" [label]="'Add a task to ' + column.title" class="arena-size-sm" />
              <p class="cell__note">{{ column.note }}</p>
            </arena-board-column>
          }
        </arena-board>
      </div>
    </section>
    <section class="cell" data-wide="no" aria-labelledby="cell-arenasidenav-arenasidenavsection-arenasidenavcollapsible-arenasidenavitem">
      <h3 class="cell__t" id="cell-arenasidenav-arenasidenavsection-arenasidenavcollapsible-arenasidenavitem">ArenaSideNav, ArenaSideNavSection, ArenaSideNavCollapsible, ArenaSideNavItem</h3>
      <div class="cell__body">
        <arena-side-nav ariaLabel="Spaces" active="board">
          <arena-side-nav-section label="Spaces">
            <arena-side-nav-collapsible id="product" label="Product" icon="ph-bold ph-rocket-launch" defaultExpanded>
              <arena-side-nav-item id="list" label="Sprint 32" icon="ph-bold ph-list-bullets" />
              <arena-side-nav-item id="board" label="Board" icon="ph-bold ph-kanban" />
              <arena-side-nav-item id="backlog" label="Backlog" icon="ph-bold ph-stack" [badge]="41" />
            </arena-side-nav-collapsible>
          </arena-side-nav-section>
        </arena-side-nav>
      </div>
    </section>
  `,
})
export class PaletteGrid {
  protected readonly slots: ArenaCatSlot[] = [1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly ada = PEOPLE['ada'];
  protected readonly ben = PEOPLE['ben'];
  protected readonly cai = PEOPLE['cai'];

  /* The studio's own queue, provided on this component: the root host never hears it. */
  protected readonly toasts = inject(ArenaToastQueue);
  protected readonly grouping = signal('status');
  protected readonly checked = signal(true);
  protected readonly query = signal('');
  protected readonly priority = signal('Urgent');
  protected readonly assignees = signal<readonly string[]>(['ada']);
  protected readonly palette = signal(false);

  protected readonly applied = computed<ArenaAppliedFilter[]>(() => {
    const priority = this.priority();
    return [
      ...this.assignees().map((id) => ({ id, label: `Assignee: ${PEOPLE[id].name}` })),
      ...(priority === '' ? [] : [{ id: 'priority', label: `Priority: ${priority}` }]),
    ];
  });

  protected readonly groupings = GROUPINGS;
  protected readonly assigneeOptions = ASSIGNEES;
  protected readonly priorities = PRIORITIES;
  protected readonly bulk = BULK;
  protected readonly commands = COMMANDS;
  protected readonly crumbs = CRUMBS;
  protected readonly velocity = VELOCITY;
  protected readonly blocked = BLOCKED;
  protected readonly scope = SCOPE;

  protected readonly activity = ACTIVITY;
  protected readonly burndown = BURNDOWN;
  protected readonly burndownLabels = BURNDOWN_LABELS;
  protected readonly funnel = FUNNEL;
  protected readonly funnelLabels = FUNNEL_LABELS;
  protected readonly milestones = MILESTONES;
  protected readonly milestoneNow = MILESTONE_NOW;
  protected readonly openClose = OPEN_CLOSE;
  protected readonly openCloseLabels = OPEN_CLOSE_LABELS;
  protected readonly statusSplit = STATUS_SPLIT;
  protected readonly statusSplitLabels = STATUS_SPLIT_LABELS;
  protected readonly throughput = THROUGHPUT;
  protected readonly throughputLabels = THROUGHPUT_LABELS;
  protected readonly workload = WORKLOAD;
  protected readonly workloadLabels = WORKLOAD_LABELS;

  protected readonly columns: { title: string; count: number; summary: string; slot: ArenaCatSlot; note: string }[] = [
    { title: 'To do', count: 2, summary: '11 pts', slot: 7, note: 'Audit the notification preferences screen' },
    { title: 'In progress', count: 1, summary: '8 pts', slot: 1, note: 'Rebuild the onboarding checklist' },
    { title: 'Complete', count: 1, summary: '5 pts', slot: 5, note: 'Retire the legacy webhook worker' },
  ];

  protected onRemove(filter: ArenaAppliedFilter): void {
    if (filter.id === 'priority') this.priority.set('');
    else this.assignees.update((prev) => prev.filter((id) => id !== filter.id));
  }

  protected onClear(): void {
    this.assignees.set([]);
    this.priority.set('');
  }
}

/* ---- the screen ---- */

@Component({
  selector: 'app-palette-studio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAlert, ArenaButton, ArenaInput, ArenaPaletteScope, ArenaSegmentedControl, PaletteGrid, SlotEditor],
  host: { class: 'studio' },
  template: `
    <aside class="studio__side" aria-label="Palette">
      <div class="studio__head">
        <h2 class="studio__h">Palette</h2>
        <span class="studio__sub">Runtime palette, checked by Arena</span>
      </div>

      <div class="studio__form">
        <form (submit)="$event.preventDefault(); confirmName()">
          <arena-input label="Palette name" hint="Applied on Enter or when you leave the field" [value]="nameField()" (valueChange)="nameField.set($event)" (blur)="confirmName()" />
        </form>
        <arena-segmented-control
          ariaLabel="Polarity"
          [options]="polarities"
          [value]="draft().polarity"
          (valueChange)="setPolarity($event)"
          class="arena-size-sm"
        />
        <div class="studio__row">
          @for (name of declared; track name) {
            <arena-button class="arena-emphasis-secondary arena-size-sm" (activate)="startFrom(name)">Start from {{ name }}</arena-button>
          }
        </div>
      </div>

      <div class="studio__summary" [attr.data-tone]="tone()">
        <p class="arena-sr-only" aria-live="polite">{{ title() }}</p>
        <arena-alert [tone]="tone()" [title]="title()">
          @if (messages().length === 0) {
            The build would have said nothing about this palette.
          } @else {
            <ul class="studio__list">
              @for (message of messages(); track $index) { <li>{{ message }}</li> }
            </ul>
          }
          @if (errors().length > 0 && applied(); as kept) {
            <p class="studio__kept">The page keeps painting {{ kept.name }} as it was last accepted.</p>
          }
        </arena-alert>
      </div>

      @for (group of groups; track group.id) {
        <section class="studio__group" [attr.aria-label]="group.title">
          <h3 class="studio__gt">{{ group.title }}</h3>
          @for (slot of group.slots; track slot.key) {
            <app-slot-editor
              [slot]="slot"
              [draft]="draft()"
              [evaluation]="evaluation()"
              [applied]="applied()"
              (colour)="setColour($event.key, $event.value)"
            />
          }
        </section>
      }
    </aside>

    <div class="studio__stage">
      @if (applied(); as live) {
        <div [arenaPalette]="live.name">
          <app-palette-grid />
        </div>
      }
    </div>
  `,
})
export class PaletteStudio {
  private readonly themes = inject(ArenaThemeService);

  protected readonly polarities = POLARITIES;
  protected readonly declared = DECLARED_NAMES;
  protected readonly groups = SLOT_GROUPS;

  protected readonly draft = signal<Draft>(draftFrom('light'));
  protected readonly evaluation = computed(() => evaluate(this.draft()));
  protected readonly applied = signal<ArenaRuntimePalette | null>(null);

  protected readonly nameField = signal(this.draft().name);
  protected readonly registerError = signal<string | null>(null);
  protected readonly errors = computed(() => {
    const failed = this.registerError();
    return failed === null ? this.evaluation().errors : [...this.evaluation().errors, failed];
  });
  protected readonly messages = computed(() => [
    ...this.errors(),
    ...this.evaluation().reports.map((report) => report.message),
  ]);
  protected readonly tone = computed<'danger' | 'warning' | 'success'>(() =>
    this.errors().length > 0 ? 'danger' : this.evaluation().reports.length > 0 ? 'warning' : 'success',
  );
  protected readonly title = computed(() => {
    const { reports } = this.evaluation();
    if (this.errors().length > 0) return 'Arena refused this palette';
    if (reports.length > 0) return `${reports.length} report${reports.length === 1 ? '' : 's'} from Arena`;
    return 'Arena reports nothing';
  });

  constructor() {
    /* Arena built a palette: register it, and the scope below paints it. A refused draft leaves the last one painted. */
    effect(() => {
      const { palette } = this.evaluation();
      if (palette === null) {
        this.registerError.set(null);
        return;
      }
      try {
        this.themes.register(palette);
        this.applied.set(palette);
        this.registerError.set(null);
      } catch (error) {
        this.registerError.set(error instanceof Error ? error.message : String(error));
      }
    });
  }

  /* The name is applied when it is confirmed, so the registry holds one entry per name the user settles on. */
  protected confirmName(): void {
    this.draft.update((prev) => (prev.name === this.nameField() ? prev : { ...prev, name: this.nameField() }));
  }

  protected startFrom(declared: string): void {
    this.draft.update((prev) => ({ ...draftFrom(declared), name: prev.name }));
  }

  protected setPolarity(value: string): void {
    this.draft.update((prev) => ({ ...prev, polarity: value as Polarity }));
  }

  protected setColour(key: string, value: string | null): void {
    this.draft.update((prev) => {
      const colors = { ...prev.colors };
      if (value === null) delete colors[key];
      else colors[key] = value;
      return { ...prev, colors };
    });
  }
}
