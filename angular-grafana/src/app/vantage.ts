import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  ArenaActions,
  ArenaAlert,
  ArenaBadge,
  ArenaBarChart,
  ArenaButton,
  ArenaChartCard,
  ArenaDoughnutChart,
  ArenaErrorState,
  ArenaGaugeChart,
  ArenaHeatmapChart,
  ArenaHorizontalBarChart,
  ArenaIcon,
  ArenaIconButton,
  ArenaLineChart,
  ArenaMain,
  ArenaMeter,
  ArenaPageHead,
  ArenaRadarChart,
  ArenaScatterChart,
  ArenaSelect,
  ArenaSideNav,
  ArenaSideNavItem,
  ArenaSparkline,
  ArenaSpinner,
  ArenaStatCard,
  ArenaTable,
  ArenaTableCell,
  ArenaTableRow,
  ArenaTag,
  ArenaThemeService,
  ArenaTreeView,
} from '@dravensoft/arena-angular';
import type {
  ArenaStatDelta, ArenaTableColumn, ArenaTreeExpansion,
} from '@dravensoft/arena-angular';
import {
  ALERTS, BUDGET, BUDGET_LABELS, CPU_BANDS, DASHBOARDS, ENDPOINTS, FOLDERS, HEALTH, HEALTH_AXES,
  HOURS, LATENCY, LATENCY_BUCKETS, QUOTAS, RANGES, REGIONS, REQUESTS, SLOWEST, THROUGHPUT,
} from '../data/Metrics';

const COLUMNS: ArenaTableColumn[] = [
  { header: 'State' },
  { header: 'Rule' },
  { header: 'Service', numeric: true },
  { header: 'For', key: 'for', numeric: true },
  { header: 'Last 24 hours', key: 'trend' },
];

/* A leaf of the folder tree is a dashboard, and its id is the board the rail opens; a folder
   opens and closes and goes nowhere. */
