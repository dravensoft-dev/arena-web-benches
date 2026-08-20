import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  ArenaAlert,
  ArenaAvatar,
  ArenaBadge,
  ArenaBreadcrumbs,
  ArenaButton,
  ArenaFigure,
  ArenaKeyValue,
  ArenaMedia,
  ArenaOverlay,
  ArenaScroller,
  ArenaScrollerItem,
  ArenaSection,
  ArenaSelect,
} from '@dravensoft/arena-angular';
import type { ArenaKeyValueRow, ArenaSelectOption } from '@dravensoft/arena-angular';
import { ListingCard, Mark, Price, Stars } from './pieces';
import { LISTINGS, listing as findListing, money } from '../data/Shop';

const SIZES: ArenaSelectOption[] = [
  { value: '60', label: '60 cm' },
  { value: '80', label: '80 cm' },
  { value: '100', label: '100 cm' },
];

const QUANTITIES: ArenaSelectOption[] = ['1', '2', '3', '4'].map((value) => ({ value, label: value }));

@Component({
  selector: 'app-listing-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [
    ArenaAlert, ArenaAvatar, ArenaBadge, ArenaBreadcrumbs, ArenaButton, ArenaFigure,
    ArenaKeyValue, ArenaMedia, ArenaOverlay, ArenaScroller, ArenaScrollerItem,
    ArenaSection, ArenaSelect, ListingCard, Mark, Price, Stars,
  ],
  template: `
    <div class="listing arena-band">
      <arena-breadcrumbs
        ariaLabel="Where this item sits"
        [items]="trail()"
        (navigate)="openListing.emit('')"
      />

      <div class="listing__cols">
        <div class="listing__gallery">
          <div class="thumbs">
            @for (src of one().gallery; track src; let index = $index) {
              <button
                type="button"
                class="thumbs__one"
                [attr.aria-current]="index === shot() ? 'true' : null"
                (click)="shot.set(index)"
              >
                <img [src]="src" [alt]="one().title + ', view ' + (index + 1)" />
                <span class="arena-sr-only">{{ 'Show view ' + (index + 1) }}</span>
              </button>
            }
          </div>
          <div class="listing__shot">
            <arena-figure [caption]="'Made in ' + one().madeIn">
              <img media [src]="one().gallery[shot()]" [alt]="one().title" />
              @if (one().mark; as kind) {
                <app-mark overlay [kind]="kind" />
              }
            </arena-figure>
          </div>
        </div>

        <div class="buy arena-stack">
          <div class="buy__shop">
            <arena-avatar [src]="one().shopAvatar" [name]="one().shop" size="sm" />
            <span class="buy__shop-name">{{ one().shop }}</span>
            @if (one().mark === 'star-seller') {
              <arena-badge tone="gold">Star Seller</arena-badge>
            }
          </div>

          <h1 class="buy__title">{{ one().title }}</h1>
          <app-stars [rating]="one().rating" [reviews]="one().reviews" />
          <app-price [price]="one().price" [was]="one().was" size="lg" />

          <arena-alert tone="warning" icon="ph-bold ph-fire">
            Only 3 left, and it is in 12 other baskets.
          </arena-alert>

          <arena-select label="Width" [options]="sizes" [value]="size()" (change)="size.set($event)" />
          <arena-select label="Quantity" [options]="quantities" [value]="quantity()" (change)="quantity.set($event)" />

          <arena-button variant="primary" full icon="ph-bold ph-basket" (click)="basket.emit(one().id)">
            Add to basket
          </arena-button>
          <arena-button
            variant="secondary"
            full
            [icon]="saved().includes(one().id) ? 'ph-fill ph-heart' : 'ph-bold ph-heart'"
            (click)="save.emit(one().id)"
          >
            {{ saved().includes(one().id) ? 'Saved' : 'Save for later' }}
          </arena-button>

          <arena-key-value [rows]="rows()" [total]="total()" />
        </div>
      </div>

      @if (more().length) {
        <arena-section title="You may also like" eyebrow="Picked for you">
          <arena-scroller label="Items you may also like" itemWidth="var(--grid-min)">
            @for (other of more(); track other.id) {
              <arena-scroller-item>
                <app-listing-card
                  [listing]="other"
                  [saved]="saved().includes(other.id)"
                  (openListing)="openListing.emit($event)"
                  (save)="save.emit($event)"
                />
              </arena-scroller-item>
            }
          </arena-scroller>
        </arena-section>
      }
    </div>
  `,
})
export class ListingScreen {
  readonly id = input.required<string>();
  readonly saved = input.required<readonly string[]>();
  readonly openListing = output<string>();
  readonly save = output<string>();
  readonly basket = output<string>();

  protected readonly sizes = SIZES;
  protected readonly quantities = QUANTITIES;

  protected readonly shot = signal(0);
  protected readonly size = signal('80');
  protected readonly quantity = signal('1');

  protected readonly one = computed(() => findListing(this.id()));
  protected readonly more = computed(() => LISTINGS.filter((other) => other.id !== this.one().id).slice(0, 8));

  protected readonly trail = computed(() => [
    { label: 'Home and living', href: '/c/home' },
    { label: 'Storage', href: '/c/storage' },
    { label: this.one().title },
  ]);

  protected readonly rows = computed<ArenaKeyValueRow[]>(() => [
    { term: 'Delivery', value: this.one().freeDelivery ? 'Free' : money(4.95), numeric: !this.one().freeDelivery },
    { term: 'Arrives', value: '18 to 24 September' },
    { term: 'Returns', value: 'Accepted within 30 days' },
    { term: 'Ships from', value: this.one().madeIn },
  ]);

  protected readonly total = computed<ArenaKeyValueRow>(() => ({
    term: 'Total today',
    value: money(this.one().price * Number(this.quantity())),
    numeric: true,
  }));
}
