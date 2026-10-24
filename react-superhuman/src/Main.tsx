import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArenaAvatar,
  ArenaButton,
  ArenaCommandPalette,
  ArenaEmptyState,
  ArenaFigure,
  ArenaIcon,
  ArenaIconButton,
  ArenaIconsProvider,
  ArenaInput,
  ArenaKbd,
  ArenaMain,
  ArenaPopover,
  ArenaRadio,
  ArenaRadioGroup,
  ArenaSegmentedControl,
  ArenaSideNav,
  ArenaSideNavItem,
  ArenaSideNavSection,
  ArenaSplitButton,
  ArenaTag,
  ArenaTextarea,
  initArenaTheme,
  useArenaTheme,
} from '@dravensoft/arena-react';
import type { ArenaMenuItem } from '@dravensoft/arena-react';

import { ARENA_SPRITE } from './arena.icons.generated.js';
import './arena.package.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { ThreadRow } from './Pieces';
import { COMMANDS, FOLDERS, SENDS, SNOOZES, TEAMS, THREADS, thread } from './data/Mail';

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
  const [done, setDone] = useState<string[]>([]);
  const [snoozing, setSnoozing] = useState(false);
  const [until, setUntil] = useState('tomorrow');
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState('');
  const [palette, setPalette] = useState(
    () => new URLSearchParams(window.location.search).get('palette') === 'open',
  );

  const shown = THREADS.filter((one) => one.split === split && !done.includes(one.id));
  const open = thread(openId);
  const zero = `Every conversation in ${SPLITS.find((one) => one.value === split)?.label} is handled. A snoozed one comes back to the top when its time comes.`;

  /* Archiving or snoozing takes the conversation out of the list and opens the next one. */
  const settle = (id: string) => {
    const next = shown.find((one) => one.id !== id);
    setDone([...done, id]);
    if (next) setOpenId(next.id);
    discard();
  };

  const discard = () => {
    setReplying(false);
    setDraft('');
  };

  const sendWith = (item: ArenaMenuItem) => {
    if (item.label === 'Send and archive') settle(open.id);
    else discard();
  };

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
            onActivate={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
            <ArenaKbd keys={['Cmd', 'K']} />
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
            onValueChange={setQuery}
          />
          <ArenaSegmentedControl
            ariaLabel="Which half of the inbox"
            options={SPLITS}
            value={split}
            className="arena-size-sm"
            onValueChange={setSplit}
          />
        </div>
        <ul className="list__rows">
          {shown.map((one) => (
            <ThreadRow key={one.id} item={one} current={one.id === openId} onOpen={setOpenId} />
          ))}
        </ul>
      </section>

      <ArenaMain>
        {shown.length ? (
          <article className="read">
            <header className="read__head">
              <div className="read__title-row">
                <h1 className="read__subject">{open.subject}</h1>
                <span className="read__actions">
                  <ArenaIconButton icon="ph-bold ph-archive" label="Archive" className="arena-size-sm" onActivate={() => settle(open.id)} />
                  <ArenaPopover
                    label="Remind me"
                    open={snoozing}
                    align="end"
                    onOpenChange={setSnoozing}
                    trigger={<ArenaIconButton icon="ph-bold ph-clock-countdown" label="Snooze" className="arena-size-sm" />}
                  >
                    <div className="snooze">
                      <ArenaRadioGroup ariaLabel="When it comes back" value={until} onValueChange={setUntil}>
                        {SNOOZES.map((one) => (
                          <ArenaRadio key={one.value} value={one.value} label={one.label} hint={one.hint} />
                        ))}
                      </ArenaRadioGroup>
                      <div className="snooze__foot">
                        <span className="snooze__hint">
                          <ArenaKbd keys={['H']} />
                          <span className="rail__hint-text">from anywhere</span>
                        </span>
                        <ArenaButton
                          icon="ph-bold ph-clock-countdown"
                          className="arena-emphasis-secondary arena-size-sm"
                          onActivate={() => { settle(open.id); setSnoozing(false); }}
                        >
                          Snooze
                        </ArenaButton>
                      </div>
                    </div>
                  </ArenaPopover>
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

            {replying ? (
              <section className="compose" aria-label="Reply">
                <ArenaTextarea label={`Reply to ${open.from}`} value={draft} rows={4} onValueChange={setDraft} />
                <div className="compose__foot">
                  <ArenaSplitButton
                    label="Send"
                    menuLabel="More ways to send"
                    icon="ph-bold ph-paper-plane-tilt"
                    items={SENDS}
                    className="arena-emphasis-secondary arena-size-sm"
                    onActivate={discard}
                    onSelect={sendWith}
                  >
                    Send
                  </ArenaSplitButton>
                  <ArenaButton className="arena-emphasis-ghost arena-size-sm" onActivate={discard}>
                    Discard
                  </ArenaButton>
                  <span className="read__reply-hint">
                    <ArenaKbd keys={['Cmd', 'Enter']} />
                    <span className="rail__hint-text">to send</span>
                  </span>
                </div>
              </section>
            ) : (
              <footer className="read__reply">
                <ArenaButton icon="ph-bold ph-arrow-bend-up-left" className="arena-size-sm arena-emphasis-secondary" onActivate={() => setReplying(true)}>Reply</ArenaButton>
                <ArenaButton icon="ph-bold ph-arrow-bend-double-up-right" className="arena-emphasis-secondary arena-size-sm">Forward</ArenaButton>
                <span className="read__reply-hint">
                  <ArenaKbd keys={['R']} />
                  <span className="rail__hint-text">to reply</span>
                </span>
              </footer>
            )}
          </article>
        ) : (
          <div className="zero">
            <ArenaEmptyState
              icon="ph-bold ph-check-circle"
              title="Inbox zero"
              headingLevel="h1"
              message={zero}
              action={(
                <ArenaButton icon="ph-bold ph-arrow-counter-clockwise" className="arena-emphasis-secondary arena-size-sm" onActivate={() => setDone([])}>
                  Bring them back
                </ArenaButton>
              )}
            />
          </div>
        )}
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
