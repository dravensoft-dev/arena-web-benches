import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import {
  ArenaAvatar,
  ArenaButton,
  ArenaDialog,
  ArenaIconButton,
  ArenaThemeService,
} from '@dravensoft/arena-angular';
import { Carousel, Handle } from './Pieces';
import { FeedScreen } from './screens/FeedScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ACCOUNTS, ME, POSTS, writeCount } from './data/Feed';
import type { GridPost, Post } from './data/Feed';

type Screen = 'feed' | 'profile';

type NavEntry = { id: string; label: string; icon: string; fill: string; screen?: Screen };

const NAV: NavEntry[] = [
  { id: 'home', label: 'Home', icon: 'ph-bold ph-house', fill: 'ph-fill ph-house', screen: 'feed' },
  { id: 'search', label: 'Search', icon: 'ph-bold ph-magnifying-glass', fill: 'ph-fill ph-magnifying-glass' },
  { id: 'explore', label: 'Explore', icon: 'ph-bold ph-compass', fill: 'ph-fill ph-compass' },
  { id: 'reels', label: 'Reels', icon: 'ph-bold ph-film-strip', fill: 'ph-fill ph-film-strip' },
  { id: 'messages', label: 'Messages', icon: 'ph-bold ph-paper-plane-tilt', fill: 'ph-fill ph-paper-plane-tilt' },
  { id: 'notifications', label: 'Notifications', icon: 'ph-bold ph-heart', fill: 'ph-fill ph-heart' },
  { id: 'create', label: 'Create', icon: 'ph-bold ph-plus-square', fill: 'ph-fill ph-plus-square' },
];

@Component({
  selector: 'app-post-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar, ArenaButton, ArenaDialog, ArenaIconButton, Carousel, Handle],
  host: { style: 'display: contents' },
  template: `
    @if (post(); as post) {
      @let account = accounts[post.handle];
      <arena-dialog open [title]="'Post by ' + account.handle" width="min(1040px, 94vw)" (close)="close.emit()">
        <div class="detail">
          <div class="detail__media">
            <app-carousel [media]="post.media" [alt]="'Photo by ' + account.handle" />
          </div>

          <div class="detail__side">
            <header class="detail__head">
              <arena-avatar [name]="account.name" [src]="account.avatar" size="sm" />
              <app-handle [handle]="post.handle" bold />
              <span class="post__gap"></span>
              <arena-button variant="ghost" size="sm">Follow</arena-button>
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
                    size="xs"
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
                    size="sm"
                  />
                </div>
              }
            </div>

            <footer class="detail__foot">
              <p class="post__likes"><strong>{{ writeCount(post.likes) }} likes</strong></p>
              <p class="post__when">{{ post.when }}</p>
              <div class="post__add">
                <input class="post__input" placeholder="Add a comment..." aria-label="Add a comment" />
                <arena-button variant="ghost" size="sm">Post</arena-button>
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
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar, FeedScreen, PostDialog, ProfileScreen],
  host: { class: 'app' },
  template: `
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
              (click)="pick(item)"
            >
              <i [class]="active() === item.id ? item.fill : item.icon" aria-hidden="true"></i>
              <span class="nav__label">{{ item.label }}</span>
            </button>
          </li>
        }
        <li>
          <button
            type="button"
            class="nav__item"
            [attr.aria-current]="screen() === 'profile' ? 'page' : null"
            (click)="showProfile()"
          >
            <arena-avatar [name]="me.name" [src]="me.avatar" size="xs" />
            <span class="nav__label">Profile</span>
          </button>
        </li>
      </ul>

      <div class="nav__foot">
        <button type="button" class="nav__item" (click)="toggleTheme()">
          <i [class]="themeIcon()" aria-hidden="true"></i>
          <span class="nav__label">Appearance</span>
        </button>
        <button type="button" class="nav__item">
          <i class="ph-bold ph-list" aria-hidden="true"></i>
          <span class="nav__label">More</span>
        </button>
      </div>
    </nav>

    <main class="main">
      @if (screen() === 'feed') { <app-feed-screen (open)="open.set($event)" /> }
      @if (screen() === 'profile') { <app-profile-screen (openGrid)="openFromGrid($event)" /> }
    </main>

    <app-post-dialog [post]="open()" (close)="open.set(null)" />
  `,
})
export class App {
  private readonly themes = inject(ArenaThemeService);
  private readonly asked = new URLSearchParams(window.location.search);

  protected readonly screen = signal<Screen>(this.asked.get('screen') === 'profile' ? 'profile' : 'feed');
  protected readonly open = signal<Post | null>(this.asked.get('post') ? POSTS[0] : null);
  protected readonly active = signal('home');

  protected readonly me = ME;
  protected readonly nav = NAV;

  protected readonly themeIcon = computed(() =>
    this.themes.theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon',
  );

  protected pick(item: NavEntry): void {
    this.active.set(item.id);
    if (item.screen) this.screen.set(item.screen);
  }

  protected showProfile(): void {
    this.active.set('profile');
    this.screen.set('profile');
  }

  protected toggleTheme(): void {
    this.themes.set(this.themes.theme() === 'dark' ? 'light' : 'dark');
  }

  protected openFromGrid(grid: GridPost): void {
    this.open.set({ ...POSTS[0], media: [grid.src] });
  }
}
