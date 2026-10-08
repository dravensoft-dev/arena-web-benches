import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { ArenaAvatar, ArenaButton, ArenaIconButton } from '@dravensoft/arena-angular';
import { Handle } from '../Pieces';
import { ACCOUNTS, HIGHLIGHTS, PROFILE_GRID, writeCount } from '../data/Feed';
import type { GridPost } from '../data/Feed';

const TABS = [
  { id: 'posts', label: 'Posts', icon: 'ph-bold ph-squares-four' },
  { id: 'reels', label: 'Reels', icon: 'ph-bold ph-film-strip' },
  { id: 'saved', label: 'Saved', icon: 'ph-bold ph-bookmark-simple' },
  { id: 'tagged', label: 'Tagged', icon: 'ph-bold ph-user-square' },
];

const KIND_ICON: Record<GridPost['kind'], string> = {
  carousel: 'ph-fill ph-copy',
  reel: 'ph-fill ph-film-strip',
  single: '',
};

@Component({
  selector: 'app-profile-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar, ArenaButton, ArenaIconButton, Handle],
  host: { class: 'profile' },
  template: `
    <header class="profile__head">
      <div class="profile__avatar">
        <arena-avatar [name]="account.name" [src]="account.avatar" class="arena-size-lg" />
      </div>

      <div class="profile__meta">
        <div class="profile__row">
          <app-handle [handle]="account.handle" />
          <arena-button class="arena-size-sm">Follow</arena-button>
          <arena-button class="arena-emphasis-secondary arena-size-sm">Message</arena-button>
          <arena-icon-button icon="ph-bold ph-user-plus" label="Add to close friends" class="arena-size-sm" />
          <arena-icon-button icon="ph-bold ph-dots-three" label="More options" class="arena-size-sm" />
        </div>

        <ul class="profile__stats">
          <li><strong class="arena-num">248</strong> posts</li>
          <li><strong class="arena-num">{{ writeCount(64200) }}</strong> followers</li>
          <li><strong class="arena-num">312</strong> following</li>
        </ul>

        <div class="profile__bio">
          <p class="profile__name">{{ account.name }}</p>
          <p class="profile__blurb">
            Undyed wool, spun in small runs. Reykjavik and Porto.
            <br />
            Winter collection opens 3 September.
          </p>
          <a class="profile__link" href="#/shop">atlasknitwear.example</a>
        </div>
      </div>
    </header>

    <div class="hl">
      @for (highlight of highlights; track highlight.id) {
        <button type="button" class="hl__item">
          <span class="hl__ring"><img [src]="highlight.src" alt="" class="hl__img" /></span>
          <span class="hl__label">{{ highlight.label }}</span>
        </button>
      }
      <button type="button" class="hl__item">
        <span class="hl__ring hl__ring--new"><i class="ph-bold ph-plus" aria-hidden="true"></i></span>
        <span class="hl__label">New</span>
      </button>
    </div>

    <nav class="ptabs" aria-label="Profile sections">
      @for (entry of tabs; track entry.id) {
        <button
          type="button"
          class="ptabs__tab"
          [attr.aria-current]="tab() === entry.id ? 'page' : null"
          (click)="tab.set(entry.id)"
        >
          <i class="{{ entry.icon }} ptabs__icon" aria-hidden="true"></i>
          {{ entry.label }}
        </button>
      }
    </nav>

    <div class="grid">
      @for (post of grid; track post.id) {
        <button type="button" class="cell" (click)="openGrid.emit(post)">
          <img [src]="post.src" alt="" class="cell__img" />
          @if (kindIcon[post.kind]) {
            <i class="{{ kindIcon[post.kind] }} cell__kind" aria-hidden="true"></i>
          }
          <span class="cell__over">
            <span class="cell__stat"><i class="ph-fill ph-heart" aria-hidden="true"></i>{{ writeCount(post.likes) }}</span>
            <span class="cell__stat"><i class="ph-fill ph-chat-circle" aria-hidden="true"></i>{{ post.comments }}</span>
          </span>
        </button>
      }
    </div>
  `,
})
export class ProfileScreen {
  readonly openGrid = output<GridPost>();

  protected readonly tab = signal('posts');
  protected readonly account = ACCOUNTS['atlas.knits'];
  protected readonly grid = PROFILE_GRID;
  protected readonly highlights = HIGHLIGHTS;
  protected readonly kindIcon = KIND_ICON;
  protected readonly tabs = TABS;
  protected readonly writeCount = writeCount;
}
