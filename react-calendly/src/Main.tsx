import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArenaAvatar,
  ArenaButton,
  ArenaCheckbox,
  ArenaIcon,
  ArenaIconButton,
  ArenaIconsProvider,
  ArenaInput,
  ArenaKeyValue,
  ArenaMain,
  ArenaRadio,
  ArenaRadioGroup,
  ArenaSelect,
  ArenaStepper,
  ArenaTextarea,
  initArenaTheme,
  useArenaTheme,
} from '@dravensoft/arena-react';

import { ARENA_SPRITE } from './arena.icons.generated.js';
import './arena.package.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { DAYS, EVENT, GUESTS, HOST, MONTH, SLOTS, WEEKDAYS, ZONES } from './data/Booking';
import { BOOKING_STEPS } from './data/Schedule';
import { Schedule } from './Schedule';

initArenaTheme({
  palettes: [
    { name: 'light', polarity: 'light' },
    { name: 'dark', polarity: 'dark' },
  ],
  default: 'light',
});

const ASKED = new URLSearchParams(window.location.search);

function Openings() {
  const [theme, setTheme] = useArenaTheme();
  const [view, setView] = useState(ASKED.get('view') === 'host' ? 'host' : 'booking');
  const [day, setDay] = useState(17);
  const [slot, setSlot] = useState<string | null>(
    () => (ASKED.get('step') === 'details' || ASKED.get('step') === 'done' ? '14:00' : null),
  );
  const [booked, setBooked] = useState(ASKED.get('step') === 'done');
  const [zone, setZone] = useState('lisbon');
  const [guests, setGuests] = useState('none');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [remind, setRemind] = useState(true);
  const step = slot ? (booked ? 'done' : 'details') : 'when';
  const at = step === 'when' ? 0 : step === 'details' ? 1 : 2;

  return (
    <div className="page">
      <div className="page__bar">
        <ArenaButton
          icon={view === 'host' ? 'ph-bold ph-arrow-left' : 'ph-bold ph-calendar-blank'}
          className="arena-emphasis-ghost arena-size-sm"
          onClick={() => setView(view === 'host' ? 'booking' : 'host')}
        >
          {view === 'host' ? 'Back to the booking page' : 'Your schedule'}
        </ArenaButton>
        <ArenaIconButton
          icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'}
          label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
          className="arena-size-sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
      </div>

      {view === 'host' ? (
        <Schedule />
      ) : (
        <ArenaMain>
          <div className="card">
            <aside className="who">
              <ArenaAvatar src={HOST.avatar} name={HOST.name} className="arena-size-lg" />
              <p className="who__name">{HOST.name}</p>
              <h1 className="who__title">{EVENT.title}</h1>
              <ArenaKeyValue
                rows={[
                  { term: 'Length', value: EVENT.duration },
                  { term: 'Where', value: 'Web conference' },
                  { term: 'When', value: `Thu 17 September, ${slot ?? 'pick a time'}` },
                ]}
              />
              <p className="who__blurb">{EVENT.blurb}</p>
            </aside>

            <div className="flow">
              <div className="flow__steps">
                <ArenaStepper
                  ariaLabel="Booking"
                  steps={BOOKING_STEPS}
                  index={at}
                  interactive
                  onChange={(index) => {
                    if (index === 0) setSlot(null);
                    setBooked(false);
                  }}
                />
              </div>

              {step === 'when' ? (
                <section className="when" aria-label="Pick a date and a time">
                  <h2 className="when__title">Select a date and time</h2>
                  <div className="when__cols">
                    <div className="cal">
                      <div className="cal__head">
                        <span className="cal__month">{MONTH}</span>
                        <span className="cal__nav">
                          <ArenaIconButton icon="ph-bold ph-caret-left" label="Previous month" className="arena-size-sm" />
                          <ArenaIconButton icon="ph-bold ph-caret-right" label="Next month" className="arena-size-sm" />
                        </span>
                      </div>
                      <div className="cal__grid" role="grid" aria-label={MONTH}>
                        {WEEKDAYS.map((one) => (
                          <span key={one} className="cal__weekday" role="columnheader">{one}</span>
                        ))}
                        {DAYS.map((one, index) => (
                          <button
                            key={`${one.n}-${index}`}
                            type="button"
                            className="cal__day"
                            role="gridcell"
                            data-open={one.open}
                            data-muted={one.muted ? 'yes' : 'no'}
                            aria-pressed={one.open && one.n === day}
                            disabled={!one.open}
                            onClick={() => setDay(one.n)}
                          >
                            <span className="arena-num">{one.n}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="slots">
                      <p className="slots__day">Thursday 17 September</p>
                      <div className="slots__grid">
                        {SLOTS.map((one) => (
                          <ArenaButton key={one} className="arena-emphasis-secondary arena-fill" onClick={() => setSlot(one)}>
                            {one}
                          </ArenaButton>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="when__zone">
                    <ArenaSelect
                      label="Time zone"
                      icon="ph-bold ph-globe"
                      options={ZONES}
                      value={zone}
                      onChange={setZone}
                    />
                  </div>
                </section>
              ) : step === 'details' ? (
                <section className="form" aria-label="Your details">
                  <button type="button" className="form__back" onClick={() => setSlot(null)}>
                    <ArenaIcon icon="ph-bold ph-arrow-left" />
                    {' Back to the calendar'}
                  </button>
                  <h2 className="form__title">Enter your details</h2>

                  <ArenaInput
                    label="Name"
                    required
                    value={name}
                    autoComplete="name"
                    onChange={setName}
                  />
                  <ArenaInput
                    label="Email"
                    type="email"
                    required
                    hint="The invitation and the link go here."
                    value={email}
                    autoComplete="email"
                    onChange={setEmail}
                  />
                  <ArenaRadioGroup ariaLabel="Who is coming" value={guests} onChange={setGuests}>
                    {GUESTS.map((one) => (
                      <ArenaRadio key={one.value} value={one.value} label={one.label} hint={one.hint} />
                    ))}
                  </ArenaRadioGroup>
                  <ArenaTextarea
                    label="Anything I should read first"
                    counter
                    maxLength={400}
                    rows={4}
                    value={note}
                    onChange={setNote}
                  />
                  <ArenaCheckbox
                    label="Send me a reminder the day before"
                    checked={remind}
                    onChange={setRemind}
                  />

                  <div className="form__foot">
                    <ArenaButton className="arena-size-lg" onClick={() => setBooked(true)}>Schedule the call</ArenaButton>
                    <p className="form__note">
                      By scheduling you agree to the terms. Nothing is charged.
                    </p>
                  </div>
                </section>
              ) : (
                <section className="done" aria-label="Confirmed">
                  <h2 className="form__title">You are scheduled</h2>
                  <p className="done__note">
                    {`The invitation and the conference link are on their way to ${email || 'your inbox'}.`}
                  </p>
                  <ArenaButton
                    icon="ph-bold ph-arrow-counter-clockwise"
                    className="arena-emphasis-secondary"
                    onClick={() => {
                      setSlot(null);
                      setBooked(false);
                    }}
                  >
                    Book another time
                  </ArenaButton>
                </section>
              )}
            </div>
          </div>
        </ArenaMain>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<ArenaIconsProvider href={ARENA_SPRITE}><Openings /></ArenaIconsProvider>);
