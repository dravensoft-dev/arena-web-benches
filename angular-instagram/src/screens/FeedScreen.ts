import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  ArenaAction,
  ArenaAvatar,
  ArenaButton,
  ArenaIconButton,
  ArenaMenu,
  ArenaPeopleList,
  ArenaPersonRow,
  ArenaScroller,
  ArenaScrollerItem,
} from '@dravensoft/arena-angular';
import type { ArenaMenuItem } from '@dravensoft/arena-angular';
import { Carousel, Handle, StoryRing } from '../Pieces';
import { ACCOUNTS, ME, POSTS, STORIES, SUGGESTIONS, writeCount } from '../data/Feed';
import type { Post } from '../data/Feed';

const POST_MENU: ArenaMenuItem[] = [
  { label: 'Report', icon: 'ph-bold ph-flag', destructive: true },
  { label: 'Unfollow', icon: 'ph-bold ph-user-minus', destructive: true },
  { divider: true },
  { label: 'Add to favourites', icon: 'ph-bold ph-star' },
  { label: 'Go to post', icon: 'ph-bold ph-arrow-square-out' },
  { label: 'Copy link', icon: 'ph-bold ph-link' },
];

@Component({
  selector: 'app-post-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaButton, ArenaIconButton, ArenaMenu, Carousel, Handle, StoryRing],
  host: { style: 'display: contents' },
  template: `
    <article class="post">
      <header class="post__head">
        <app-story-ring [handle]="post().handle" size="md" label="" />
        <span class="post__who">
          <span class="post__line">
            <app-handle [handle]="post().handle" bold />
            <span class="post__dot">&middot;</span>
            <span class="post__when">{{ post().when }}</span>
          </span>
          @if (post().place) { <span class="post__place">{{ post().place }}</span> }
        </span>
        <span class="post__gap"></span>
        <arena-menu align="end" [items]="menu">
          <arena-icon-button
            trigger
            icon="ph-bold ph-dots-three"
            [label]="'Options for ' + account().handle"
            class="arena-size-sm"
          />
        </arena-menu>
      </header>

      <app-carousel [media]="post().media" [alt]="'Photo by ' + account().handle" />

      <div class="post__actions">
        <button
          type="button"
          class="act"
          [attr.data-on]="liked() ? 'yes' : 'no'"
          [attr.aria-pressed]="liked()"
          (click)="liked.set(!liked())"
        >
          <i [class]="liked() ? 'ph-fill ph-heart' : 'ph-bold ph-heart'" aria-hidden="true"></i>
          <span class="arena-sr-only">Like</span>
        </button>
        <button type="button" class="act" (click)="open.emit(post())">
          <i class="ph-bold ph-chat-circle" aria-hidden="true"></i>
          <span class="arena-sr-only">Comment</span>
        </button>
        <button type="button" class="act">
          <i class="ph-bold ph-paper-plane-tilt" aria-hidden="true"></i>
          <span class="arena-sr-only">Share</span>
        </button>
        <span class="post__gap"></span>
        <button
          type="button"
          class="act"
          [attr.data-on]="saved() ? 'yes' : 'no'"
          [attr.aria-pressed]="saved()"
          (click)="saved.set(!saved())"
        >
          <i [class]="saved() ? 'ph-fill ph-bookmark-simple' : 'ph-bold ph-bookmark-simple'" aria-hidden="true"></i>
          <span class="arena-sr-only">Save</span>
        </button>
      </div>

      <div class="post__body">
        <p class="post__likes">
          Liked by <app-handle [handle]="post().likedBy" bold /> and <strong>{{ writeCount(likes()) }} others</strong>
        </p>
        <p class="post__caption">
          <app-handle [handle]="post().handle" bold /> {{ post().caption }}
        </p>
        <button type="button" class="post__more" (click)="open.emit(post())">
          View all {{ post().comments.length }} comments
        </button>
        @for (comment of post().comments.slice(0, 2); track comment.handle + comment.text) {
          <p class="post__comment">
            <app-handle [handle]="comment.handle" bold /> {{ comment.text }}
          </p>
        }
        <div class="post__add">
          <input class="post__input" placeholder="Add a comment..." aria-label="Add a comment" />
          <arena-button class="arena-emphasis-ghost arena-size-sm">Post</arena-button>
        </div>
      </div>
    </article>
  `,
})
export class PostCard {
  readonly post = input.required<Post>();
  readonly open = output<Post>();

  protected readonly liked = signal(false);
  protected readonly saved = signal(false);
  protected readonly menu = POST_MENU;
  protected readonly writeCount = writeCount;

  protected readonly account = computed(() => ACCOUNTS[this.post().handle]);
  protected readonly likes = computed(() => {
    const post = this.post();
    const liked = this.liked();
    return post.likes + (liked && !post.liked ? 1 : 0) - (!liked && post.liked ? 1 : 0);
  });

  constructor() {
    queueMicrotask(() => {
      this.liked.set(this.post().liked);
      this.saved.set(this.post().saved);
    });
  }
}

@Component({
  selector: 'app-feed-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ArenaAction,
    ArenaAvatar,
    ArenaButton,
    ArenaPeopleList,
    ArenaPersonRow,
    ArenaScroller,
    ArenaScrollerItem,
    Handle,
    PostCard,
    StoryRing,
  ],
  host: { class: 'feed' },
  template: `
    <div class="feed__col">
      <div class="rail" style="--arena-scroller-item: var(--sp-20)">
        <arena-scroller label="Stories" behaviour="snap">
          @for (story of stories; track story.handle) {
            <arena-scroller-item>
              <app-story-ring [handle]="story.handle" [seen]="story.seen" [live]="story.live" />
            </arena-scroller-item>
          }
        </arena-scroller>
      </div>

      @for (post of posts; track post.id) {
        <app-post-card [post]="post" (open)="open.emit($event)" />
      }
    </div>

    <aside class="aside">
      <div class="aside__me">
        <arena-avatar [name]="me.name" [src]="me.avatar" class="arena-size-lg" />
        <span class="aside__me-text">
          <app-handle [handle]="me.handle" bold />
          <span class="aside__me-name">{{ me.name }}</span>
        </span>
        <arena-button class="arena-emphasis-ghost arena-size-sm">Switch</arena-button>
      </div>

      <div class="aside__head">
        <span class="aside__title">Suggested for you</span>
        <arena-button class="arena-emphasis-ghost arena-size-sm">See all</arena-button>
      </div>

      <arena-people-list label="Suggested accounts">
        @for (handle of suggestions; track handle) {
          <arena-person-row [name]="handle" [src]="accounts[handle].avatar" secondary="Followed by marisol.b">
            <arena-button action class="arena-emphasis-ghost arena-size-sm">Follow</arena-button>
          </arena-person-row>
        }
      </arena-people-list>

      <p class="aside__legal">
        About &middot; Help &middot; Press &middot; API &middot; Jobs &middot; Privacy &middot; Terms
        <br />
        &copy; 2026 Instagram from Meta
      </p>
    </aside>
  `,
})
export class FeedScreen {
  readonly open = output<Post>();

  protected readonly accounts = ACCOUNTS;
  protected readonly me = ME;
  protected readonly posts = POSTS;
  protected readonly stories = STORIES;
  protected readonly suggestions = SUGGESTIONS;
}
