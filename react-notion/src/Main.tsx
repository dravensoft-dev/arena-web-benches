import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArenaCommandPalette,
  ArenaIconButton,
  initArenaTheme,
  useArenaTheme,
} from '@dravensoft/arena-react';
import type { ArenaCommand } from '@dravensoft/arena-react';

import '@phosphor-icons/web/regular';
import './icons.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { Sidebar } from './Sidebar';
import type { Screen } from './Sidebar';
import { DocPage } from './screens/DocPage';
import { DatabaseView } from './screens/DatabaseView';
import { Home } from './screens/Home';

initArenaTheme({
  palettes: [
    { name: 'light', polarity: 'light' },
    { name: 'dark', polarity: 'dark' },
  ],
  default: 'light',
});

const COMMANDS: ArenaCommand[] = [
  { id: 'home', label: 'Home', icon: 'ph-bold ph-house', group: 'Jump to' },
  { id: 'wiki', label: 'Engineering wiki', icon: 'ph-bold ph-book-open-text', group: 'Jump to', hint: 'onboarding setup' },
  { id: 'tasks', label: 'Sprint tasks', icon: 'ph-bold ph-kanban', group: 'Jump to', hint: 'board database' },
  { id: 'new-page', label: 'Create a new page', icon: 'ph-bold ph-plus', group: 'Actions', shortcut: 'Ctrl N' },
  { id: 'new-db', label: 'Create a new database', icon: 'ph-bold ph-table', group: 'Actions' },
  { id: 'import', label: 'Import from Markdown', icon: 'ph-bold ph-download-simple', group: 'Actions' },
  { id: 'trash', label: 'Open trash', icon: 'ph-bold ph-trash', group: 'Actions' },
  { id: 'theme', label: 'Switch appearance', icon: 'ph-bold ph-moon', group: 'Settings' },
];

function App() {
  const asked = new URLSearchParams(window.location.search).get('screen');
  const [screen, setScreen] = useState<Screen>(
    asked === 'home' || asked === 'database' ? asked : 'doc',
  );
  const [palette, setPalette] = useState(false);
  const [theme, setTheme] = useArenaTheme();

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
    if (command.id === 'home') setScreen('home');
    if (command.id === 'wiki') setScreen('doc');
    if (command.id === 'tasks') setScreen('database');
  };

  return (
    <div className="app">
      <Sidebar screen={screen} onScreen={setScreen} onSearch={() => setPalette(true)} />

      <main className="main">
        {screen === 'home' && <Home onScreen={setScreen} onSearch={() => setPalette(true)} />}
        {screen === 'doc' && <DocPage />}
        {screen === 'database' && <DatabaseView />}
      </main>

      <div className="theme-toggle">
        <ArenaIconButton
          icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'}
          label="Switch appearance"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
      </div>

      <ArenaCommandPalette
        open={palette}
        commands={COMMANDS}
        placeholder="Search pages and actions"
        onClose={() => setPalette(false)}
        onRun={run}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
