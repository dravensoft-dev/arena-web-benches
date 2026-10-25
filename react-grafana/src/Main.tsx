import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
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
  ArenaIconsProvider,
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
  ArenaTreeView,
  initArenaTheme,
  useArenaTheme,
} from '@dravensoft/arena-react';
import type { ArenaTreeExpansion } from '@dravensoft/arena-react';

import { ARENA_SPRITE } from './arena.icons.generated.js';
import './arena.package.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import {
  ALERTS, BUDGET, BUDGET_LABELS, CPU_BANDS, DASHBOARDS, ENDPOINTS, FOLDERS, HEALTH, HEALTH_AXES,
  HOURS, LATENCY, LATENCY_BUCKETS, QUOTAS, RANGES, REGIONS, REQUESTS, SLOWEST, THROUGHPUT,
} from './data/Metrics';

initArenaTheme({
  palettes: [
    { name: 'dark', polarity: 'dark' },
    { name: 'light', polarity: 'light' },
  ],
  default: 'dark',
});

const COLUMNS = [
  { header: 'State' },
  { header: 'Rule' },
  { header: 'Service', numeric: true },
  { header: 'For', key: 'for', numeric: true },
  { header: 'Last 24 hours', key: 'trend' },
];

/* A leaf of the folder tree is a dashboard, and its id is the board the rail opens; a folder
   opens and closes and goes nowhere. */
const BOARDS = new Set(DASHBOARDS.map((one) => one.id));

