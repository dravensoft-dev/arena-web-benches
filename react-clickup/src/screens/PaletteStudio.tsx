import React, { useEffect, useMemo, useState } from 'react';
import {
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
  ArenaMenu,
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
  ArenaTimeline,
  ArenaToast,
  ArenaTooltip,
  registerArenaPalette,
} from '@dravensoft/arena-react';
import type { ArenaAppliedFilter, ArenaCommand } from '@dravensoft/arena-react';
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
import type { Draft, Polarity, Slot } from '../data/Palette';
import type { ArenaRuntimePalette } from '@dravensoft/arena-react/palette';

const POLARITIES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const MENU = [
  { label: 'Edit widget', icon: 'ph-bold ph-pencil-simple' },
  { label: 'Duplicate', icon: 'ph-bold ph-copy' },
  { divider: true },
  { label: 'Remove', icon: 'ph-bold ph-trash', destructive: true },
];

const GROUPINGS = [
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'priority', label: 'Priority' },
];

const ASSIGNEES = Object.keys(PEOPLE).map((id) => ({ value: id, label: PEOPLE[id].name }));
const PRIORITIES = [
  { value: '', label: 'Any priority' },
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
];
const BULK = [
  { id: 'status', label: 'Set status', icon: 'ph-bold ph-circle-half' },
  { id: 'assign', label: 'Assign', icon: 'ph-bold ph-user-plus' },
  { id: 'delete', label: 'Delete', icon: 'ph-bold ph-trash', destructive: true },
];
const COMMANDS: ArenaCommand[] = [
  { id: 'list', label: 'Sprint 32 list', icon: 'ph-bold ph-list-checks', group: 'Views' },
  { id: 'board', label: 'Board', icon: 'ph-bold ph-kanban', group: 'Views' },
  { id: 'task', label: 'Create task', icon: 'ph-bold ph-plus', group: 'Create', shortcut: 'T' },
];

/* ---- the slot editor ---- */

