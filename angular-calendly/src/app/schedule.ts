import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
} from '@dravensoft/arena-angular';
import { EVENT } from '../data/Booking';
import { LINK, MEETINGS, WEEK, WEEKDAY_OPTIONS, ZONE } from '../data/Schedule';
import type { Meeting } from '../data/Schedule';

/* The host's side of the same product: the week that is booked, and the event type it is booked from. */
@Component({
  selector: 'app-schedule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [
    ArenaButton, ArenaCalendar, ArenaCalendarEvent, ArenaCheckbox, ArenaCheckboxGroup, ArenaConfirmDialog,
    ArenaCopyButton, ArenaFieldset, ArenaMain, ArenaNumberField, ArenaSwitch,
  ],
  template: `
    <arena-main>
      <div class="host">
        <section class="host__week" aria-labelledby="host-week">
          <h1 class="host__title" id="host-week">Scheduled events</h1>
          <div class="host__calendar">
            <arena-calendar [timeZone]="zone" [anchorDate]="week" dayEnd="18:00">
              @for (one of meetings(); track one.id) {
                <arena-calendar-event
                  [id]="one.id"
                  [title]="one.title"
                  [start]="one.start"
                  [end]="one.end"
                  [colorId]="one.kind"
                  [details]="[one.who]"
                  actionsEnabled
                >
                  <arena-button
                    actions
                    icon="ph-bold ph-x"
                    destructive
                    class="arena-emphasis-ghost arena-size-sm"
                    (activate)="subject.set(one); asking.set(true)"
                  >Cancel</arena-button>
                </arena-calendar-event>
              }
            </arena-calendar>
          </div>
        </section>

        <section class="host__type" aria-labelledby="host-type">
          <div class="host__head">
            <h2 class="host__subtitle" id="host-type">{{ event.title }}</h2>
            <arena-switch
              label="Taking bookings"
              [state]="live()"
              (funcOn)="live.set(true)"
              (funcOff)="live.set(false)"
            />
          </div>

          <div class="link">
            <span class="link__url">{{ link }}</span>
            <arena-copy-button [text]="link" label="Copy the booking link" showLabel />
          </div>

          <arena-fieldset
            legend="Available days"
            hint="An invitee can only pick a day ticked here."
            [error]="days().length === 0 ? 'Choose at least one day.' : undefined"
            [disabled]="!live()"
          >
            <arena-checkbox-group ariaLabel="Available days" name="days" [value]="days()" (valueChange)="days.set($event.values)">
              @for (one of weekdays; track one.value) {
                <arena-checkbox [value]="one.value" [label]="one.label" />
              }
            </arena-checkbox-group>
          </arena-fieldset>

          <arena-fieldset
            legend="Length and buffers"
            hint="A buffer keeps the time either side of a call free."
            [disabled]="!live()"
          >
            <div class="host__numbers">
              <arena-number-field label="Duration" suffix="min" [min]="15" [max]="240" [step]="15" [value]="duration()" (valueChange)="duration.set($event)" />
              <arena-number-field label="Buffer before" suffix="min" [min]="0" [max]="60" [step]="5" [value]="before()" (valueChange)="before.set($event)" />
              <arena-number-field label="Buffer after" suffix="min" [min]="0" [max]="60" [step]="5" [value]="after()" (valueChange)="after.set($event)" />
            </div>
          </arena-fieldset>

          <div class="host__foot">
            <arena-button [disabled]="days().length === 0">Save changes</arena-button>
          </div>
        </section>
      </div>

      @if (subject(); as one) {
        <arena-confirm-dialog
          [open]="asking()"
          [title]="'Cancel ' + one.title"
          confirmLabel="Cancel the meeting"
          cancelLabel="Keep it"
          destructive
          (cancel)="asking.set(false)"
          (confirm)="drop(one)"
        >{{ one.who + ' is told by email that the meeting is off, and the slot opens again on the booking page.' }}</arena-confirm-dialog>
      }
    </arena-main>
  `,
})
export class Schedule {
  protected readonly event = EVENT;
  protected readonly zone = ZONE;
  protected readonly week = WEEK;
  protected readonly link = LINK;
  protected readonly weekdays = WEEKDAY_OPTIONS;

  protected readonly meetings = signal<Meeting[]>(MEETINGS);
  protected readonly subject = signal<Meeting | null>(null);
  protected readonly asking = signal(false);
  protected readonly live = signal(true);
  protected readonly days = signal<readonly string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  protected readonly duration = signal(30);
  protected readonly before = signal(0);
  protected readonly after = signal(10);

  protected drop(one: Meeting): void {
    this.meetings.update((all) => all.filter((each) => each.id !== one.id));
    this.asking.set(false);
  }
}