function Vantage() {
  const [theme, setTheme] = useArenaTheme();
  const [board, setBoard] = useState('api');
  const [range, setRange] = useState('24h');
  const [expanded, setExpanded] = useState<ArenaTreeExpansion>({ ids: ['platform', 'data'] });

  const themeToggle = (
    <ArenaIconButton
      icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'}
      label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
      className="arena-size-sm"
      onActivate={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    />
  );

  return (
    <div className="console">
      <aside className="rail">
        <div className="rail__head">
          <span className="rail__glyph" aria-hidden="true"><ArenaIcon icon="ph-fill ph-pulse" /></span>
          <span className="rail__word">Vantage</span>
        </div>
        <ArenaSideNav ariaLabel="Dashboards" active={board} onNav={setBoard}>
          {DASHBOARDS.map((one) => (
            <ArenaSideNavItem key={one.id} id={one.id} label={one.label} icon={one.icon} badge={one.badge === undefined ? undefined : Number(one.badge)} />
          ))}
        </ArenaSideNav>
      </aside>

      <ArenaMain>
        {board === 'browse' ? (
        <div className="board">
          <ArenaPageHead
            title="Dashboards"
            subtitle="Six dashboards in four folders"
            actions={<>
              <ArenaButton icon="ph-bold ph-plus" className="arena-size-sm">New dashboard</ArenaButton>
              {themeToggle}
            </>}
          />

          <div className="browse">
            <section className="browse__folders" aria-label="Folders">
              <h2 className="browse__title">Folders</h2>
              <ArenaTreeView
                label="Dashboards by folder"
                nodes={FOLDERS}
                expanded={expanded}
                onExpandedChange={setExpanded}
                onActivate={(id) => { if (BOARDS.has(id)) setBoard(id); }}
              />
            </section>

            <section className="browse__usage" aria-label="Usage">
              <h2 className="browse__title">Usage this month</h2>
              {QUOTAS.map((one) => (
                <ArenaMeter
                  key={one.id}
                  label={one.label}
                  value={one.value}
                  max={one.max}
                  low={one.low}
                  high={one.high}
                  optimum={one.optimum}
                  valueText={one.valueText}
                />
              ))}
            </section>
          </div>
        </div>
        ) : (
        <div className="board">
          <header className="board__head">
            <div className="board__title-row">
              <h1 className="board__title">API gateway</h1>
              <ArenaBadge tone="danger" dot>2 firing</ArenaBadge>
              <span className="board__gap" />
              <ArenaSelect label="Range" options={RANGES} value={range} onValueChange={setRange} />
              <ArenaIconButton icon="ph-bold ph-arrows-clockwise" label="Refresh now" className="arena-size-sm" />
              {themeToggle}
            </div>
            <p className="board__sub">
              {'Six regions, one gateway. Refreshed '}
              <span className="arena-num">30</span>
              {' seconds ago.'}
            </p>
          </header>

          <ArenaAlert
            tone="danger"
            title="Checkout is over its error budget"
            icon="ph-bold ph-warning-octagon"
            actionLabel="Open runbook"
          >
            Two rules have been firing for fourteen minutes. The p99 is above half a second in eu-west
            and us-east.
          </ArenaAlert>

          <div className="stats">
            <ArenaStatCard label="Requests" value="1.42M" sub="last 24 hours" delta={{ value: '6.2%', direction: 'up', tone: 'positive' }} />
            <ArenaStatCard label="Error rate" value="0.94%" sub="5xx over all regions" tone="danger" delta={{ value: '0.41pp', direction: 'up', tone: 'negative' }} />
            <ArenaStatCard label="p99 latency" value="612ms" sub="checkout, eu-west" tone="warning" delta={{ value: '138ms', direction: 'up', tone: 'negative' }} />
            <ArenaStatCard label="Availability" value="99.87%" sub="30 day rolling" delta={{ value: '0.02pp', direction: 'down', tone: 'negative' }} />
          </div>

          <div className="panels">
            <div className="panels__wide">
              <ArenaChartCard title="Latency percentiles">
                <ArenaLineChart
                  label="Latency percentiles over the last day"
                  labels={HOURS}
                  series={LATENCY}
                  valueSuffix="ms"
                  height={220}
                />
              </ArenaChartCard>
            </div>

            <ArenaChartCard title="Requests by region">
              <ArenaBarChart
                label="Requests by region and status class"
                labels={REGIONS}
                series={REQUESTS}
                stack
                height={220}
              />
            </ArenaChartCard>

            <ArenaChartCard title="Error budget spent">
              <ArenaDoughnutChart
                label="Share of the error budget spent per service"
                labels={BUDGET_LABELS}
                series={BUDGET}
                valueSuffix="%"
              />
            </ArenaChartCard>

            <ArenaChartCard title="Slowest endpoints">
              <ArenaHorizontalBarChart
                label="Slowest endpoints by p99"
                labels={ENDPOINTS}
                series={SLOWEST}
                valueSuffix="ms"
                height={220}
              />
            </ArenaChartCard>

            <ArenaChartCard title="Latency against throughput">
              <ArenaScatterChart
                label="Latency against throughput per edge node"
                series={THROUGHPUT}
                xLabel="Requests per second"
                yLabel="p99 latency in ms"
                height={220}
              />
            </ArenaChartCard>

            <ArenaChartCard title="Service health profile">
              <ArenaRadarChart
                label="Health profile of the two busiest services"
                labels={HEALTH_AXES}
                series={HEALTH}
                fill
                height={220}
              />
            </ArenaChartCard>

            <ArenaChartCard title="Gateway CPU">
              <ArenaGaugeChart label="Gateway CPU across all regions" value={72} valueSuffix="%" bands={CPU_BANDS} />
            </ArenaChartCard>

            <div className="panels__wide">
              <ArenaChartCard title="Latency distribution">
                <ArenaHeatmapChart
                  label="Requests per latency bucket over the last day"
                  labels={HOURS}
                  series={LATENCY_BUCKETS}
                  valueFormat={{ grouping: true }}
                />
              </ArenaChartCard>
            </div>

            <ArenaChartCard title="Queue consumers">
              <ArenaErrorState
                icon="ph-bold ph-plugs"
                title="Query failed"
                headingLevel="none"
                message="The metrics service did not answer within 30 seconds."
                code="ERR_UPSTREAM_504"
                retryLabel="Retry query"
              />
            </ArenaChartCard>

            <ArenaChartCard title="Cache hit ratio">
              <div className="panel-wait">
                <ArenaSpinner label="Loading the cache hit ratio" />
              </div>
            </ArenaChartCard>
          </div>

          <section className="alerts" aria-label="Active alerts" style={{ "--arena-column-for-align": "right" } as React.CSSProperties}>
            <h2 className="alerts__title">Active alerts</h2>
            <ArenaTable label="Active alerts" columns={COLUMNS}>
              {ALERTS.map((one) => (
                <ArenaTableRow key={one.id}>
                  <ArenaTableCell><ArenaTag tone={one.tone}>{one.state}</ArenaTag></ArenaTableCell>
                  <ArenaTableCell>{one.rule}</ArenaTableCell>
                  <ArenaTableCell>{one.service}</ArenaTableCell>
                  <ArenaTableCell>{one.since}</ArenaTableCell>
                  <ArenaTableCell>
                    <ArenaSparkline label={`${one.rule}, last 24 hours`} labels={HOURS} series={one.trend} valueSuffix={one.unit} />
                  </ArenaTableCell>
                </ArenaTableRow>
              ))}
            </ArenaTable>
          </section>
        </div>
        )}
      </ArenaMain>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<ArenaIconsProvider href={ARENA_SPRITE}><Vantage /></ArenaIconsProvider>);
