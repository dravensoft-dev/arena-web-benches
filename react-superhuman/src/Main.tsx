import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArenaAvatar,
  ArenaButton,
  ArenaCommandPalette,
  ArenaFigure,
  ArenaIcon,
  ArenaIconButton,
  ArenaIconsProvider,
  ArenaInput,
  ArenaMain,
  ArenaSegmentedControl,
  ArenaSideNav,
  ArenaSideNavItem,
  ArenaSideNavSection,
  ArenaTag,
  initArenaTheme,
  useArenaTheme,
} from '@dravensoft/arena-react';

import { ARENA_SPRITE } from './arena.icons.generated.js';
import './arena.package.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { Cap, ThreadRow } from './Pieces';
import { COMMANDS, FOLDERS, TEAMS, THREADS, thread } from './data/Mail';

initArenaTheme({
  palettes: [
    { name: 'dark', polarity: 'dark' },
    { name: 'light', polarity: 'light' },
  ],
  default: 'dark',
});

const SPLITS = [
  { value: 'important', label: 'Important' },
  { value: 'other', label: 'Other' },
];

function Relay() {
  const [theme, setTheme] = useArenaTheme();
  const [folder, setFolder] = useState('inbox');
  const [split, setSplit] = useState('important');
  const [openId, setOpenId] = useState('contract');
  const [query, setQuery] = useState('');
  const [palette, setPalette] = useState(
    () => new URLSearchParams(window.location.search).get('palette') === 'open',
  );

  const shown = THREADS.filter((one) => one.split === split);
  const open = thread(openId);

  return (
    <div className="mail">
      <aside className="rail">
        <div className="rail__head">
          <span className="rail__glyph" aria-hidden="true"><ArenaIcon icon="ph-fill ph-paper-plane-tilt" /></span>
          <span className="rail__word">Relay</span>
          <span className="rail__gap" />
          <ArenaIconButton
            icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'}
            label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
            className="arena-size-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        </div>

        <div className="rail__compose">
          <ArenaButton icon="ph-bold ph-pencil-simple" className="arena-fill arena-size-sm">
            Compose
          </ArenaButton>
        </div>

        <ArenaSideNav ariaLabel="Mailboxes" active={folder} onNav={setFolder}>
          {FOLDERS.map((one) => (
            <ArenaSideNavItem key={one.id} id={one.id} label={one.label} icon={one.icon} badge={one.badge} />
          ))}
          <ArenaSideNavSection label="Channels">
            {TEAMS.map((one) => (
              <ArenaSideNavItem key={one.id} id={one.id} label={one.label} icon={one.icon} badge={one.badge} />
            ))}
          </ArenaSideNavSection>
        </ArenaSideNav>

        <div className="rail__foot">
          <span className="rail__hint">
            <Cap>Cmd</Cap>
            <Cap>K</Cap>
            <span className="rail__hint-text">for anything</span>
          </span>
        </div>
      </aside>

      <section className="list" aria-label="Conversations">
        <div className="list__head">
          <ArenaInput
            label="Search mail"
            icon="ph-bold ph-magnifying-glass"
            value={query}
            onChange={setQuery}
          />
          <ArenaSegmentedControl
            ariaLabel="Which half of the inbox"
            options={SPLITS}
            value={split}
            className="arena-size-sm"
            onChange={setSplit}
          />
        </div>
        <ul className="list__rows">
          {shown.map((one) => (
            <ThreadRow key={one.id} item={one} current={one.id === openId} onOpen={setOpenId} />
          ))}
        </ul>
      </section>

      <ArenaMain>
        <article className="read">
          <header className="read__head">
            <div className="read__title-row">
              <h1 className="read__subject">{open.subject}</h1>
              <span className="read__actions">
                <ArenaIconButton icon="ph-bold ph-archive" label="Archive" className="arena-size-sm" />
                <ArenaIconButton icon="ph-bold ph-clock-countdown" label="Snooze" className="arena-size-sm" />
                <ArenaIconButton icon="ph-bold ph-trash" label="Delete" className="arena-size-sm" />
                <ArenaIconButton icon="ph-bold ph-dots-three" label="More actions" className="arena-size-sm" />
              </span>
            </div>
            {open.labels.length ? (
              <span className="read__labels">
                {open.labels.map((label, index) => (
                  <ArenaTag key={label} colorId={((index % 8) + 1) as 1}>{label}</ArenaTag>
                ))}
              </span>
            ) : null}
          </header>

          <div className="read__from">
            <ArenaAvatar src={open.avatar} name={open.from} className="arena-size-sm" />
            <span className="read__who">
              <span className="read__name">{open.from}</span>
              <span className="read__to">{`to ${open.to}`}</span>
            </span>
            <span className="read__at arena-num">{open.at}</span>
          </div>

          <div className="read__body">
            {open.body.map((line) => <p key={line.slice(0, 24)}>{line}</p>)}
          </div>

          {open.attachments.length ? (
            <div className="read__files">
              {open.attachments.map((file) => (
                <figure key={file.name} className="file">
                  <ArenaFigure media={<img src={file.img} alt="" />} />
                  <figcaption className="file__meta">
                    <span className="file__name">{file.name}</span>
                    <span className="file__size arena-num">{file.size}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : null}

          <footer className="read__reply">
            <ArenaButton icon="ph-bold ph-arrow-bend-up-left" className="arena-size-sm arena-emphasis-secondary">Reply</ArenaButton>
            <ArenaButton icon="ph-bold ph-arrow-bend-double-up-right" className="arena-emphasis-secondary arena-size-sm">Forward</ArenaButton>
            <span className="read__reply-hint">
              <Cap>R</Cap>
              <span className="rail__hint-text">to reply</span>
            </span>
          </footer>
        </article>
      </ArenaMain>

      <ArenaCommandPalette
        open={palette}
        placeholder="Type a command"
        commands={COMMANDS}
        onClose={() => setPalette(false)}
        onRun={() => setPalette(false)}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<ArenaIconsProvider href={ARENA_SPRITE}><Relay /></ArenaIconsProvider>);
