import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  ArenaAction,
  ArenaAvatar,
  ArenaButton,
  ArenaCommandPalette,
  ArenaEmptyState,
  ArenaFigure,
  ArenaIcon,
  ArenaIconButton,
  ArenaInput,
  ArenaKbd,
  ArenaMain,
  ArenaMedia,
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
  ArenaThemeService,
} from '@dravensoft/arena-angular';
import type { ArenaCatSlot, ArenaMenuItem, ArenaSegmentOption } from '@dravensoft/arena-angular';
import { ThreadRow } from './pieces';
import { COMMANDS, FOLDERS, SENDS, SNOOZES, TEAMS, THREADS, thread } from '../data/Mail';

const SPLITS: ArenaSegmentOption[] = [
  { value: 'important', label: 'Important' },
  { value: 'other', label: 'Other' },
];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [
    ArenaAction, ArenaAvatar, ArenaButton, ArenaCommandPalette, ArenaEmptyState, ArenaFigure, ArenaIcon,
    ArenaIconButton, ArenaInput, ArenaKbd, ArenaMain, ArenaMedia, ArenaPopover, ArenaRadio, ArenaRadioGroup,
    ArenaSegmentedControl, ArenaSideNav, ArenaSideNavItem, ArenaSideNavSection, ArenaSplitButton, ArenaTag,
    ArenaTextarea, ThreadRow,
  ],
  template: `
    <div class="mail">
      <aside class="rail">
        <div class="rail__head">
          <span class="rail__glyph" aria-hidden="true"><arena-icon icon="ph-fill ph-paper-plane-tilt" /></span>
          <span class="rail__word">Relay</span>
          <span class="rail__gap"></span>
          <arena-icon-button
            [icon]="theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'"
            [label]="theme() === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'"
            class="arena-size-sm"
            (click)="themes.set(theme() === 'dark' ? 'light' : 'dark')"
          />
        </div>

        <div class="rail__compose">
          <arena-button icon="ph-bold ph-pencil-simple" class="arena-fill arena-size-sm">
            Compose
          </arena-button>
        </div>

        <arena-side-nav ariaLabel="Mailboxes" [active]="folder()" (nav)="folder.set($event)">
          @for (one of folders; track one.id) {
            <arena-side-nav-item [id]="one.id" [label]="one.label" [icon]="one.icon" [badge]="badge(one.badge)" />
          }
          <arena-side-nav-section label="Channels">
            @for (one of teams; track one.id) {
              <arena-side-nav-item [id]="one.id" [label]="one.label" [icon]="one.icon" [badge]="badge(one.badge)" />
            }
          </arena-side-nav-section>
        </arena-side-nav>

        <div class="rail__foot">
          <span class="rail__hint">
            <arena-kbd [keys]="['Cmd', 'K']" />
            <span class="rail__hint-text">for anything</span>
          </span>
        </div>
      </aside>

      <section class="list" aria-label="Conversations">
        <div class="list__head">
          <arena-input
            label="Search mail"
            icon="ph-bold ph-magnifying-glass"
            [value]="query()"
            (change)="query.set($event)"
          />
          <arena-segmented-control
            ariaLabel="Which half of the inbox"
            [options]="splits"
            [value]="split()"
            class="arena-size-sm"
            (change)="split.set($event)"
          />
        </div>
        <ul class="list__rows">
          @for (one of shown(); track one.id) {
            <app-thread-row [item]="one" [current]="one.id === openId()" (openThread)="openId.set($event)" />
          }
        </ul>
      </section>

      <arena-main>
        @if (shown().length) {
          <article class="read">
            <header class="read__head">
              <div class="read__title-row">
                <h1 class="read__subject">{{ open().subject }}</h1>
                <span class="read__actions">
                  <arena-icon-button icon="ph-bold ph-archive" label="Archive" class="arena-size-sm" (click)="settle(open().id)" />
                  <arena-popover
                    label="Remind me"
                    [open]="snoozing()"
                    align="end"
                    (openChange)="snoozing.set($event)"
                  >
                    <arena-icon-button trigger icon="ph-bold ph-clock-countdown" label="Snooze" class="arena-size-sm" />
                    <div class="snooze">
                      <arena-radio-group ariaLabel="When it comes back" [value]="until()" (change)="until.set($event)">
                        @for (one of snoozes; track one.value) {
                          <arena-radio [value]="one.value" [label]="one.label" [hint]="one.hint" />
                        }
                      </arena-radio-group>
                      <div class="snooze__foot">
                        <span class="snooze__hint">
                          <arena-kbd [keys]="['H']" />
                          <span class="rail__hint-text">from anywhere</span>
                        </span>
                        <arena-button
                          icon="ph-bold ph-clock-countdown"
                          class="arena-emphasis-secondary arena-size-sm"
                          (click)="settle(open().id); snoozing.set(false)"
                        >
                          Snooze
                        </arena-button>
                      </div>
                    </div>
                  </arena-popover>
                  <arena-icon-button icon="ph-bold ph-trash" label="Delete" class="arena-size-sm" />
                  <arena-icon-button icon="ph-bold ph-dots-three" label="More actions" class="arena-size-sm" />
                </span>
              </div>
              @if (open().labels.length) {
                <span class="read__labels">
                  @for (label of open().labels; track label; let index = $index) {
                    <arena-tag [colorId]="slot(index)">{{ label }}</arena-tag>
                  }
                </span>
              }
            </header>

            <div class="read__from">
              <arena-avatar [src]="open().avatar" [name]="open().from" class="arena-size-sm" />
              <span class="read__who">
                <span class="read__name">{{ open().from }}</span>
                <span class="read__to">{{ 'to ' + open().to }}</span>
              </span>
              <span class="read__at arena-num">{{ open().at }}</span>
            </div>

            <div class="read__body">
              @for (line of open().body; track line) { <p>{{ line }}</p> }
            </div>

            @if (open().attachments.length) {
              <div class="read__files">
                @for (file of open().attachments; track file.name) {
                  <figure class="file">
                    <arena-figure>
                      <img media [src]="file.img" alt="" />
                    </arena-figure>
                    <figcaption class="file__meta">
                      <span class="file__name">{{ file.name }}</span>
                      <span class="file__size arena-num">{{ file.size }}</span>
                    </figcaption>
                  </figure>
                }
              </div>
            }

            @if (replying()) {
              <section class="compose" aria-label="Reply">
                <arena-textarea [label]="'Reply to ' + open().from" [value]="draft()" [rows]="4" (change)="draft.set($event)" />
                <div class="compose__foot">
                  <arena-split-button
                    label="Send"
                    menuLabel="More ways to send"
                    icon="ph-bold ph-paper-plane-tilt"
                    [items]="sends"
                    class="arena-emphasis-secondary arena-size-sm"
                    (click)="discard()"
                    (select)="sendWith($event)"
                  >
                    Send
                  </arena-split-button>
                  <arena-button class="arena-emphasis-ghost arena-size-sm" (click)="discard()">
                    Discard
                  </arena-button>
                  <span class="read__reply-hint">
                    <arena-kbd [keys]="['Cmd', 'Enter']" />
                    <span class="rail__hint-text">to send</span>
                  </span>
                </div>
              </section>
            } @else {
              <footer class="read__reply">
                <arena-button icon="ph-bold ph-arrow-bend-up-left" class="arena-size-sm arena-emphasis-secondary" (click)="replying.set(true)">Reply</arena-button>
                <arena-button icon="ph-bold ph-arrow-bend-double-up-right" class="arena-emphasis-secondary arena-size-sm">Forward</arena-button>
                <span class="read__reply-hint">
                  <arena-kbd [keys]="['R']" />
                  <span class="rail__hint-text">to reply</span>
                </span>
              </footer>
            }
          </article>
        } @else {
          <div class="zero">
            <arena-empty-state
              icon="ph-bold ph-check-circle"
              title="Inbox zero"
              headingLevel="h1"
              [message]="zero()"
            >
              <arena-button action icon="ph-bold ph-arrow-counter-clockwise" class="arena-emphasis-secondary arena-size-sm" (click)="done.set([])">
                Bring them back
              </arena-button>
            </arena-empty-state>
          </div>
        }
      </arena-main>

      <arena-command-palette
        [open]="palette()"
        placeholder="Type a command"
        [commands]="commands"
        (close)="palette.set(false)"
        (run)="palette.set(false)"
      />
    </div>
  `,
})
export class Relay {
  protected readonly themes = inject(ArenaThemeService);
  protected readonly theme = this.themes.theme;

