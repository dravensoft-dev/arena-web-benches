import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ArenaAvatar, ArenaIconButton } from '@dravensoft/arena-angular';
import type { ArenaAvatarSize } from '@dravensoft/arena-angular';
import { ACCOUNTS } from './data/Feed';

/* A story ring is a gradient stroke around an avatar, and its state is whether it has been
   opened. Arena's avatar has a status dot and no ring, so the ring is drawn here. */
@Component({
  selector: 'app-story-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar],
  host: { style: 'display: contents' },
  template: `
    <button type="button" class="story" [attr.data-seen]="seen() ? 'yes' : 'no'" [attr.data-size]="size()">
      <span class="story__ring">
        <span class="story__inner">
          <arena-avatar [name]="account().name" [src]="account().avatar" [size]="face()" />
        </span>
        @if (live()) { <span class="story__live">LIVE</span> }
      </span>
      <span class="story__name">{{ label() ?? account().handle }}</span>
    </button>
  `,
})
export class StoryRing {
  readonly handle = input.required<string>();
  readonly seen = input(false, { transform: booleanAttribute });
  readonly live = input(false, { transform: booleanAttribute });
  readonly size = input<'md' | 'lg'>('md');
  readonly label = input<string | undefined>(undefined);

  protected readonly account = computed(() => ACCOUNTS[this.handle()]);
  protected readonly face = computed<ArenaAvatarSize>(() => (this.size() === 'lg' ? 'lg' : 'md'));
}

@Component({
  selector: 'app-handle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'handle', '[attr.data-bold]': `bold() ? 'yes' : 'no'` },
  template: `{{ account().handle }}@if (account().verified) {<i class="ph-fill ph-seal-check handle__tick" aria-hidden="true" title="Verified"></i>}`,
})
export class Handle {
  readonly handle = input.required<string>();
  readonly bold = input(false, { transform: booleanAttribute });

  protected readonly account = computed(() => ACCOUNTS[this.handle()]);
}

/* A post carousel is a slideshow with a position indicator. ArenaScroller is deliberately
   not one: it is an honest scrolling row with no arrows and no dots. */
@Component({
  selector: 'app-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaIconButton],
  host: { class: 'carousel' },
  template: `
    <div class="carousel__frame">
      <img [src]="media()[index()]" [alt]="alt()" class="carousel__img" />
      @if (many() && index() > 0) {
        <span class="carousel__nav carousel__nav--prev">
          <arena-icon-button icon="ph-bold ph-caret-left" label="Previous photo" size="sm" (click)="index.set(index() - 1)" />
        </span>
      }
      @if (many() && index() < media().length - 1) {
        <span class="carousel__nav carousel__nav--next">
          <arena-icon-button icon="ph-bold ph-caret-right" label="Next photo" size="sm" (click)="index.set(index() + 1)" />
        </span>
      }
      @if (many()) { <span class="carousel__count arena-num">{{ index() + 1 }}/{{ media().length }}</span> }
    </div>
    @if (many()) {
      <div class="carousel__dots" role="tablist" aria-label="Photos in this post">
        @for (src of media(); track src; let i = $index) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="i === index()"
            [attr.aria-label]="'Photo ' + (i + 1)"
            class="carousel__dot"
            (click)="index.set(i)"
          ></button>
        }
      </div>
    }
  `,
})
export class Carousel {
  readonly media = input.required<readonly string[]>();
  readonly alt = input.required<string>();

  protected readonly index = signal(0);
  protected readonly many = computed(() => this.media().length > 1);
}
