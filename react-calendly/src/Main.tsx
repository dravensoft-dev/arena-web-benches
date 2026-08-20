import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArenaAvatar,
  ArenaButton,
  ArenaCheckbox,
  ArenaIconButton,
  ArenaInput,
  ArenaKeyValue,
  ArenaMain,
  ArenaRadio,
  ArenaRadioGroup,
  ArenaSelect,
  ArenaTextarea,
  initArenaTheme,
  useArenaTheme,
} from '@dravensoft/arena-react';

import '@phosphor-icons/web/regular';
import '@phosphor-icons/web/bold';
import '@phosphor-icons/web/fill';
import './icons.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { DAYS, EVENT, GUESTS, HOST, MONTH, SLOTS, WEEKDAYS, ZONES } from './data/Booking';

initArenaTheme({
  palettes: [
    { name: 'light', polarity: 'light' },
    { name: 'dark', polarity: 'dark' },
  ],
  default: 'light',
});

function Openings() {
  const [theme, setTheme] = useArenaTheme();
  const [day, setDay] = useState(17);
  const [slot, setSlot] = useState<string | null>(
    () => (new URLSearchParams(window.location.search).get('step') === 'details' ? '14:00' : null),
  );
  const [zone, setZone] = useState('lisbon');
  const [guests, setGuests] = useState('none');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [remind, setRemind] = useState(true);
  const step = slot ? 'details' : 'when';

  return (
    <div className="page">
      <div className="page__bar">
        <ArenaIconButton
          icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'}
          label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
      </div>

      <ArenaMain>
        <div className="card">
          <aside className="who">
            <ArenaAvatar src={HOST.avatar} name={HOST.name} size="lg" />
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

          {step === 'when' ? (
            <section className="when" aria-label="Pick a date and a time">
              <h2 className="when__title">Select a date and time</h2>
              <div className="when__cols">
                <div className="cal">
                  <div className="cal__head">
                    <span className="cal__month">{MONTH}</span>
                    <span className="cal__nav">
                      <ArenaIconButton icon="ph-bold ph-caret-left" label="Previous month" size="sm" />
                      <ArenaIconButton icon="ph-bold ph-caret-right" label="Next month" size="sm" />
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
                      <ArenaButton key={one} variant="secondary" full onClick={() => setSlot(one)}>
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
          ) : (
            <section className="form" aria-label="Your details">
              <button type="button" className="form__back" onClick={() => setSlot(null)}>
                <i className="ph-bold ph-arrow-left" aria-hidden="true" />
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
                <ArenaButton variant="primary" size="lg">Schedule the call</ArenaButton>
                <p className="form__note">
                  By scheduling you agree to the terms. Nothing is charged.
                </p>
              </div>
            </section>
          )}
        </div>
      </ArenaMain>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Openings />);
