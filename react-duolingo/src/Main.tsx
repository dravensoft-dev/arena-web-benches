import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArenaIcon, ArenaIconButton, ArenaIconsProvider, initArenaTheme, useArenaTheme } from '@dravensoft/arena-react';

import { ARENA_SPRITE } from './arena.icons.generated.js';
import './arena.package.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { PathScreen } from './screens/PathScreen';
import { LessonScreen } from './screens/LessonScreen';
import { ProfileScreen } from './screens/ProfileScreen';

initArenaTheme({
  palettes: [
    { name: 'light', polarity: 'light' },
    { name: 'dark', polarity: 'dark' },
  ],
  default: 'light',
});

type Screen = 'path' | 'lesson' | 'profile';

const NAV: { id: Screen | string; label: string; icon: string; slot: number }[] = [
  { id: 'path', label: 'Learn', icon: 'ph-fill ph-house', slot: 1 },
  { id: 'letters', label: 'Letters', icon: 'ph-fill ph-text-aa', slot: 2 },
  { id: 'league', label: 'Leaderboards', icon: 'ph-fill ph-shield-star', slot: 4 },
  { id: 'quests', label: 'Quests', icon: 'ph-fill ph-scroll', slot: 6 },
  { id: 'shop', label: 'Shop', icon: 'ph-fill ph-storefront', slot: 5 },
  { id: 'profile', label: 'Profile', icon: 'ph-fill ph-user', slot: 3 },
];

function App() {
  const asked = new URLSearchParams(window.location.search).get('screen');
  const [screen, setScreen] = useState<Screen>(
    asked === 'lesson' || asked === 'profile' ? (asked as Screen) : 'path',
  );
  const [theme, setTheme] = useArenaTheme();

  if (screen === 'lesson') {
    return <LessonScreen onQuit={() => setScreen('path')} />;
  }

  return (
    <div className="app">
      <nav className="nav" aria-label="Primary">
        <a className="nav__brand" href="#/">
          <img src="img/brand-word.svg" alt="Duolingo" className="nav__word" />
        </a>

        <ul className="nav__list">
          {NAV.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="nav__item"
                aria-current={screen === item.id ? 'page' : undefined}
                onClick={() => {
                  if (item.id === 'path' || item.id === 'profile') setScreen(item.id as Screen);
                }}
              >
                <span className="nav__icon" aria-hidden="true" data-slot={item.slot}><ArenaIcon icon={item.icon} /></span>
                <span className="nav__label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="nav__foot">
          <ArenaIconButton
            icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'}
            label="Switch appearance"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        </div>
      </nav>

      <main className="main">
        {screen === 'path' && <PathScreen onStart={() => setScreen('lesson')} />}
        {screen === 'profile' && <ProfileScreen />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<ArenaIconsProvider href={ARENA_SPRITE}><App /></ArenaIconsProvider>);