  protected readonly folders = FOLDERS;
  protected readonly teams = TEAMS;
  protected readonly commands = COMMANDS;
  protected readonly splits = SPLITS;
  protected readonly snoozes = SNOOZES;
  protected readonly sends = SENDS;

  protected readonly folder = signal('inbox');
  protected readonly split = signal('important');
  protected readonly openId = signal('contract');
  protected readonly query = signal('');
  protected readonly done = signal<string[]>([]);
  protected readonly snoozing = signal(false);
  protected readonly until = signal('tomorrow');
  protected readonly replying = signal(false);
  protected readonly draft = signal('');
  protected readonly palette = signal(
    new URLSearchParams(window.location.search).get('palette') === 'open',
  );

  protected readonly shown = computed(() =>
    THREADS.filter((one) => one.split === this.split() && !this.done().includes(one.id)),
  );
  protected readonly open = computed(() => thread(this.openId()));
  protected readonly zero = computed(() =>
    `Every conversation in ${SPLITS.find((one) => one.value === this.split())?.label} is handled. A snoozed one comes back to the top when its time comes.`,
  );

  /* Archiving or snoozing takes the conversation out of the list and opens the next one. */
  protected settle(id: string): void {
    const next = this.shown().find((one) => one.id !== id);
    this.done.set([...this.done(), id]);
    if (next) this.openId.set(next.id);
    this.discard();
  }

  protected discard(): void {
    this.replying.set(false);
    this.draft.set('');
  }

  protected sendWith(item: ArenaMenuItem): void {
    if (item.label === 'Send and archive') this.settle(this.open().id);
    else this.discard();
  }

  protected badge(value: string | undefined): number | undefined {
    return value === undefined ? undefined : Number(value);
  }

  protected slot(index: number): ArenaCatSlot {
    return ((index % 8) + 1) as ArenaCatSlot;
  }
}
