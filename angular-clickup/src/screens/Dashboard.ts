import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  ArenaActions,
  ArenaActivityFeed,
  ArenaBarChart,
  ArenaButton,
  ArenaCard,
  ArenaChartCard,
  ArenaDoughnutChart,
  ArenaFunnelChart,
  ArenaHorizontalBarChart,
  ArenaIconButton,
  ArenaLineChart,
  ArenaMenu,
  ArenaPyramidChart,
  ArenaStatCard,
  ArenaTimeline,
} from '@dravensoft/arena-angular';
import type { ArenaMenuItem, ArenaStatDelta } from '@dravensoft/arena-angular';
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
  STATUS_SPLIT,
  STATUS_SPLIT_LABELS,
  THROUGHPUT,
  THROUGHPUT_LABELS,
  WORKLOAD,
  WORKLOAD_LABELS,
} from '../data/Space';

const CARD_MENU: ArenaMenuItem[] = [
  { label: 'Edit widget', icon: 'ph-bold ph-pencil-simple' },
  { label: 'Duplicate', icon: 'ph-bold ph-copy' },
  { divider: true },
  { label: 'Remove', icon: 'ph-bold ph-trash', destructive: true },
];

const VELOCITY: ArenaStatDelta = { value: '+27%', direction: 'up', tone: 'positive' };
const CYCLE: ArenaStatDelta = { value: '-0.6d', direction: 'down', tone: 'positive' };
const BLOCKED: ArenaStatDelta = { value: '+1', direction: 'up', tone: 'negative' };
const SCOPE: ArenaStatDelta = { value: '+13', direction: 'up', tone: 'negative' };

@Component({
  selector: 'app-card-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaIconButton, ArenaMenu],
  host: { style: 'display: contents' },
  template: `
    <arena-menu align="end" [items]="menu">
      <arena-icon-button trigger icon="ph-bold ph-dots-three" [label]="'Actions for ' + name()" class="arena-size-sm" />
    </arena-menu>
  `,
})
export class CardActions {
  readonly name = input.required<string>();
  protected readonly menu = CARD_MENU;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaActions, ArenaActivityFeed, ArenaBarChart, ArenaButton, ArenaCard, ArenaChartCard,
    ArenaDoughnutChart, ArenaFunnelChart, ArenaHorizontalBarChart, ArenaLineChart, ArenaPyramidChart,
    ArenaStatCard, ArenaTimeline, CardActions,
  ],
  host: { class: 'screen' },
  template: `
    <div class="toolbar">
      <span class="toolbar__label">Sprint 32 &middot; 12 Aug to 26 Aug</span>
      <div class="toolbar__gap"></div>
      <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-calendar-blank">This sprint</arena-button>
      <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-arrow-clockwise">Refresh</arena-button>
      <arena-button class="arena-size-sm" icon="ph-bold ph-plus">Add widget</arena-button>
    </div>

    <div class="dash">
      <div class="dash__stats">
        <arena-stat-card label="Velocity" value="19" sub="story points shipped this week" icon="ph-bold ph-lightning" [delta]="velocity" />
        <arena-stat-card label="Cycle time" value="3.4d" sub="median, open to done" icon="ph-bold ph-timer" [delta]="cycle" />
        <arena-stat-card label="Blocked" value="2" sub="tasks waiting on someone" icon="ph-bold ph-prohibit" tone="danger" [delta]="blocked" />
        <arena-stat-card label="Scope added" value="13" sub="points added after sprint start" icon="ph-bold ph-plus-circle" tone="warning" [delta]="scope" />
      </div>

      <div class="dash__grid">
        <div class="dash__wide">
          <arena-chart-card title="Burndown">
            <app-card-actions actions name="Burndown" />
            <arena-line-chart
              label="Story points remaining against the ideal line"
              [labels]="burndownLabels"
              [series]="burndown"
              curve
              valueSuffix=" pts"
            />
          </arena-chart-card>
        </div>

        <arena-chart-card title="Tasks by status">
          <app-card-actions actions name="Tasks by status" />
          <arena-doughnut-chart
            label="How the sprint's tasks are split across statuses"
            [labels]="statusSplitLabels"
            [series]="statusSplit"
          />
        </arena-chart-card>

        <arena-chart-card title="Throughput">
          <app-card-actions actions name="Throughput" />
          <arena-bar-chart
            label="Tasks shipped and reopened per week"
            [labels]="throughputLabels"
            [series]="throughput"
          />
        </arena-chart-card>

        <arena-chart-card title="Workload">
          <app-card-actions actions name="Workload" />
          <arena-horizontal-bar-chart
            label="Story points assigned per person"
            [labels]="workloadLabels"
            [series]="workload"
            valueSuffix=" pts"
          />
        </arena-chart-card>

        <arena-chart-card title="Status funnel">
          <app-card-actions actions name="Status funnel" />
          <arena-funnel-chart
            label="Tasks this sprint reaching each status"
            [labels]="funnelLabels"
            [series]="funnel"
            valueSuffix=" tasks"
          />
        </arena-chart-card>

        <arena-chart-card title="Opened and closed">
          <app-card-actions actions name="Opened and closed" />
          <arena-pyramid-chart
            label="Tasks opened and closed this sprint by priority"
            [labels]="openCloseLabels"
            [series]="openClose"
          />
        </arena-chart-card>

        <arena-card title="Sprint 32 milestones" eyebrow="Schedule">
          <arena-timeline label="Sprint 32" [items]="milestones" [index]="milestoneNow" />
        </arena-card>

        <arena-card title="Recent activity" eyebrow="Live">
          <arena-activity-feed [items]="activity" label="Recent activity in this space" />
        </arena-card>
      </div>
    </div>
  `,
})
export class Dashboard {
  protected readonly velocity = VELOCITY;
  protected readonly cycle = CYCLE;
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
}
