import React from 'react';
import {
  ArenaAppLogo,
  ArenaAvatar,
  ArenaIconButton,
  ArenaSideNav,
  ArenaSideNavCollapsible,
  ArenaSideNavItem,
  ArenaSideNavSection,
  ArenaTag,
  ArenaTooltip,
  arenaCatColor,
} from '@dravensoft/arena-react';
import { PEOPLE, PRIORITY_SLOT, STATUS_SLOT } from './data/Space';
import type { Priority, Status } from './data/Space';

export type Screen = 'list' | 'board' | 'dashboard';

export function StatusDot({ status }: { status: Status }) {
  return <span className="dot" style={{ background: arenaCatColor(STATUS_SLOT[status]) }} />;
}

export function StatusPill({ status }: { status: Status }) {
  return <ArenaTag colorId={STATUS_SLOT[status]}>{status}</ArenaTag>;
}

export function PriorityFlag({ priority }: { priority: Priority }) {
  return (
    <ArenaTooltip label={`${priority} priority`}>
      <i
        className="ph-fill ph-flag flag"
        style={{ color: arenaCatColor(PRIORITY_SLOT[priority]) }}
        aria-hidden="true"
      />
    </ArenaTooltip>
  );
}

/* Arena ships no avatar group, so the bench draws the overlap and the overflow count. */
export function Assignees({ ids }: { ids: readonly string[] }) {
  const shown = ids.slice(0, 3);
  const rest = ids.length - shown.length;
  return (
    <span className="stack" aria-label={ids.map((id) => PEOPLE[id].name).join(', ')}>
      {shown.map((id) => (
        <span key={id} className="stack__slot">
          <ArenaAvatar name={PEOPLE[id].name} src={PEOPLE[id].image} className="arena-size-xs" />
        </span>
      ))}
      {rest > 0 && <span className="stack__more arena-num">+{rest}</span>}
    </span>
  );
}

export function Tags({ tags }: { tags: readonly string[]; }) {
  return (
    <span className="tags">
      {tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
    </span>
  );
}

const SCREEN_OF: Record<string, Screen> = {
  list: 'list', board: 'board', dashboard: 'dashboard',
};

export function Sidebar({ screen, onScreen }: { screen: Screen; onScreen: (next: Screen) => void }) {
  return (
    <aside className="side">
      <div className="side__brand">
        <ArenaAppLogo
          className="arena-size-sm"
          name="ClickUp"
          mark={<img src="img/brand-mark.svg" alt="" className="side__mark" />}
        />
        <span className="side__brand-gap" />
        <ArenaIconButton icon="ph-bold ph-caret-up-down" label="Switch workspace" className="arena-size-sm" />
      </div>

      <div className="side__quick">
        <button type="button" className="q"><i className="ph-bold ph-house q__i" aria-hidden="true" />Home</button>
        <button type="button" className="q"><i className="ph-bold ph-tray q__i" aria-hidden="true" />Inbox<span className="q__n arena-num">7</span></button>
        <button type="button" className="q"><i className="ph-bold ph-magnifying-glass q__i" aria-hidden="true" />Search<kbd className="q__k arena-num">Ctrl K</kbd></button>
        <button type="button" className="q"><i className="ph-bold ph-clock-counter-clockwise q__i" aria-hidden="true" />Recents</button>
      </div>

      <div className="side__tree">
        <ArenaSideNav ariaLabel="Spaces" active={screen} onNav={(id) => SCREEN_OF[id] && onScreen(SCREEN_OF[id])}>
          <ArenaSideNavSection label="Favourites">
            <ArenaSideNavItem id="list" label="Sprint 32" icon="ph-bold ph-list-checks" />
            <ArenaSideNavItem id="dashboard" label="Team dashboard" icon="ph-bold ph-chart-line-up" />
          </ArenaSideNavSection>

          <ArenaSideNavSection label="Spaces">
            <ArenaSideNavCollapsible id="product" label="Product" icon="ph-bold ph-rocket-launch" defaultExpanded>
              <ArenaSideNavItem id="list" label="Sprint 32" icon="ph-bold ph-list-bullets" />
              <ArenaSideNavItem id="board" label="Board" icon="ph-bold ph-kanban" />
              <ArenaSideNavItem id="dashboard" label="Dashboard" icon="ph-bold ph-chart-bar" />
              <ArenaSideNavItem id="backlog" label="Backlog" icon="ph-bold ph-stack" badge={41} />
            </ArenaSideNavCollapsible>

            <ArenaSideNavCollapsible id="growth" label="Growth" icon="ph-bold ph-trend-up">
              <ArenaSideNavItem id="experiments" label="Experiments" icon="ph-bold ph-flask" />
              <ArenaSideNavItem id="funnel" label="Funnel" icon="ph-bold ph-funnel" />
            </ArenaSideNavCollapsible>

            <ArenaSideNavCollapsible id="ops" label="Operations" icon="ph-bold ph-gear-six">
              <ArenaSideNavItem id="oncall" label="On-call" icon="ph-bold ph-phone-call" />
              <ArenaSideNavItem id="vendors" label="Vendors" icon="ph-bold ph-buildings" />
            </ArenaSideNavCollapsible>
          </ArenaSideNavSection>

          <ArenaSideNavSection label="More">
            <ArenaSideNavItem id="docs" label="Docs" icon="ph-bold ph-file-text" />
            <ArenaSideNavItem id="goals" label="Goals" icon="ph-bold ph-target" />
            <ArenaSideNavItem id="trash" label="Trash" icon="ph-bold ph-trash" />
          </ArenaSideNavSection>
        </ArenaSideNav>
      </div>

      <div className="side__foot">
        <ArenaAvatar name={PEOPLE.ada.name} src={PEOPLE.ada.image} className="arena-size-sm" status="online" />
        <span className="side__me">
          <span className="side__me-name">Ada Okonjo</span>
          <span className="side__me-role">Workspace owner</span>
        </span>
        <ArenaIconButton icon="ph-bold ph-gear" label="Settings" className="arena-size-sm" />
      </div>
    </aside>
  );
}
