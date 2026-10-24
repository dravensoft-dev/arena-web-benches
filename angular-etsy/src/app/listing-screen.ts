import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  ArenaAlert,
  ArenaAvatar,
  ArenaBadge,
  ArenaBreadcrumbs,
  ArenaButton,
  ArenaCombobox,
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
import { COUNTRIES, HOME_COUNTRY } from '../data/Countries';

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
    ArenaAlert, ArenaAvatar, ArenaBadge, ArenaBreadcrumbs, ArenaButton, ArenaCombobox, ArenaFigure,
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
            <arena-avatar [src]="one().shopAvatar" [name]="one().shop" class="arena-size-sm" />
            <span class="buy__shop-name">{{ one().shop }}</span>
            @if (one().mark === 'star-seller') {
              <arena-badge class="arena-accent-gold">Star Seller</arena-badge>
            }
          </div>

          <h1 class="buy__title">{{ one().title }}</h1>
          <app-stars [rating]="one().rating" [reviews]="one().reviews" />
          <app-price [price]="one().price" [was]="one().was" size="lg" />

          <arena-alert tone="warning" icon="ph-bold ph-fire">
            Only 3 left, and it is in 12 other baskets.
          </arena-alert>

          <arena-select label="Width" [options]="sizes" [value]="size()" (valueChange)="size.set($event)" />
          <arena-select label="Quantity" [options]="quantities" [value]="quantity()" (valueChange)="quantity.set($event)" />
          <arena-combobox
            label="Deliver to"
            placeholder="Search countries"
            icon="ph-bold ph-map-pin"
            required
            [options]="countries"
            [value]="country()"
            (valueChange)="country.set($event)"
          />

          <arena-button class="arena-fill" icon="ph-bold ph-basket" (activate)="basket.emit(one().id)">
            Add to basket
          </arena-button>
          <arena-button
            class="arena-emphasis-secondary arena-fill"
            [icon]="saved().includes(one().id) ? 'ph-fill ph-heart' : 'ph-bold ph-heart'"
            (activate)="save.emit(one().id)"
          >
            {{ saved().includes(one().id) ? 'Saved' : 'Save for later' }}
          </arena-button>

          <arena-key-value [rows]="rows()" [total]="total()" />
        </div>
      </div>

      @if (more().length) {
        <arena-section title="You may also like" eyebrow="Picked for you">
          <arena-scroller label="Items you may also like" class="arena-scroller-item-md">
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
  protected readonly countries = COUNTRIES;

  protected readonly shot = signal(0);
  protected readonly size = signal('80');
  protected readonly quantity = signal('1');
  protected readonly country = signal(HOME_COUNTRY);

  protected readonly one = computed(() => findListing(this.id()));
  protected readonly home = computed(() => this.country() === HOME_COUNTRY);
  protected readonly free = computed(() => this.one().freeDelivery && this.home());
  protected readonly more = computed(() => LISTINGS.filter((other) => other.id !== this.one().id).slice(0, 8));

  protected readonly trail = computed(() => [
    { label: 'Home and living', href: '/c/home' },
    { label: 'Storage', href: '/c/storage' },
    { label: this.one().title },
  ]);

  protected readonly rows = computed<ArenaKeyValueRow[]>(() => [
    { term: 'Delivery', value: this.free() ? 'Free' : money(this.home() ? 4.95 : 14.5), numeric: !this.free() },
    { term: 'Arrives', value: this.home() ? '18 to 24 September' : '29 September to 9 October' },
    { term: 'Returns', value: 'Accepted within 30 days' },
    { term: 'Ships from', value: this.one().madeIn },
  ]);

  protected readonly total = computed<ArenaKeyValueRow>(() => ({
    term: 'Total today',
    value: money(this.one().price * Number(this.quantity())),
    numeric: true,
  }));
}
