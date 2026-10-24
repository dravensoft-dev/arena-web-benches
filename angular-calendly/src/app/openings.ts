import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  ArenaAvatar,
  ArenaButton,
  ArenaCheckbox,
  ArenaIcon,
  ArenaIconButton,
  ArenaInput,
  ArenaKeyValue,
  ArenaMain,
  ArenaRadio,
  ArenaRadioGroup,
  ArenaSelect,
  ArenaStepper,
  ArenaTextarea,
  ArenaThemeService,
} from '@dravensoft/arena-angular';
import type { ArenaKeyValueRow } from '@dravensoft/arena-angular';
import { DAYS, EVENT, GUESTS, HOST, MONTH, SLOTS, WEEKDAYS, ZONES } from '../data/Booking';
import { BOOKING_STEPS } from '../data/Schedule';
import { Schedule } from './schedule';

const ASKED = new URLSearchParams(window.location.search);

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [
    ArenaAvatar, ArenaButton, ArenaCheckbox, ArenaIcon, ArenaIconButton, ArenaInput, ArenaKeyValue,
    ArenaMain, ArenaRadio, ArenaRadioGroup, ArenaSelect, ArenaStepper, ArenaTextarea, Schedule,
  ],
  template: `
    <div class="page">
      <div class="page__bar">
        <arena-button
          [icon]="view() === 'host' ? 'ph-bold ph-arrow-left' : 'ph-bold ph-calendar-blank'"
          class="arena-emphasis-ghost arena-size-sm"
          (activate)="view.set(view() === 'host' ? 'booking' : 'host')"
        >{{ view() === 'host' ? 'Back to the booking page' : 'Your schedule' }}</arena-button>
        <arena-icon-button
          [icon]="theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'"
          [label]="theme() === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'"
          class="arena-size-sm"
          (activate)="themes.set(theme() === 'dark' ? 'light' : 'dark')"
        />
      </div>

      @if (view() === 'host') {
        <app-schedule />
      } @else {
        <arena-main>
          <div class="card">
            <aside class="who">
              <arena-avatar [src]="host.avatar" [name]="host.name" class="arena-size-lg" />
              <p class="who__name">{{ host.name }}</p>
              <h1 class="who__title">{{ event.title }}</h1>
              <arena-key-value [rows]="rows()" />
              <p class="who__blurb">{{ event.blurb }}</p>
            </aside>

            <div class="flow">
              <div class="flow__steps">
                <arena-stepper
                  ariaLabel="Booking"
                  [steps]="steps"
                  [index]="at()"
                  interactive
                  (valueChange)="back($event)"
                />
              </div>

              @if (step() === 'when') {
                <section class="when" aria-label="Pick a date and a time">
                  <h2 class="when__title">Select a date and time</h2>
                  <div class="when__cols">
                    <div class="cal">
                      <div class="cal__head">
                        <span class="cal__month">{{ month }}</span>
                        <span class="cal__nav">
                          <arena-icon-button icon="ph-bold ph-caret-left" label="Previous month" class="arena-size-sm" />
                          <arena-icon-button icon="ph-bold ph-caret-right" label="Next month" class="arena-size-sm" />
                        </span>
                      </div>
                      <div class="cal__grid" role="grid" [attr.aria-label]="month">
                        @for (one of weekdays; track one) {
                          <span class="cal__weekday" role="columnheader">{{ one }}</span>
                        }
                        @for (one of days; track $index) {
                          <button
                            type="button"
                            class="cal__day"
                            role="gridcell"
                            [attr.data-open]="one.open"
                            [attr.data-muted]="one.muted ? 'yes' : 'no'"
                            [attr.aria-pressed]="one.open && one.n === day()"
                            [disabled]="!one.open"
                            (click)="day.set(one.n)"
                          >
                            <span class="arena-num">{{ one.n }}</span>
                          </button>
                        }
                      </div>
                    </div>

                    <div class="slots">
                      <p class="slots__day">Thursday 17 September</p>
                      <div class="slots__grid">
                        @for (one of slots; track one) {
                          <arena-button class="arena-emphasis-secondary arena-fill" (activate)="slot.set(one)">{{ one }}</arena-button>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="when__zone">
                    <arena-select
                      label="Time zone"
                      icon="ph-bold ph-globe"
                      [options]="zones"
                      [value]="zone()"
                      (valueChange)="zone.set($event)"
                    />
                  </div>
                </section>
              } @else if (step() === 'details') {
                <section class="form" aria-label="Your details">
                  <button type="button" class="form__back" (click)="slot.set(null)">
                    <arena-icon icon="ph-bold ph-arrow-left" />
                    {{ ' Back to the calendar' }}
                  </button>
                  <h2 class="form__title">Enter your details</h2>

                  <arena-input
                    label="Name"
                    required
                    [value]="name()"
                    autoComplete="name"
                    (valueChange)="name.set($event)"
                  />
                  <arena-input
                    label="Email"
                    type="email"
                    required
                    hint="The invitation and the link go here."
                    [value]="email()"
                    autoComplete="email"
                    (valueChange)="email.set($event)"
                  />
                  <arena-radio-group ariaLabel="Who is coming" [value]="guests()" (valueChange)="guests.set($event)">
                    @for (one of guestOptions; track one.value) {
                      <arena-radio [value]="one.value" [label]="one.label" [hint]="one.hint" />
                    }
                  </arena-radio-group>
                  <arena-textarea
                    label="Anything I should read first"
                    counter
                    [maxLength]="400"
                    [rows]="4"
                    [value]="note()"
                    (valueChange)="note.set($event)"
                  />
                  <arena-checkbox
                    label="Send me a reminder the day before"
                    [checked]="remind()"
                    (valueChange)="remind.set($event)"
                  />

                  <div class="form__foot">
                    <arena-button class="arena-size-lg" (activate)="booked.set(true)">Schedule the call</arena-button>
                    <p class="form__note">
                      By scheduling you agree to the terms. Nothing is charged.
                    </p>
                  </div>
                </section>
              } @else {
                <section class="done" aria-label="Confirmed">
                  <h2 class="form__title">You are scheduled</h2>
                  <p class="done__note">
                    {{ 'The invitation and the conference link are on their way to ' + (email() || 'your inbox') + '.' }}
                  </p>
                  <arena-button
                    icon="ph-bold ph-arrow-counter-clockwise"
                    class="arena-emphasis-secondary"
                    (activate)="slot.set(null); booked.set(false)"
                  >Book another time</arena-button>
                </section>
              }
            </div>
          </div>
        </arena-main>
      }
    </div>
  `,
})
export class Openings {
  protected readonly themes = inject(ArenaThemeService);
  protected readonly theme = this.themes.theme;

