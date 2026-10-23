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
  ArenaTextarea,
  ArenaThemeService,
} from '@dravensoft/arena-angular';
import type { ArenaKeyValueRow } from '@dravensoft/arena-angular';
import { DAYS, EVENT, GUESTS, HOST, MONTH, SLOTS, WEEKDAYS, ZONES } from '../data/Booking';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [
    ArenaAvatar, ArenaButton, ArenaCheckbox, ArenaIcon, ArenaIconButton, ArenaInput, ArenaKeyValue,
    ArenaMain, ArenaRadio, ArenaRadioGroup, ArenaSelect, ArenaTextarea,
  ],
  template: `
    <div class="page">
      <div class="page__bar">
        <arena-icon-button
          [icon]="theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'"
          [label]="theme() === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'"
          class="arena-size-sm"
          (click)="themes.set(theme() === 'dark' ? 'light' : 'dark')"
        />
      </div>

      <arena-main>
        <div class="card">
          <aside class="who">
            <arena-avatar [src]="host.avatar" [name]="host.name" class="arena-size-lg" />
            <p class="who__name">{{ host.name }}</p>
            <h1 class="who__title">{{ event.title }}</h1>
            <arena-key-value [rows]="rows()" />
            <p class="who__blurb">{{ event.blurb }}</p>
          </aside>

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
                      <arena-button class="arena-emphasis-secondary arena-fill" (click)="slot.set(one)">{{ one }}</arena-button>
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
                  (change)="zone.set($event)"
                />
              </div>
            </section>
          } @else {
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
                (change)="name.set($event)"
              />
              <arena-input
                label="Email"
                type="email"
                required
                hint="The invitation and the link go here."
                [value]="email()"
                autoComplete="email"
                (change)="email.set($event)"
              />
              <arena-radio-group ariaLabel="Who is coming" [value]="guests()" (change)="guests.set($event)">
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
                (change)="note.set($event)"
              />
              <arena-checkbox
                label="Send me a reminder the day before"
                [checked]="remind()"
                (change)="remind.set($event)"
              />

              <div class="form__foot">
                <arena-button class="arena-size-lg">Schedule the call</arena-button>
                <p class="form__note">
                  By scheduling you agree to the terms. Nothing is charged.
                </p>
              </div>
            </section>
          }
        </div>
      </arena-main>
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

  protected readonly day = signal(17);
  protected readonly slot = signal<string | null>(
    new URLSearchParams(window.location.search).get('step') === 'details' ? '14:00' : null,
  );
  protected readonly zone = signal('lisbon');
  protected readonly guests = signal('none');
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly note = signal('');
  protected readonly remind = signal(true);

  protected readonly step = computed(() => (this.slot() ? 'details' : 'when'));

  protected readonly rows = computed<ArenaKeyValueRow[]>(() => [
    { term: 'Length', value: EVENT.duration },
    { term: 'Where', value: 'Web conference' },
    { term: 'When', value: `Thu 17 September, ${this.slot() ?? 'pick a time'}` },
  ]);
}
