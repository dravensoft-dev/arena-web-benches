import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  ArenaGrid,
  ArenaPagination,
  ArenaSegmentedControl,
  ArenaSelect,
  ArenaSkeleton,
  ArenaSlider,
  ArenaTag,
} from '@dravensoft/arena-angular';
import type { ArenaSegmentOption, ArenaSelectOption } from '@dravensoft/arena-angular';
import { ListingCard } from './pieces';
import { CURRENCY, FACETS, LISTINGS } from '../data/Shop';

const SORTS: ArenaSelectOption[] = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'low', label: 'Lowest price' },
  { value: 'high', label: 'Highest price' },
  { value: 'new', label: 'Most recent' },
];

const KINDS: ArenaSegmentOption[] = [
  { value: 'all', label: 'All' },
  { value: 'handmade', label: 'Handmade' },
  { value: 'vintage', label: 'Vintage' },
];

const PRICE_FLOOR = 0;
const PRICE_CEILING = 250;

// As many placeholders as a first page holds, so the grid fills in rather than jumping.
const GHOSTS = [0, 1, 2, 3, 4, 5, 6, 7];

@Component({
  selector: 'app-search-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [
    ArenaGrid, ArenaPagination, ArenaSegmentedControl, ArenaSelect, ArenaSkeleton, ArenaSlider,
    ArenaTag, ListingCard,
  ],
  template: `
    <div class="results arena-band">
      <div class="results__head">
        <div class="results__count">
          <h1 class="results__title">Handmade shelves and wall storage</h1>
          <p class="results__sub">
            <span class="arena-num">{{ shown().length * 187 }}</span>
            {{ ' results, most of them from small workshops' }}
          </p>
        </div>
        <div class="results__sort">
          <arena-segmented-control
            ariaLabel="What kind of item"
            [options]="kinds"
            [value]="kind()"
            (valueChange)="kind.set($event)"
          />
          <arena-select
            label="Sort by"
            [options]="sorts"
            [value]="sort()"
            (valueChange)="sort.set($event)"
          />
        </div>
      </div>

      <div class="results__filters">
        <div class="results__facets arena-row">
          @for (facet of facets; track facet.id) {
            <arena-tag
              [class.arena-accent-primary]="chosen().includes(facet.id)"
              [removable]="chosen().includes(facet.id)"
              (remove)="drop(facet.id)"
            >{{ facet.label }}</arena-tag>
          }
        </div>
        <div class="results__price">
          <arena-slider
            label="Price"
            hint="Before delivery"
            range
            [min]="floor"
            [max]="ceiling"
            [step]="5"
            [valuePrefix]="currency"
            [value]="low()"
            [valueEnd]="high()"
            (valueChange)="low.set($event)"
            (valueEndChange)="high.set($event)"
          />
        </div>
      </div>

      @if (loading()) {
        <div role="status" aria-label="Loading results">
          <div aria-hidden="true">
            <arena-grid>
              @for (n of ghosts; track n) {
                <div class="ghost">
                  <arena-skeleton />
                  <arena-skeleton [lines]="3" />
                </div>
              }
            </arena-grid>
          </div>
        </div>
      } @else if (shown().length) {
        <arena-grid>
          @for (one of shown(); track one.id) {
            <app-listing-card
              [listing]="one"
              [saved]="saved().includes(one.id)"
              (openListing)="openListing.emit($event)"
              (save)="save.emit($event)"
            />
          }
        </arena-grid>
      } @else {
        <p class="results__none">Nothing made in that price range yet.</p>
      }

      <div class="results__pages">
        <arena-pagination
          ariaLabel="Search results"
          [page]="page()"
          [pageCount]="12"
          (valueChange)="page.set($event)"
        />
      </div>
    </div>
  `,
})
export class SearchScreen {
  readonly loading = input.required<boolean>();
  readonly saved = input.required<readonly string[]>();
  readonly openListing = output<string>();
  readonly save = output<string>();

  protected readonly sorts = SORTS;
  protected readonly kinds = KINDS;
  protected readonly facets = FACETS;
  protected readonly ghosts = GHOSTS;
  protected readonly floor = PRICE_FLOOR;
  protected readonly ceiling = PRICE_CEILING;
  protected readonly currency = CURRENCY;

  protected readonly sort = signal('relevance');
  protected readonly kind = signal('all');
  protected readonly chosen = signal<readonly string[]>(['delivery']);
  protected readonly page = signal(1);
  protected readonly low = signal(PRICE_FLOOR);
  protected readonly high = signal(PRICE_CEILING);

  protected readonly shown = computed(() => {
    const low = this.low();
    const high = this.high();
    const list = LISTINGS.filter((one) => one.price >= low && one.price <= high);
    const facets = this.chosen();
    const sort = this.sort();
    if (facets.includes('delivery')) return list.filter((one) => one.freeDelivery);
    if (sort === 'low') return list.sort((a, b) => a.price - b.price);
    if (sort === 'high') return list.sort((a, b) => b.price - a.price);
    return list;
  });

  protected drop(id: string): void {
    this.chosen.set(this.chosen().filter((one) => one !== id));
  }
}
