import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild } from '@angular/core';
import {
  ArenaAvatar,
  ArenaBottomNav,
  ArenaBottomNavItem,
  ArenaButton,
  ArenaDialog,
  ArenaFileInput,
  ArenaFooter,
  ArenaIcon,
  ArenaIconButton,
  ArenaThemeService,
  arenaViewportBelow,
} from '@dravensoft/arena-angular';
import { Carousel, Handle } from './Pieces';
import { CodeScreen } from './screens/CodeScreen';
import { FeedScreen } from './screens/FeedScreen';
import { LogInScreen } from './screens/LogInScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ACCOUNTS, ME, POSTS, UPLOAD, writeCount } from './data/Feed';
import type { GridPost, Post } from './data/Feed';

type Screen = 'feed' | 'profile' | 'login' | 'code';

const SCREENS: Screen[] = ['feed', 'profile', 'login', 'code'];

type NavEntry = { id: string; label: string; icon: string; fill: string };

const NAV: NavEntry[] = [
  { id: 'home', label: 'Home', icon: 'ph-bold ph-house', fill: 'ph-fill ph-house' },
  { id: 'search', label: 'Search', icon: 'ph-bold ph-magnifying-glass', fill: 'ph-fill ph-magnifying-glass' },
  { id: 'explore', label: 'Explore', icon: 'ph-bold ph-compass', fill: 'ph-fill ph-compass' },
  { id: 'reels', label: 'Reels', icon: 'ph-bold ph-film-strip', fill: 'ph-fill ph-film-strip' },
  { id: 'messages', label: 'Messages', icon: 'ph-bold ph-paper-plane-tilt', fill: 'ph-fill ph-paper-plane-tilt' },
  { id: 'notifications', label: 'Notifications', icon: 'ph-bold ph-heart', fill: 'ph-fill ph-heart' },
  { id: 'create', label: 'Create', icon: 'ph-bold ph-plus-square', fill: 'ph-fill ph-plus-square' },
];

/* Below a phone width the sidebar gives way to the bar of five destinations. Create opens a
   dialog rather than going anywhere, so it is the one without an address. */
const DESTINATIONS: { id: string; label: string; icon: string; href?: string }[] = [
  { id: 'home', label: 'Home', icon: 'ph-bold ph-house', href: '#/' },
  { id: 'search', label: 'Search', icon: 'ph-bold ph-magnifying-glass', href: '#/search' },
  { id: 'create', label: 'Create', icon: 'ph-bold ph-plus-square' },
  { id: 'reels', label: 'Reels', icon: 'ph-bold ph-film-strip', href: '#/reels' },
  { id: 'profile', label: 'Profile', icon: 'ph-bold ph-user-circle', href: '#/profile' },
];

@Component({
  selector: 'app-post-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar, ArenaButton, ArenaDialog, ArenaIconButton, Carousel, Handle],
  host: { style: 'display: contents; --arena-dialog-width: min(calc(var(--sp-1) * 260), 94vw)' },
  template: `
    @if (post(); as post) {
      @let account = accounts[post.handle];
      <arena-dialog open [title]="'Post by ' + account.handle" (close)="close.emit()">
        <div class="detail">
          <div class="detail__media">
            <app-carousel [media]="post.media" [alt]="'Photo by ' + account.handle" />
          </div>

          <div class="detail__side">
            <header class="detail__head">
              <arena-avatar [name]="account.name" [src]="account.avatar" class="arena-size-sm" />
              <app-handle [handle]="post.handle" bold />
              <span class="post__gap"></span>
              <arena-button class="arena-emphasis-ghost arena-size-sm">Follow</arena-button>
            </header>

            <div class="detail__thread">
              <p class="post__comment">
                <app-handle [handle]="post.handle" bold /> {{ post.caption }}
              </p>
              @for (comment of post.comments; track comment.handle + comment.text) {
                <div class="thread">
                  <arena-avatar
                    [name]="accounts[comment.handle].name"
                    [src]="accounts[comment.handle].avatar"
                    class="arena-size-xs"
                  />
                  <div class="thread__body">
                    <p class="post__comment">
                      <app-handle [handle]="comment.handle" bold /> {{ comment.text }}
                    </p>
                    <p class="thread__meta">
                      <span>{{ comment.when }}</span>
                      <span>{{ comment.likes }} likes</span>
                      <span>Reply</span>
                    </p>
                  </div>
                  <arena-icon-button
                    icon="ph-bold ph-heart"
                    [label]="'Like the comment by ' + comment.handle"
                    class="arena-size-sm"
                  />
                </div>
              }
            </div>

            <footer class="detail__foot">
              <p class="post__likes"><strong>{{ writeCount(post.likes) }} likes</strong></p>
              <p class="post__when">{{ post.when }}</p>
              <div class="post__add">
                <input class="post__input" placeholder="Add a comment..." aria-label="Add a comment" />
                <arena-button class="arena-emphasis-ghost arena-size-sm">Post</arena-button>
              </div>
            </footer>
          </div>
        </div>
      </arena-dialog>
    }
  `,
})
export class PostDialog {
  readonly post = input.required<Post | null>();
  readonly close = output<void>();

  protected readonly accounts = ACCOUNTS;
  protected readonly writeCount = writeCount;
}

