import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArenaIcon, ArenaIconButton, ArenaIconsProvider, ArenaOnboarding, initArenaTheme, useArenaTheme,
} from '@dravensoft/arena-react';

import { ARENA_SPRITE } from './arena.icons.generated.js';
import './arena.package.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { PathScreen } from './screens/PathScreen';
import { LessonScreen } from './screens/LessonScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { TOUR, TOUR_SEEN } from './data/Course';

initArenaTheme({
  palettes: [
    { name: 'light', polarity: 'light' },
    { name: 'dark', polarity: 'dark' },
  ],
  default: 'light',
});

type Screen = 'path' | 'lesson' | 'profile';

type Anchor = { left: number; bottom: number };

/* Storage can be absent or refuse, in a private window or a sandboxed frame; the tour then
   opens on every visit, which is the first run repeated rather than an error. */
function tourSeen(): boolean {
  try { return window.localStorage.getItem(TOUR_SEEN) === '1'; } catch { return false; }
}

function markTourSeen(): void {
  try { window.localStorage.setItem(TOUR_SEEN, '1'); } catch { /* the tour reopens next visit */ }
}

/* The coachmark positions from viewport coordinates, so the anchor is read from the target
   after it has been scrolled into view, and read again whenever the page scrolls or resizes. */
function anchorFor(target: string, reveal: boolean): Anchor | undefined {
  const element = document.querySelector(`[data-tour="${target}"]`);
  if (!element) return undefined;
  if (reveal) element.scrollIntoView({ block: 'center' });
  const { left, bottom } = element.getBoundingClientRect();
  return { left, bottom };
}

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
  const [touring, setTouring] = useState(() => screen === 'path' && !tourSeen());
  const [step, setStep] = useState(0);
  const [anchor, setAnchor] = useState<Anchor | undefined>();

  const showing = touring && screen === 'path';
  const target = TOUR[step]?.target;

  useLayoutEffect(() => {
    if (showing && target) setAnchor(anchorFor(target, true));
  }, [showing, target]);

  const measure = useCallback(() => {
    if (target) setAnchor(anchorFor(target, false));
  }, [target]);

  useEffect(() => {
    if (!showing) return undefined;
    window.addEventListener('scroll', measure);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [showing, measure]);

  const startTour = () => {
    setStep(0);
    setScreen('path');
    setTouring(true);
  };

  const endTour = () => {
    setTouring(false);
    markTourSeen();
  };

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
                data-tour={item.id === 'profile' ? 'profile' : undefined}
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
          <ArenaIconButton icon="ph-bold ph-question" label="Take the tour" onClick={startTour} />
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

      <ArenaOnboarding
        open={showing}
        steps={TOUR}
        index={step}
        anchor={anchor}
        onNext={() => setStep((s) => s + 1)}
        onBack={() => setStep((s) => s - 1)}
        onSkip={endTour}
        onDone={endTour}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<ArenaIconsProvider href={ARENA_SPRITE}><App /></ArenaIconsProvider>);
