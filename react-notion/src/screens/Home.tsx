import React from 'react';
import { ArenaAvatar, ArenaButton, ArenaCard, ArenaGrid, ArenaIconButton } from '@dravensoft/arena-react';
import { RECENT, TEMPLATES } from '../data/Workspace';
import type { Screen } from '../Sidebar';

export function Home({ onScreen, onSearch }: { onScreen: (next: Screen) => void; onSearch: () => void }) {
  return (
    <div className="doc">
      <header className="topbar">
        <span className="topbar__title">Home</span>
        <div className="topbar__actions">
          <ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-magnifying-glass" onClick={onSearch}>
            Search
          </ArenaButton>
          <ArenaIconButton icon="ph-bold ph-gear" label="Settings" className="arena-size-sm" />
        </div>
      </header>

      <div className="doc__scroll">
        <div className="home">
          <div className="home__greeting">
            <ArenaAvatar name="Marta Ilves" src="img/p1.jpg" className="arena-size-lg" />
            <div>
              <h1 className="home__hello">Good afternoon, Marta</h1>
              <p className="home__sub">Six pages changed in your workspace since you were last here.</p>
            </div>
          </div>

          <section className="home__section">
            <h2 className="home__section-title">
              <i className="ph-bold ph-clock-counter-clockwise" aria-hidden="true" />
              Recently visited
            </h2>
            <div className="home__rail">
              {RECENT.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  className="recent"
                  onClick={() => onScreen(page.id === 'tasks' ? 'database' : 'doc')}
                >
                  <span className="recent__cover" />
                  <span className="recent__icon"><i className={page.icon} aria-hidden="true" /></span>
                  <span className="recent__title">{page.title}</span>
                  <span className="recent__meta">{page.where}</span>
                  <span className="recent__meta recent__meta--dim">{page.when}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="home__section" style={{ '--arena-grid-min': 'calc(var(--sp-1) * 60)' } as React.CSSProperties}>
            <h2 className="home__section-title">
              <i className="ph-bold ph-cards-three" aria-hidden="true" />
              Start with a template
            </h2>
            <ArenaGrid>
              {TEMPLATES.map((template) => (
                <ArenaCard key={template.id} title={template.title} interactive onClick={() => onScreen('doc')}>
                  <p className="template__blurb">
                    <i className={`${template.icon} template__icon`} aria-hidden="true" />
                    {template.blurb}
                  </p>
                </ArenaCard>
              ))}
            </ArenaGrid>
          </section>
        </div>
      </div>
    </div>
  );
}