const BOARDS = new Set(DASHBOARDS.map((one) => one.id));

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [
    ArenaActions, ArenaAlert, ArenaBadge, ArenaBarChart, ArenaButton, ArenaChartCard, ArenaDoughnutChart,
    ArenaErrorState, ArenaGaugeChart, ArenaHeatmapChart, ArenaHorizontalBarChart, ArenaIcon,
    ArenaIconButton, ArenaLineChart, ArenaMain, ArenaMeter, ArenaPageHead, ArenaRadarChart,
    ArenaScatterChart, ArenaSelect, ArenaSideNav, ArenaSideNavItem, ArenaSparkline, ArenaSpinner,
    ArenaStatCard, ArenaTable, ArenaTableCell, ArenaTableRow, ArenaTag, ArenaTreeView,
  ],
  template: `
    <div class="console">
      <aside class="rail">
        <div class="rail__head">
          <span class="rail__glyph" aria-hidden="true"><arena-icon icon="ph-fill ph-pulse" /></span>
          <span class="rail__word">Vantage</span>
        </div>
        <arena-side-nav ariaLabel="Dashboards" [active]="board()" (nav)="board.set($event)">
          @for (one of dashboards; track one.id) {
            <arena-side-nav-item [id]="one.id" [label]="one.label" [icon]="one.icon" [badge]="badge(one.badge)" />
          }
        </arena-side-nav>
      </aside>

      <arena-main>
        @if (board() === 'browse') {
        <div class="board">
          <arena-page-head title="Dashboards" subtitle="Six dashboards in four folders">
            <arena-button actions icon="ph-bold ph-plus" class="arena-size-sm">New dashboard</arena-button>
            <arena-icon-button
              actions
              [icon]="theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'"
              [label]="theme() === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'"
              class="arena-size-sm"
              (activate)="themes.set(theme() === 'dark' ? 'light' : 'dark')"
            />
          </arena-page-head>

          <div class="browse">
            <section class="browse__folders" aria-label="Folders">
              <h2 class="browse__title">Folders</h2>
              <arena-tree-view
                label="Dashboards by folder"
                [nodes]="folders"
                [expanded]="expanded()"
                (expandedChange)="expanded.set($event)"
                (activate)="open($event)"
              />
            </section>

            <section class="browse__usage" aria-label="Usage">
              <h2 class="browse__title">Usage this month</h2>
              @for (one of quotas; track one.id) {
                <arena-meter
                  [label]="one.label"
                  [value]="one.value"
                  [max]="one.max"
                  [low]="one.low"
                  [high]="one.high"
                  [optimum]="one.optimum"
                  [valueText]="one.valueText"
                />
              }
            </section>
          </div>
        </div>
        } @else {
        <div class="board">
          <header class="board__head">
            <div class="board__title-row">
              <h1 class="board__title">API gateway</h1>
              <arena-badge tone="danger" dot>2 firing</arena-badge>
              <span class="board__gap"></span>
              <arena-select label="Range" [options]="ranges" [value]="range()" (valueChange)="range.set($event)" />
              <arena-icon-button icon="ph-bold ph-arrows-clockwise" label="Refresh now" class="arena-size-sm" />
              <arena-icon-button
                [icon]="theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'"
                [label]="theme() === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'"
                class="arena-size-sm"
                (activate)="themes.set(theme() === 'dark' ? 'light' : 'dark')"
              />
            </div>
            <p class="board__sub">
              {{ 'Six regions, one gateway. Refreshed ' }}
              <span class="arena-num">30</span>
              {{ ' seconds ago.' }}
            </p>
          </header>

          <arena-alert
            tone="danger"
            title="Checkout is over its error budget"
            icon="ph-bold ph-warning-octagon"
            actionLabel="Open runbook"
          >
            Two rules have been firing for fourteen minutes. The p99 is above half a second in eu-west
            and us-east.
          </arena-alert>

          <div class="stats">
            <arena-stat-card label="Requests" value="1.42M" sub="last 24 hours" [delta]="requestsDelta" />
            <arena-stat-card label="Error rate" value="0.94%" sub="5xx over all regions" tone="danger" [delta]="errorDelta" />
            <arena-stat-card label="p99 latency" value="612ms" sub="checkout, eu-west" tone="warning" [delta]="latencyDelta" />
            <arena-stat-card label="Availability" value="99.87%" sub="30 day rolling" [delta]="availabilityDelta" />
          </div>

          <div class="panels">
            <div class="panels__wide">
              <arena-chart-card title="Latency percentiles">
                <arena-line-chart
                  label="Latency percentiles over the last day"
                  [labels]="hours"
                  [series]="latency"
                  valueSuffix="ms"
                  [height]="220"
                />
              </arena-chart-card>
            </div>

            <arena-chart-card title="Requests by region">
              <arena-bar-chart
                label="Requests by region and status class"
                [labels]="regions"
                [series]="requests"
                stack
                [height]="220"
              />
            </arena-chart-card>

            <arena-chart-card title="Error budget spent">
              <arena-doughnut-chart
                label="Share of the error budget spent per service"
                [labels]="budgetLabels"
                [series]="budget"
                valueSuffix="%"
              />
            </arena-chart-card>

            <arena-chart-card title="Slowest endpoints">
              <arena-horizontal-bar-chart
                label="Slowest endpoints by p99"
                [labels]="endpoints"
                [series]="slowest"
                valueSuffix="ms"
                [height]="220"
              />
            </arena-chart-card>

            <arena-chart-card title="Latency against throughput">
              <arena-scatter-chart
                label="Latency against throughput per edge node"
                [series]="throughput"
                xLabel="Requests per second"
                yLabel="p99 latency in ms"
                [height]="220"
              />
            </arena-chart-card>

            <arena-chart-card title="Service health profile">
              <arena-radar-chart
                label="Health profile of the two busiest services"
                [labels]="healthAxes"
                [series]="health"
                fill
                [height]="220"
              />
            </arena-chart-card>

            <arena-chart-card title="Gateway CPU">
              <arena-gauge-chart label="Gateway CPU across all regions" [value]="72" valueSuffix="%" [bands]="cpuBands" />
            </arena-chart-card>

            <div class="panels__wide">
              <arena-chart-card title="Latency distribution">
                <arena-heatmap-chart
                  label="Requests per latency bucket over the last day"
                  [labels]="hours"
                  [series]="latencyBuckets"
                  [valueFormat]="{ grouping: true }"
                />
              </arena-chart-card>
            </div>

            <arena-chart-card title="Queue consumers">
              <arena-error-state
                icon="ph-bold ph-plugs"
                title="Query failed"
                headingLevel="none"
                message="The metrics service did not answer within 30 seconds."
                code="ERR_UPSTREAM_504"
                retryLabel="Retry query"
              />
            </arena-chart-card>

            <arena-chart-card title="Cache hit ratio">
              <div class="panel-wait">
                <arena-spinner label="Loading the cache hit ratio" />
              </div>
            </arena-chart-card>
          </div>

          <section class="alerts" aria-label="Active alerts" style="--arena-column-for-align: right">
            <h2 class="alerts__title">Active alerts</h2>
            <arena-table label="Active alerts" [columns]="columns">
              @for (one of alerts; track one.id) {
                <tr arena-table-row>
                  <td arena-table-cell><arena-tag [tone]="one.tone">{{ one.state }}</arena-tag></td>
                  <td arena-table-cell>{{ one.rule }}</td>
                  <td arena-table-cell>{{ one.service }}</td>
                  <td arena-table-cell>{{ one.since }}</td>
                  <td arena-table-cell>
                    <arena-sparkline [label]="one.rule + ', last 24 hours'" [labels]="hours" [series]="one.trend" [valueSuffix]="one.unit" />
                  </td>
                </tr>
              }
            </arena-table>
          </section>
        </div>
        }
      </arena-main>
    </div>
  `,
})
export class Vantage {
  protected readonly themes = inject(ArenaThemeService);
  protected readonly theme = this.themes.theme;

