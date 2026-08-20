import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArenaAvatar,
  ArenaBreadcrumbs,
  ArenaButton,
  ArenaCommandPalette,
  ArenaIconButton,
  ArenaToast,
  ArenaToastHost,
  initArenaTheme,
  useArenaTheme,
  useArenaToasts,
} from '@dravensoft/arena-react';
import type { ArenaCommand } from '@dravensoft/arena-react';

import '@phosphor-icons/web/regular';
import './icons.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { Sidebar } from './Chrome';
import type { Screen } from './Chrome';
import { ListView } from './screens/ListView';
import { BoardView } from './screens/BoardView';
import { Dashboard } from './screens/Dashboard';
import { PEOPLE } from './data/Space';

initArenaTheme({
  palettes: [
    { name: 'light', polarity: 'light' },
    { name: 'dark', polarity: 'dark' },
  ],
  default: 'light',
});

const COMMANDS: ArenaCommand[] = [
  { id: 'list', label: 'Sprint 32 list', icon: 'ph-bold ph-list-checks', group: 'Views' },
  { id: 'board', label: 'Board', icon: 'ph-bold ph-kanban', group: 'Views' },
  { id: 'dashboard', label: 'Team dashboard', icon: 'ph-bold ph-chart-bar', group: 'Views' },
  { id: 'task', label: 'Create task', icon: 'ph-bold ph-plus', group: 'Create', shortcut: 'T' },
  { id: 'doc', label: 'Create doc', icon: 'ph-bold ph-file-text', group: 'Create' },
  { id: 'sprint', label: 'Start a sprint', icon: 'ph-bold ph-flag-banner', group: 'Create' },
  { id: 'theme', label: 'Switch appearance', icon: 'ph-bold ph-moon', group: 'Settings' },
];

const TABS: { id: Screen; label: string; icon: string }[] = [
  { id: 'list', label: 'List', icon: 'ph-bold ph-list-bullets' },
  { id: 'board', label: 'Board', icon: 'ph-bold ph-kanban' },
  { id: 'dashboard', label: 'Dashboard', icon: 'ph-bold ph-chart-bar' },
];

function App() {
  const asked = new URLSearchParams(window.location.search).get('screen');
  const [screen, setScreen] = useState<Screen>(
    asked === 'board' || asked === 'dashboard' ? asked : 'list',
  );
  const [palette, setPalette] = useState(false);
  const [theme, setTheme] = useArenaTheme();
  const { toasts, raise, dismiss } = useArenaToasts();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const run = (command: ArenaCommand) => {
    setPalette(false);
    if (command.id === 'theme') setTheme(theme === 'dark' ? 'light' : 'dark');
    if (command.id === 'list' || command.id === 'board' || command.id === 'dashboard') {
      setScreen(command.id as Screen);
    }
    if (command.id === 'task') raise({ title: 'Task created', tone: 'success' });
  };

  return (
    <div className="app">
      <Sidebar screen={screen} onScreen={setScreen} />

      <main className="main">
        <header className="bar">
          <ArenaBreadcrumbs
            ariaLabel="Location"
            items={[
              { label: 'Acme', href: '#/' },
              { label: 'Product', href: '#/product' },
              { label: 'Sprint 32' },
            ]}
          />
          <div className="bar__gap" />
          <ArenaButton variant="ghost" size="sm" icon="ph-bold ph-magnifying-glass" onClick={() => setPalette(true)}>
            Search
          </ArenaButton>
          <ArenaIconButton icon="ph-bold ph-bell" label="Notifications" size="sm" />
          <ArenaIconButton
            icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'}
            label="Switch appearance"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
          <ArenaAvatar name={PEOPLE.ada.name} src={PEOPLE.ada.image} size="sm" />
        </header>

        <div className="head">
          <div className="head__title">
            <span className="head__icon"><i className="ph-fill ph-rocket-launch" aria-hidden="true" /></span>
            <div>
              <h1 className="head__h1">Sprint 32</h1>
              <p className="head__sub">12 tasks &middot; 5 people &middot; ends in 11 days</p>
            </div>
          </div>
          <div className="head__gap" />
          <ArenaButton variant="ghost" size="sm" icon="ph-bold ph-share-network">Share</ArenaButton>
          <ArenaButton variant="ghost" size="sm" icon="ph-bold ph-robot">Automate</ArenaButton>
        </div>

        <nav className="views" aria-label="Views">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="views__tab"
              aria-current={screen === tab.id ? 'page' : undefined}
              onClick={() => setScreen(tab.id)}
            >
              <i className={`${tab.icon} views__icon`} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
          <span className="views__gap" />
          <ArenaIconButton icon="ph-bold ph-plus" label="Add a view" size="sm" />
        </nav>

        <div className="body">
          {screen === 'list' && <ListView />}
          {screen === 'board' && <BoardView />}
          {screen === 'dashboard' && <Dashboard />}
        </div>
      </main>

      <ArenaCommandPalette
        open={palette}
        commands={COMMANDS}
        placeholder="Search tasks, docs and actions"
        onClose={() => setPalette(false)}
        onRun={run}
      />

      <ArenaToastHost placement="bottom-end">
        {toasts.map((toast) => (
          <ArenaToast key={toast.id} tone={toast.tone} title={toast.title} onClose={() => dismiss(toast.id)} />
        ))}
      </ArenaToastHost>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
