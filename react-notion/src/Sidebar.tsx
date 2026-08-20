import React from 'react';
import {
  ArenaAvatar,
  ArenaIconButton,
  ArenaSideNav,
  ArenaSideNavCollapsible,
  ArenaSideNavItem,
  ArenaSideNavSection,
} from '@dravensoft/arena-react';

export type Screen = 'home' | 'doc' | 'database';

const SCREEN_OF: Record<string, Screen> = {
  home: 'home',
  wiki: 'doc',
  tasks: 'database',
};

export function Sidebar({
  screen,
  onScreen,
  onSearch,
}: {
  screen: Screen;
  onScreen: (next: Screen) => void;
  onSearch: () => void;
}) {
  const active = screen === 'home' ? 'home' : screen === 'doc' ? 'wiki' : 'tasks';

  return (
    <aside className="sidebar">
      <div className="sidebar__account">
        <ArenaAvatar name="Acme Platform" size="sm" shape="rounded" src="/img/brand-logo.svg" />
        <div className="sidebar__account-text">
          <span className="sidebar__workspace">Acme Platform</span>
          <span className="sidebar__plan">Team plan</span>
        </div>
        <ArenaIconButton icon="ph-bold ph-caret-up-down" label="Switch workspace" size="sm" />
      </div>

      <div className="sidebar__quick">
        <button type="button" className="quick" onClick={onSearch}>
          <i className="ph-bold ph-magnifying-glass quick__icon" aria-hidden="true" />
          <span>Search</span>
          <kbd className="quick__key arena-num">Ctrl K</kbd>
        </button>
        <button type="button" className="quick" onClick={() => onScreen('home')}>
          <i className="ph-bold ph-house quick__icon" aria-hidden="true" />
          <span>Home</span>
        </button>
        <button type="button" className="quick">
          <i className="ph-bold ph-tray quick__icon" aria-hidden="true" />
          <span>Inbox</span>
          <span className="quick__count arena-num">3</span>
        </button>
      </div>

      <div className="sidebar__tree">
        <ArenaSideNav
          ariaLabel="Workspace pages"
          active={active}
          onNav={(id) => {
            const next = SCREEN_OF[id];
            if (next) onScreen(next);
          }}
        >
          <ArenaSideNavSection label="Favourites">
            <ArenaSideNavItem id="wiki" label="Engineering wiki" icon="ph-bold ph-book-open-text" />
            <ArenaSideNavItem id="tasks" label="Sprint tasks" icon="ph-bold ph-kanban" />
          </ArenaSideNavSection>

          <ArenaSideNavSection label="Workspace">
            <ArenaSideNavCollapsible id="engineering" label="Engineering" icon="ph-bold ph-code" defaultExpanded>
              <ArenaSideNavItem id="wiki" label="Engineering wiki" icon="ph-bold ph-file-text" />
              <ArenaSideNavItem id="tasks" label="Sprint tasks" icon="ph-bold ph-file-text" />
              <ArenaSideNavItem id="oncall" label="On-call rota" icon="ph-bold ph-file-text" />
              <ArenaSideNavItem id="incident" label="July outage review" icon="ph-bold ph-file-text" />
            </ArenaSideNavCollapsible>

            <ArenaSideNavCollapsible id="product" label="Product" icon="ph-bold ph-compass">
              <ArenaSideNavItem id="roadmap" label="Q3 roadmap" icon="ph-bold ph-file-text" />
              <ArenaSideNavItem id="research" label="User research" icon="ph-bold ph-file-text" />
            </ArenaSideNavCollapsible>

            <ArenaSideNavCollapsible id="people" label="People" icon="ph-bold ph-users-three">
              <ArenaSideNavItem id="hiring" label="Hiring pipeline" icon="ph-bold ph-file-text" />
              <ArenaSideNavItem id="handbook" label="Handbook" icon="ph-bold ph-file-text" />
            </ArenaSideNavCollapsible>
          </ArenaSideNavSection>

          <ArenaSideNavSection label="Shared">
            <ArenaSideNavItem id="brand" label="Brand guidelines" icon="ph-bold ph-palette" />
            <ArenaSideNavItem id="trash" label="Trash" icon="ph-bold ph-trash" />
          </ArenaSideNavSection>
        </ArenaSideNav>
      </div>

      <div className="sidebar__foot">
        <button type="button" className="quick">
          <i className="ph-bold ph-plus quick__icon" aria-hidden="true" />
          <span>New page</span>
        </button>
      </div>
    </aside>
  );
}
