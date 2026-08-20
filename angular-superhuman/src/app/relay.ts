import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  ArenaAvatar,
  ArenaButton,
  ArenaCommandPalette,
  ArenaFigure,
  ArenaIconButton,
  ArenaInput,
  ArenaMain,
  ArenaMedia,
  ArenaSegmentedControl,
  ArenaSideNav,
  ArenaSideNavItem,
  ArenaSideNavSection,
  ArenaTag,
  ArenaThemeService,
} from '@dravensoft/arena-angular';
import type { ArenaCatSlot, ArenaSegmentOption } from '@dravensoft/arena-angular';
import { Cap, ThreadRow } from './pieces';
import { COMMANDS, FOLDERS, TEAMS, THREADS, thread } from '../data/Mail';

const SPLITS: ArenaSegmentOption[] = [
  { value: 'important', label: 'Important' },
  { value: 'other', label: 'Other' },
];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [
    ArenaAvatar, ArenaButton, ArenaCommandPalette, ArenaFigure, ArenaIconButton, ArenaInput,
    ArenaMain, ArenaMedia, ArenaSegmentedControl, ArenaSideNav, ArenaSideNavItem,
    ArenaSideNavSection, ArenaTag, Cap, ThreadRow,
  ],
  template: `
    <div class="mail">
      <aside class="rail">
        <div class="rail__head">
          <i class="ph-fill ph-paper-plane-tilt rail__glyph" aria-hidden="true"></i>
          <span class="rail__word">Relay</span>
          <span class="rail__gap"></span>
          <arena-icon-button
            [icon]="theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'"
            [label]="theme() === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'"
            size="sm"
            (click)="themes.set(theme() === 'dark' ? 'light' : 'dark')"
          />
        </div>

        <div class="rail__compose">
          <arena-button variant="primary" full icon="ph-bold ph-pencil-simple" size="sm">
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
            <app-cap>Cmd</app-cap>
            <app-cap>K</app-cap>
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
            size="sm"
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
        <article class="read">
          <header class="read__head">
            <div class="read__title-row">
              <h1 class="read__subject">{{ open().subject }}</h1>
              <span class="read__actions">
                <arena-icon-button icon="ph-bold ph-archive" label="Archive" size="sm" />
                <arena-icon-button icon="ph-bold ph-clock-countdown" label="Snooze" size="sm" />
                <arena-icon-button icon="ph-bold ph-trash" label="Delete" size="sm" />
                <arena-icon-button icon="ph-bold ph-dots-three" label="More actions" size="sm" />
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
            <arena-avatar [src]="open().avatar" [name]="open().from" size="sm" />
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

          <footer class="read__reply">
            <arena-button variant="primary" icon="ph-bold ph-arrow-bend-up-left" size="sm">Reply</arena-button>
            <arena-button variant="secondary" icon="ph-bold ph-arrow-bend-double-up-right" size="sm">Forward</arena-button>
            <span class="read__reply-hint">
              <app-cap>R</app-cap>
              <span class="rail__hint-text">to reply</span>
            </span>
          </footer>
        </article>
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

  protected readonly folder = signal('inbox');
  protected readonly split = signal('important');
  protected readonly openId = signal('contract');
  protected readonly query = signal('');
  protected readonly palette = signal(
    new URLSearchParams(window.location.search).get('palette') === 'open',
  );

  protected readonly shown = computed(() => THREADS.filter((one) => one.split === this.split()));
  protected readonly open = computed(() => thread(this.openId()));

  protected badge(value: string | undefined): number | undefined {
    return value === undefined ? undefined : Number(value);
  }

  protected slot(index: number): ArenaCatSlot {
    return ((index % 8) + 1) as ArenaCatSlot;
  }
}