@Component({
  selector: 'app-create-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaButton, ArenaDialog, ArenaFileInput, ArenaFooter],
  host: { style: 'display: contents' },
  template: `
    <arena-dialog open title="Create new post" fillBelow="sm" (close)="close.emit()">
      <arena-file-input
        label="Photos and videos"
        [accept]="upload.accept"
        [maxSize]="upload.maxSize"
        multiple
        droppable
        [hint]="'Drag photos and videos here. Up to ' + upload.maxFiles + ', 30 MB each.'"
        [error]="tooMany() ? 'A post holds up to ' + upload.maxFiles + '. Remove ' + (held() - upload.maxFiles) + ' to share it.' : undefined"
        (change)="held.set($event.names.length)"
      />
      <arena-button footer [disabled]="held() === 0 || tooMany()" (click)="share()">Share</arena-button>
    </arena-dialog>
  `,
})
export class CreateDialog {
  readonly close = output<void>();

  private readonly picker = viewChild.required(ArenaFileInput);

  protected readonly upload = UPLOAD;
  protected readonly held = signal(0);
  protected readonly tooMany = computed(() => this.held() > UPLOAD.maxFiles);

  protected share(): void {
    this.picker().clear();
    this.close.emit();
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaAvatar,
    ArenaBottomNav,
    ArenaBottomNavItem,
    ArenaIcon,
    ArenaIconButton,
    CodeScreen,
    CreateDialog,
    FeedScreen,
    LogInScreen,
    PostDialog,
    ProfileScreen,
  ],
  host: { style: 'display: contents' },
  template: `
    @if (screen() === 'login') {
      <app-log-in-screen (logIn)="screen.set('code')" />
    } @else if (screen() === 'code') {
      <app-code-screen (verified)="verified()" (back)="screen.set('login')" />
    } @else {
      <div class="app" [attr.data-narrow]="narrow() ? 'yes' : 'no'">
        @if (narrow()) {
          <header class="top">
            <a class="nav__brand" href="#/" (click)="go('home')">
              <span class="nav__word">Instagram</span>
            </a>
            <span class="post__gap"></span>
            <arena-icon-button [icon]="themeIcon()" label="Appearance" (click)="toggleTheme()" />
            <arena-icon-button icon="ph-bold ph-heart" label="Notifications" />
          </header>
        } @else {
          <nav class="nav" aria-label="Primary">
            <a class="nav__brand" href="#/" (click)="screen.set('feed')">
              <img src="img/brand-glyph.svg" alt="" class="nav__glyph" />
              <span class="nav__word">Instagram</span>
            </a>

            <ul class="nav__list">
              @for (item of nav; track item.id) {
                <li>
                  <button
                    type="button"
                    class="nav__item"
                    [attr.aria-current]="active() === item.id ? 'page' : null"
                    (click)="go(item.id)"
                  >
                    <arena-icon [icon]="active() === item.id ? item.fill : item.icon" />
                    <span class="nav__label">{{ item.label }}</span>
                  </button>
                </li>
              }
              <li>
                <button
                  type="button"
                  class="nav__item"
                  [attr.aria-current]="screen() === 'profile' ? 'page' : null"
                  (click)="go('profile')"
                >
                  <arena-avatar [name]="me.name" [src]="me.avatar" class="arena-size-xs" />
                  <span class="nav__label">Profile</span>
                </button>
              </li>
            </ul>

            <div class="nav__foot">
              <button type="button" class="nav__item" (click)="toggleTheme()">
                <arena-icon [icon]="themeIcon()" />
                <span class="nav__label">Appearance</span>
              </button>
              <button type="button" class="nav__item">
                <arena-icon icon="ph-bold ph-list" />
                <span class="nav__label">More</span>
              </button>
            </div>
          </nav>
        }

        <main class="main">
          @if (screen() === 'feed') { <app-feed-screen (open)="open.set($event)" (switchAccount)="screen.set('login')" /> }
          @if (screen() === 'profile') { <app-profile-screen (openGrid)="openFromGrid($event)" /> }
        </main>

        @if (narrow()) {
          <arena-bottom-nav ariaLabel="Primary" [active]="active()" (nav)="go($event)">
            @for (item of destinations; track item.id) {
              <arena-bottom-nav-item [id]="item.id" [label]="item.label" [icon]="item.icon" [href]="item.href" />
            }
          </arena-bottom-nav>
        }

        <app-post-dialog [post]="open()" (close)="open.set(null)" />
        @if (creating()) { <app-create-dialog (close)="creating.set(false)" /> }
      </div>
    }
  `,
})
export class App {
  private readonly themes = inject(ArenaThemeService);
  private readonly asked = new URLSearchParams(window.location.search);

  protected readonly screen = signal<Screen>(SCREENS.find((one) => one === this.asked.get('screen')) ?? 'feed');
  protected readonly open = signal<Post | null>(this.asked.get('post') ? POSTS[0] : null);
  protected readonly active = signal(this.screen() === 'profile' ? 'profile' : 'home');
  protected readonly creating = signal(this.asked.has('create'));
  protected readonly narrow = arenaViewportBelow('md');

  protected readonly me = ME;
  protected readonly nav = NAV;
  protected readonly destinations = DESTINATIONS;

  protected readonly themeIcon = computed(() =>
    this.themes.theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon',
  );

  /* One router for both bars: the sidebar's rows and the bottom bar's destinations. */
  protected go(id: string): void {
    if (id === 'create') {
      this.creating.set(true);
      return;
    }
    this.active.set(id);
    if (id === 'home') this.screen.set('feed');
    if (id === 'profile') this.screen.set('profile');
  }

  protected verified(): void {
    this.active.set('home');
    this.screen.set('feed');
  }

  protected toggleTheme(): void {
    this.themes.set(this.themes.theme() === 'dark' ? 'light' : 'dark');
  }

  protected openFromGrid(grid: GridPost): void {
    this.open.set({ ...POSTS[0], media: [grid.src] });
  }
}