  protected readonly dashboards = DASHBOARDS;
  protected readonly ranges = RANGES;
  protected readonly columns = COLUMNS;
  protected readonly alerts = ALERTS;
  protected readonly hours = HOURS;
  protected readonly latency = LATENCY;
  protected readonly regions = REGIONS;
  protected readonly requests = REQUESTS;
  protected readonly budget = BUDGET;
  protected readonly budgetLabels = BUDGET_LABELS;
  protected readonly endpoints = ENDPOINTS;
  protected readonly slowest = SLOWEST;
  protected readonly throughput = THROUGHPUT;
  protected readonly healthAxes = HEALTH_AXES;
  protected readonly health = HEALTH;
  protected readonly cpuBands = CPU_BANDS;
  protected readonly latencyBuckets = LATENCY_BUCKETS;
  protected readonly folders = FOLDERS;
  protected readonly quotas = QUOTAS;

  protected readonly requestsDelta: ArenaStatDelta = { value: '6.2%', direction: 'up', tone: 'positive' };
  protected readonly errorDelta: ArenaStatDelta = { value: '0.41pp', direction: 'up', tone: 'negative' };
  protected readonly latencyDelta: ArenaStatDelta = { value: '138ms', direction: 'up', tone: 'negative' };
  protected readonly availabilityDelta: ArenaStatDelta = { value: '0.02pp', direction: 'down', tone: 'negative' };

  protected readonly board = signal('api');
  protected readonly range = signal('24h');
  protected readonly expanded = signal<ArenaTreeExpansion>({ ids: ['platform', 'data'] });

  protected open(id: string): void {
    if (BOARDS.has(id)) this.board.set(id);
  }

  protected badge(value: string | undefined): number | undefined {
    return value === undefined ? undefined : Number(value);
  }
}