function SlotEditor({
  slot, draft, evaluation, applied, onColour,
}: {
  slot: Slot;
  draft: Draft;
  evaluation: ReturnType<typeof evaluate>;
  applied: ReturnType<typeof evaluate>['palette'];
  onColour: (key: string, value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const given = draft.colors[slot.key];
  const shown = shownColour(slot, draft, applied);
  const messages = messagesOf(slot, draft, evaluation);
  const text = given ?? '';
  return (
    <div className="slot" data-slot={slot.key}>
      <ArenaPopover
        label={`Colour of ${slot.key}`}
        open={open}
        onOpenChange={setOpen}
        trigger={
          <ArenaButton className="arena-emphasis-ghost arena-size-sm arena-fill">
            <span className="slot__chip" style={{ background: shown }} aria-hidden="true" />
            <span className="slot__key">{slot.key}</span>
            <span className="slot__hex arena-num">{given === undefined ? 'derived' : given}</span>
          </ArenaButton>
        }
      >
        <div className="pick">
          <input
            className="pick__native"
            type="color"
            aria-label={`Pick ${slot.key}`}
            value={shown ?? '#000000'}
            onChange={(event) => onColour(slot.key, event.target.value)}
          />
          <ArenaInput
            label={`Value of ${slot.key}`}
            value={text}
            placeholder={shown ?? ''}
            onValueChange={(next) => onColour(slot.key, next)}
          />
          {slot.optional && (
            <ArenaButton className="arena-emphasis-secondary arena-size-sm" onActivate={() => onColour(slot.key, null)}>
              Derive it again
            </ArenaButton>
          )}
        </div>
      </ArenaPopover>
      {messages.length > 0 && (
        <ul className="slot__msgs" aria-label={`Messages for ${slot.key}`}>
          {messages.map((message, at) => <li key={at}>{message}</li>)}
        </ul>
      )}
    </div>
  );
}

/* ---- the grid ---- */

function Cell({ name, wide, children }: { name: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <section className="cell" data-wide={wide ? 'yes' : 'no'} aria-label={name}>
      <h3 className="cell__t">{name}</h3>
      <div className="cell__body">{children}</div>
    </section>
  );
}

function CardActions({ name }: { name: string }) {
  return (
    <ArenaMenu
      align="end"
      items={MENU}
      trigger={<ArenaIconButton icon="ph-bold ph-dots-three" label={`Actions for ${name}`} className="arena-size-sm" />}
    />
  );
}

function Grid() {
  const [grouping, setGrouping] = useState('status');
  const [checked, setChecked] = useState(true);
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('Urgent');
  const [assignees, setAssignees] = useState<readonly string[]>([]);
  const [palette, setPalette] = useState(false);
  const applied: ArenaAppliedFilter[] = [
    ...assignees.map((id) => ({ id, label: `Assignee: ${PEOPLE[id].name}` })),
    ...(priority === '' ? [] : [{ id: 'priority', label: `Priority: ${priority}` }]),
  ];

  return (
    <div className="grid">
      <Cell name="ArenaButton">
        <div className="cell__row">
          <ArenaButton icon="ph-bold ph-plus">Primary</ArenaButton>
          <ArenaButton className="arena-emphasis-secondary">Secondary</ArenaButton>
          <ArenaButton className="arena-emphasis-ghost">Ghost</ArenaButton>
          <ArenaButton className="arena-emphasis-secondary arena-size-sm">Small</ArenaButton>
        </div>
      </Cell>
      <Cell name="ArenaIconButton, ArenaIcon, ArenaTooltip">
        <div className="cell__row">
          <ArenaTooltip label="Notifications"><ArenaIconButton icon="ph-bold ph-bell" label="Notifications" /></ArenaTooltip>
          <ArenaIconButton icon="ph-bold ph-gear" label="Settings" className="arena-size-sm" />
          <span className="cell__icon"><ArenaIcon icon="ph-fill ph-rocket-launch" /></span>
        </div>
      </Cell>
      <Cell name="ArenaTag">
        <div className="cell__row">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => <ArenaTag key={slot} colorId={slot as 1}>{`Slot ${slot}`}</ArenaTag>)}
        </div>
      </Cell>
      <Cell name="ArenaAvatar">
        <div className="cell__row">
          <ArenaAvatar name={PEOPLE.ada.name} src={PEOPLE.ada.image} status="online" />
          <ArenaAvatar name={PEOPLE.ben.name} src={PEOPLE.ben.image} className="arena-size-sm" />
          <ArenaAvatar name={PEOPLE.cai.name} src={PEOPLE.cai.image} className="arena-size-xs" />
        </div>
      </Cell>
      <Cell name="ArenaCheckbox">
        <div className="cell__row">
          <ArenaCheckbox label="Select task" checked={checked} onValueChange={setChecked} />
          <ArenaCheckbox label="Not selected" checked={false} onValueChange={() => undefined} />
        </div>
      </Cell>
      <Cell name="ArenaInput">
        <ArenaInput label="Search tasks" icon="ph-bold ph-magnifying-glass" value={query} onValueChange={setQuery} />
      </Cell>
      <Cell name="ArenaSelect">
        <ArenaSelect label="Priority" options={PRIORITIES} value={priority} onValueChange={setPriority} />
      </Cell>
      <Cell name="ArenaMultiSelect">
        <ArenaMultiSelect
          label="Assignees"
          placeholder="Anyone"
          options={ASSIGNEES}
          value={assignees}
          maxVisible={2}
          onValueChange={(set) => setAssignees(set.values)}
        />
      </Cell>
      <Cell name="ArenaSegmentedControl">
        <ArenaSegmentedControl ariaLabel="Group tasks by" options={GROUPINGS} value={grouping} onValueChange={setGrouping} />
      </Cell>
      <Cell name="ArenaProgressBar">
        <div className="cell__stack">
          <ArenaProgressBar label="Onboarding" progressPercentage={64} />
          <ArenaProgressBar label="Search rewrite" progressPercentage={92} className="arena-size-sm" />
        </div>
      </Cell>
      <Cell name="ArenaMenu">
        <CardActions name="the widget" />
      </Cell>
      <Cell name="ArenaBreadcrumbs">
        <ArenaBreadcrumbs ariaLabel="Location" items={[{ label: 'Acme', href: '#/' }, { label: 'Product', href: '#/product' }, { label: 'Sprint 32' }]} />
      </Cell>
      <Cell name="ArenaAppLogo">
        <ArenaAppLogo name="ClickUp" mark={<img src="img/brand-mark.svg" alt="" className="side__mark" />} />
      </Cell>
      <Cell name="ArenaToast" wide>
        <div className="cell__stack">
          <ArenaToast tone="success" title="Task created" />
          <ArenaToast tone="danger" title="Pipeline failed" message="e2e tests in checkout" />
        </div>
      </Cell>
      <Cell name="ArenaCommandPalette">
        <ArenaButton className="arena-emphasis-secondary" icon="ph-bold ph-magnifying-glass" onActivate={() => setPalette(true)}>Open the palette</ArenaButton>
        <ArenaCommandPalette
          open={palette}
          commands={COMMANDS}
          placeholder="Search tasks, docs and actions"
          onClose={() => setPalette(false)}
          onRun={() => setPalette(false)}
        />
      </Cell>

      <Cell name="ArenaStatCard">
        <ArenaStatCard label="Velocity" value="19" sub="story points this week" icon="ph-bold ph-lightning" delta={{ value: '+27%', direction: 'up', tone: 'positive' }} />
      </Cell>
      <Cell name="ArenaStatCard (danger)">
        <ArenaStatCard label="Blocked" value="2" sub="tasks waiting" icon="ph-bold ph-prohibit" tone="danger" delta={{ value: '+1', direction: 'up', tone: 'negative' }} />
      </Cell>
      <Cell name="ArenaStatCard (warning)">
        <ArenaStatCard label="Scope added" value="13" sub="points after start" icon="ph-bold ph-plus-circle" tone="warning" delta={{ value: '+13', direction: 'up', tone: 'negative' }} />
      </Cell>
      <Cell name="ArenaCard">
        <ArenaCard title="Sprint 32" eyebrow="Schedule">Twelve tasks, five people, eleven days left.</ArenaCard>
      </Cell>

      <Cell name="ArenaFilterBar" wide>
        <ArenaFilterBar label="Task filters" applied={applied} onRemove={(filter) => (filter.id === 'priority' ? setPriority('') : setAssignees((prev) => prev.filter((id) => id !== filter.id)))} onClear={() => { setAssignees([]); setPriority(''); }}>
          <ArenaSelect label="Priority" options={PRIORITIES} value={priority} onValueChange={setPriority} />
        </ArenaFilterBar>
      </Cell>
      <Cell name="ArenaBulkActionBar" wide>
        <ArenaBulkActionBar count={3} noun="task" actions={BULK} clearable onClear={() => undefined} />
      </Cell>

      <Cell name="ArenaLineChart" wide>
        <ArenaChartCard title="Burndown" actions={<CardActions name="Burndown" />}>
          <ArenaLineChart label="Story points remaining against the ideal line" labels={BURNDOWN_LABELS} series={BURNDOWN} curve valueSuffix=" pts" />
        </ArenaChartCard>
      </Cell>
      <Cell name="ArenaDoughnutChart">
        <ArenaChartCard title="Tasks by status" actions={<CardActions name="Tasks by status" />}>
          <ArenaDoughnutChart label="How the sprint's tasks are split across statuses" labels={STATUS_SPLIT_LABELS} series={STATUS_SPLIT} />
        </ArenaChartCard>
      </Cell>
      <Cell name="ArenaBarChart">
        <ArenaChartCard title="Throughput" actions={<CardActions name="Throughput" />}>
          <ArenaBarChart label="Tasks shipped and reopened per week" labels={THROUGHPUT_LABELS} series={THROUGHPUT} />
        </ArenaChartCard>
      </Cell>
      <Cell name="ArenaHorizontalBarChart">
        <ArenaChartCard title="Workload" actions={<CardActions name="Workload" />}>
          <ArenaHorizontalBarChart label="Story points assigned per person" labels={WORKLOAD_LABELS} series={WORKLOAD} valueSuffix=" pts" />
        </ArenaChartCard>
      </Cell>
      <Cell name="ArenaFunnelChart">
        <ArenaChartCard title="Status funnel" actions={<CardActions name="Status funnel" />}>
          <ArenaFunnelChart label="Tasks this sprint reaching each status" labels={FUNNEL_LABELS} series={FUNNEL} valueSuffix=" tasks" />
        </ArenaChartCard>
      </Cell>
      <Cell name="ArenaPyramidChart">
        <ArenaChartCard title="Opened and closed" actions={<CardActions name="Opened and closed" />}>
          <ArenaPyramidChart label="Tasks opened and closed this sprint by priority" labels={OPEN_CLOSE_LABELS} series={OPEN_CLOSE} />
        </ArenaChartCard>
      </Cell>
      <Cell name="ArenaTimeline">
        <ArenaTimeline label="Sprint 32" items={MILESTONES} index={MILESTONE_NOW} />
      </Cell>
      <Cell name="ArenaActivityFeed">
        <ArenaActivityFeed items={ACTIVITY} label="Recent activity in this space" />
      </Cell>

      <Cell name="ArenaBoard, ArenaBoardColumn" wide>
        <ArenaBoard label="Sprint 32 tasks by status">
          <ArenaBoardColumn title="To do" count={2} summary="11 pts" colorId={7}
            action={<ArenaIconButton icon="ph-bold ph-plus" label="Add a task to To do" className="arena-size-sm" />}>
            <p className="cell__note">Audit the notification preferences screen</p>
          </ArenaBoardColumn>
          <ArenaBoardColumn title="In progress" count={1} summary="8 pts" colorId={1}
            action={<ArenaIconButton icon="ph-bold ph-plus" label="Add a task to In progress" className="arena-size-sm" />}>
            <p className="cell__note">Rebuild the onboarding checklist</p>
          </ArenaBoardColumn>
          <ArenaBoardColumn title="Complete" count={1} summary="5 pts" colorId={5}
            action={<ArenaIconButton icon="ph-bold ph-plus" label="Add a task to Complete" className="arena-size-sm" />}>
            <p className="cell__note">Retire the legacy webhook worker</p>
          </ArenaBoardColumn>
        </ArenaBoard>
      </Cell>
      <Cell name="ArenaSideNav, ArenaSideNavSection, ArenaSideNavCollapsible, ArenaSideNavItem">
        <ArenaSideNav ariaLabel="Spaces" active="board" onNav={() => undefined}>
          <ArenaSideNavSection label="Spaces">
            <ArenaSideNavCollapsible id="product" label="Product" icon="ph-bold ph-rocket-launch" defaultExpanded>
              <ArenaSideNavItem id="list" label="Sprint 32" icon="ph-bold ph-list-bullets" />
              <ArenaSideNavItem id="board" label="Board" icon="ph-bold ph-kanban" />
              <ArenaSideNavItem id="backlog" label="Backlog" icon="ph-bold ph-stack" badge={41} />
            </ArenaSideNavCollapsible>
          </ArenaSideNavSection>
        </ArenaSideNav>
      </Cell>
    </div>
  );
}

