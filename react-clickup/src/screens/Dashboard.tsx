import React from 'react';
import {
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
} from '@dravensoft/arena-react';
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

export const CARD_MENU = [
  { label: 'Edit widget', icon: 'ph-bold ph-pencil-simple' },
  { label: 'Duplicate', icon: 'ph-bold ph-copy' },
  { divider: true },
  { label: 'Remove', icon: 'ph-bold ph-trash', destructive: true },
];

export function CardActions({ name }: { name: string }) {
  return (
    <ArenaMenu
      align="end"
      items={CARD_MENU}
      trigger={<ArenaIconButton icon="ph-bold ph-dots-three" label={`Actions for ${name}`} className="arena-size-sm" />}
    />
  );
}

export function Dashboard() {
  return (
    <div className="screen">
      <div className="toolbar">
        <span className="toolbar__label">Sprint 32 &middot; 12 Aug to 26 Aug</span>
        <div className="toolbar__gap" />
        <ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-calendar-blank">This sprint</ArenaButton>
        <ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-arrow-clockwise">Refresh</ArenaButton>
        <ArenaButton className="arena-size-sm" icon="ph-bold ph-plus">Add widget</ArenaButton>
      </div>

      <div className="dash">
        <div className="dash__stats">
          <ArenaStatCard label="Velocity" value="19" sub="story points shipped this week" icon="ph-bold ph-lightning" delta={{ value: '+27%', direction: 'up', tone: 'positive' }} />
          <ArenaStatCard label="Cycle time" value="3.4d" sub="median, open to done" icon="ph-bold ph-timer" delta={{ value: '-0.6d', direction: 'down', tone: 'positive' }} />
          <ArenaStatCard label="Blocked" value="2" sub="tasks waiting on someone" icon="ph-bold ph-prohibit" tone="danger" delta={{ value: '+1', direction: 'up', tone: 'negative' }} />
          <ArenaStatCard label="Scope added" value="13" sub="points added after sprint start" icon="ph-bold ph-plus-circle" tone="warning" delta={{ value: '+13', direction: 'up', tone: 'negative' }} />
        </div>

        <div className="dash__grid">
          <div className="dash__wide">
            <ArenaChartCard title="Burndown" actions={<CardActions name="Burndown" />}>
              <ArenaLineChart
                label="Story points remaining against the ideal line"
                labels={BURNDOWN_LABELS}
                series={BURNDOWN}
                curve
                valueSuffix=" pts"
              />
            </ArenaChartCard>
          </div>

          <ArenaChartCard title="Tasks by status" actions={<CardActions name="Tasks by status" />}>
            <ArenaDoughnutChart
              label="How the sprint's tasks are split across statuses"
              labels={STATUS_SPLIT_LABELS}
              series={STATUS_SPLIT}
            />
          </ArenaChartCard>

          <ArenaChartCard title="Throughput" actions={<CardActions name="Throughput" />}>
            <ArenaBarChart
              label="Tasks shipped and reopened per week"
              labels={THROUGHPUT_LABELS}
              series={THROUGHPUT}
            />
          </ArenaChartCard>

          <ArenaChartCard title="Workload" actions={<CardActions name="Workload" />}>
            <ArenaHorizontalBarChart
              label="Story points assigned per person"
              labels={WORKLOAD_LABELS}
              series={WORKLOAD}
              valueSuffix=" pts"
            />
          </ArenaChartCard>

          <ArenaChartCard title="Status funnel" actions={<CardActions name="Status funnel" />}>
            <ArenaFunnelChart
              label="Tasks this sprint reaching each status"
              labels={FUNNEL_LABELS}
              series={FUNNEL}
              valueSuffix=" tasks"
            />
          </ArenaChartCard>

          <ArenaChartCard title="Opened and closed" actions={<CardActions name="Opened and closed" />}>
            <ArenaPyramidChart
              label="Tasks opened and closed this sprint by priority"
              labels={OPEN_CLOSE_LABELS}
              series={OPEN_CLOSE}
            />
          </ArenaChartCard>

          <ArenaCard title="Sprint 32 milestones" eyebrow="Schedule">
            <ArenaTimeline label="Sprint 32" items={MILESTONES} index={MILESTONE_NOW} />
          </ArenaCard>

          <ArenaCard title="Recent activity" eyebrow="Live">
            <ArenaActivityFeed items={ACTIVITY} label="Recent activity in this space" />
          </ArenaCard>
        </div>
      </div>
    </div>
  );
}
