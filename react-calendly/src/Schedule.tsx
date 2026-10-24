import React, { useState } from 'react';
import {
  ArenaButton,
  ArenaCalendar,
  ArenaCalendarEvent,
  ArenaCheckbox,
  ArenaCheckboxGroup,
  ArenaConfirmDialog,
  ArenaCopyButton,
  ArenaFieldset,
  ArenaMain,
  ArenaNumberField,
  ArenaSwitch,
} from '@dravensoft/arena-react';

import { EVENT } from './data/Booking';
import { LINK, MEETINGS, WEEK, WEEKDAY_OPTIONS, ZONE } from './data/Schedule';
import type { Meeting } from './data/Schedule';

/* The host's side of the same product: the week that is booked, and the event type it is booked from. */
export function Schedule() {
  const [meetings, setMeetings] = useState<Meeting[]>(MEETINGS);
  const [subject, setSubject] = useState<Meeting | null>(null);
  const [asking, setAsking] = useState(false);
  const [live, setLive] = useState(true);
  const [days, setDays] = useState<readonly string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [duration, setDuration] = useState(30);
  const [before, setBefore] = useState(0);
  const [after, setAfter] = useState(10);

  return (
    <ArenaMain>
      <div className="host">
        <section className="host__week" aria-labelledby="host-week">
          <h1 className="host__title" id="host-week">Scheduled events</h1>
          <div className="host__calendar">
            <ArenaCalendar timeZone={ZONE} anchorDate={WEEK} dayEnd="18:00">
              {meetings.map((one) => (
                <ArenaCalendarEvent
                  key={one.id}
                  id={one.id}
                  title={one.title}
                  start={one.start}
                  end={one.end}
                  colorId={one.kind}
                  details={[one.who]}
                  actionsEnabled
                  actions={
                    <ArenaButton
                      icon="ph-bold ph-x"
                      destructive
                      className="arena-emphasis-ghost arena-size-sm"
                      onClick={() => {
                        setSubject(one);
                        setAsking(true);
                      }}
                    >
                      Cancel
                    </ArenaButton>
                  }
                />
              ))}
            </ArenaCalendar>
          </div>
        </section>

        <section className="host__type" aria-labelledby="host-type">
          <div className="host__head">
            <h2 className="host__subtitle" id="host-type">{EVENT.title}</h2>
            <ArenaSwitch
              label="Taking bookings"
              state={live}
              onFuncOn={() => setLive(true)}
              onFuncOff={() => setLive(false)}
            />
          </div>

          <div className="link">
            <span className="link__url">{LINK}</span>
            <ArenaCopyButton text={LINK} label="Copy the booking link" showLabel />
          </div>

          <ArenaFieldset
            legend="Available days"
            hint="An invitee can only pick a day ticked here."
            error={days.length === 0 ? 'Choose at least one day.' : undefined}
            disabled={!live}
          >
            <ArenaCheckboxGroup ariaLabel="Available days" name="days" value={days} onChange={(set) => setDays(set.values)}>
              {WEEKDAY_OPTIONS.map((one) => (
                <ArenaCheckbox key={one.value} value={one.value} label={one.label} />
              ))}
            </ArenaCheckboxGroup>
          </ArenaFieldset>

          <ArenaFieldset
            legend="Length and buffers"
            hint="A buffer keeps the time either side of a call free."
            disabled={!live}
          >
            <div className="host__numbers">
              <ArenaNumberField label="Duration" suffix="min" min={15} max={240} step={15} value={duration} onChange={setDuration} />
              <ArenaNumberField label="Buffer before" suffix="min" min={0} max={60} step={5} value={before} onChange={setBefore} />
              <ArenaNumberField label="Buffer after" suffix="min" min={0} max={60} step={5} value={after} onChange={setAfter} />
            </div>
          </ArenaFieldset>

          <div className="host__foot">
            <ArenaButton disabled={days.length === 0}>Save changes</ArenaButton>
          </div>
        </section>
      </div>

      {subject && (
        <ArenaConfirmDialog
          open={asking}
          title={`Cancel ${subject.title}`}
          confirmLabel="Cancel the meeting"
          cancelLabel="Keep it"
          destructive
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setMeetings((all) => all.filter((one) => one.id !== subject.id));
            setAsking(false);
          }}
        >
          {`${subject.who} is told by email that the meeting is off, and the slot opens again on the booking page.`}
        </ArenaConfirmDialog>
      )}
    </ArenaMain>
  );
}