/* ---- the screen ---- */

export function PaletteStudio() {
  const [draft, setDraft] = useState<Draft>(() => draftFrom('light'));
  const evaluation = useMemo(() => evaluate(draft), [draft]);
  const [applied, setApplied] = useState<ArenaRuntimePalette | null>(null);

  /* Arena built a palette: register it, and the scope below paints it. A refused draft leaves the last one painted. */
  useEffect(() => {
    if (evaluation.palette === null) return;
    registerArenaPalette(evaluation.palette);
    setApplied(evaluation.palette);
  }, [evaluation]);

  const setColour = (key: string, value: string | null) =>
    setDraft((prev) => {
      const colors = { ...prev.colors };
      if (value === null) delete colors[key];
      else colors[key] = value;
      return { ...prev, colors };
    });

  const messages = [...evaluation.errors, ...evaluation.reports.map((report) => report.message)];
  const tone = evaluation.errors.length > 0 ? 'danger' : evaluation.reports.length > 0 ? 'warning' : 'success';

  return (
    <div className="studio">
      <aside className="studio__side" aria-label="Palette">
        <div className="studio__head">
          <h2 className="studio__h">Palette</h2>
          <span className="studio__sub">Runtime palette, checked by Arena</span>
        </div>

        <div className="studio__form">
          <ArenaInput label="Palette name" value={draft.name} onValueChange={(name) => setDraft((prev) => ({ ...prev, name }))} />
          <ArenaSegmentedControl
            ariaLabel="Polarity"
            options={POLARITIES}
            value={draft.polarity}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, polarity: value as Polarity }))}
            className="arena-size-sm"
          />
          <div className="studio__row">
            {DECLARED_NAMES.map((name) => (
              <ArenaButton key={name} className="arena-emphasis-secondary arena-size-sm" onActivate={() => setDraft(draftFrom(name))}>
                {`Start from ${name}`}
              </ArenaButton>
            ))}
          </div>
        </div>

        <div className="studio__summary" aria-live="polite" data-tone={tone}>
          <ArenaAlert
            tone={tone}
            title={
              evaluation.errors.length > 0
                ? 'Arena refused this palette'
                : evaluation.reports.length > 0
                  ? `${evaluation.reports.length} report${evaluation.reports.length === 1 ? '' : 's'} from Arena`
                  : 'Arena reports nothing'
            }
          >
            {messages.length === 0
              ? 'The build would have said nothing about this palette.'
              : (
                <ul className="studio__list">
                  {messages.map((message, at) => <li key={at}>{message}</li>)}
                </ul>
              )}
            {evaluation.errors.length > 0 && applied !== null && (
              <p className="studio__kept">{`The page keeps painting ${applied.name} as it was last accepted.`}</p>
            )}
          </ArenaAlert>
        </div>

        {SLOT_GROUPS.map((group) => (
          <section key={group.id} className="studio__group" aria-label={group.title}>
            <h3 className="studio__gt">{group.title}</h3>
            {group.slots.map((slot) => (
              <SlotEditor key={slot.key} slot={slot} draft={draft} evaluation={evaluation} applied={applied} onColour={setColour} />
            ))}
          </section>
        ))}
      </aside>

      <div className="studio__stage">
        {applied !== null && (
          <ArenaPaletteScope palette={applied.name}>
            <Grid />
          </ArenaPaletteScope>
        )}
      </div>
    </div>
  );
}