  protected readonly host = HOST;
  protected readonly event = EVENT;
  protected readonly month = MONTH;
  protected readonly weekdays = WEEKDAYS;
  protected readonly days = DAYS;
  protected readonly slots = SLOTS;
  protected readonly zones = ZONES;
  protected readonly guestOptions = GUESTS;
  protected readonly steps = BOOKING_STEPS;

  protected readonly view = signal(ASKED.get('view') === 'host' ? 'host' : 'booking');

  protected readonly day = signal(17);
  protected readonly slot = signal<string | null>(
    ASKED.get('step') === 'details' || ASKED.get('step') === 'done' ? '14:00' : null,
  );
  protected readonly booked = signal(ASKED.get('step') === 'done');
  protected readonly zone = signal('lisbon');
  protected readonly guests = signal('none');
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly note = signal('');
  protected readonly remind = signal(true);

  protected readonly step = computed(() => (this.slot() ? (this.booked() ? 'done' : 'details') : 'when'));
  protected readonly at = computed(() => (this.step() === 'when' ? 0 : this.step() === 'details' ? 1 : 2));

  protected readonly rows = computed<ArenaKeyValueRow[]>(() => [
    { term: 'Length', value: EVENT.duration },
    { term: 'Where', value: 'Web conference' },
    { term: 'When', value: `Thu 17 September, ${this.slot() ?? 'pick a time'}` },
  ]);

  protected back(index: number): void {
    if (index === 0) this.slot.set(null);
    this.booked.set(false);
  }
}
