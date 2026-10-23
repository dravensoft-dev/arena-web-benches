import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ArenaFigure, ArenaIcon, ArenaMedia, ArenaOverlay, isArenaPrimaryActivation } from '@dravensoft/arena-angular';
import { money, reviewCount } from '../data/Shop';
import type { Listing } from '../data/Shop';

const MARK_LABEL: Record<string, string> = {
  sale: 'Sale',
  bestseller: 'Bestseller',
  'star-seller': 'Star Seller',
};

@Component({
  selector: 'app-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<span class="mark" [attr.data-kind]="kind()">{{ label() }}</span>`,
})
export class Mark {
  readonly kind = input.required<NonNullable<Listing['mark']>>();
  protected readonly label = computed(() => MARK_LABEL[this.kind()]);
}

@Component({
  selector: 'app-stars',
  imports: [ArenaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <span class="stars">
      <span class="arena-sr-only">{{ 'Rated ' + rating() + ' out of 5 from ' + reviews() + ' reviews' }}</span>
      <span class="stars__row" aria-hidden="true">
        @for (n of [0, 1, 2, 3, 4]; track n) {
          <arena-icon [icon]="n < whole() ? 'ph-fill ph-star' : 'ph-bold ph-star'" />
        }
      </span>
      <span class="stars__count arena-num" aria-hidden="true">{{ '(' + count() + ')' }}</span>
    </span>
  `,
})
export class Stars {
  readonly rating = input.required<number>();
  readonly reviews = input.required<number>();
  protected readonly whole = computed(() => Math.floor(this.rating()));
  protected readonly count = computed(() => reviewCount(this.reviews()));
}

@Component({
  selector: 'app-price',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <span class="price" [attr.data-size]="size()">
      <span class="price__now arena-num" [attr.data-cut]="was() ? 'yes' : 'no'">{{ now() }}</span>
      @if (was()) {
        <s class="price__was arena-num">{{ then() }}</s>
        <span class="price__off">{{ off() }}</span>
      }
    </span>
  `,
})
export class Price {
  readonly price = input.required<number>();
  readonly was = input<number | undefined>(undefined);
  readonly size = input<'sm' | 'lg'>('sm');
  protected readonly now = computed(() => money(this.price()));
  protected readonly then = computed(() => money(this.was() ?? 0));
  protected readonly off = computed(
    () => `${Math.round((1 - this.price() / (this.was() ?? 1)) * 100)}% off`,
  );
}

@Component({
  selector: 'app-listing-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [ArenaFigure, ArenaIcon, ArenaMedia, ArenaOverlay, Mark, Stars, Price],
  template: `
    <article class="card">
      <a class="card__link" [href]="'/listing/' + listing().id" (click)="open($event)">
        <arena-figure>
          <img media [src]="listing().img" [alt]="listing().title" loading="lazy" />
          @if (listing().mark; as kind) {
            <app-mark overlay [kind]="kind" />
          }
        </arena-figure>
        <span class="card__body">
          <span class="card__title">{{ listing().title }}</span>
          <app-stars [rating]="listing().rating" [reviews]="listing().reviews" />
          <app-price [price]="listing().price" [was]="listing().was" />
          <span class="card__shop">{{ listing().shop }}</span>
          @if (listing().freeDelivery) {
            <span class="card__ship">Free delivery</span>
          }
        </span>
      </a>
      <button type="button" class="save" [attr.aria-pressed]="saved()" (click)="save.emit(listing().id)">
        <arena-icon [icon]="saved() ? 'ph-fill ph-heart' : 'ph-bold ph-heart'" />
        <span class="arena-sr-only">
          {{ saved() ? 'Remove ' + listing().title + ' from favourites' : 'Add ' + listing().title + ' to favourites' }}
        </span>
      </button>
    </article>
  `,
})
export class ListingCard {
  readonly listing = input.required<Listing>();
  readonly saved = input.required<boolean>();
  readonly openListing = output<string>();
  readonly save = output<string>();

  protected open(event: MouseEvent): void {
    if (!isArenaPrimaryActivation(event)) return;
    event.preventDefault();
    this.openListing.emit(this.listing().id);
  }
}
