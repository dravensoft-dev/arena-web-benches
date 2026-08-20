import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  ArenaGrid,
  ArenaPagination,
  ArenaSegmentedControl,
  ArenaSelect,
  ArenaTag,
} from '@dravensoft/arena-angular';
import type { ArenaSegmentOption, ArenaSelectOption } from '@dravensoft/arena-angular';
import { ListingCard } from './pieces';
import { FACETS, LISTINGS } from '../data/Shop';

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

@Component({
  selector: 'app-search-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [ArenaGrid, ArenaPagination, ArenaSegmentedControl, ArenaSelect, ArenaTag, ListingCard],
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
            (change)="kind.set($event)"
          />
          <arena-select
            label="Sort by"
            [options]="sorts"
            [value]="sort()"
            (change)="sort.set($event)"
          />
        </div>
      </div>

      <div class="results__facets arena-row">
        @for (facet of facets; track facet.id) {
          <arena-tag
            [tone]="chosen().includes(facet.id) ? 'primary' : 'neutral'"
            [removable]="chosen().includes(facet.id)"
            (remove)="drop(facet.id)"
          >{{ facet.label }}</arena-tag>
        }
      </div>

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

      <div class="results__pages">
        <arena-pagination
          ariaLabel="Search results"
          [page]="page()"
          [pageCount]="12"
          (change)="page.set($event)"
        />
      </div>
    </div>
  `,
})
export class SearchScreen {
  readonly saved = input.required<readonly string[]>();
  readonly openListing = output<string>();
  readonly save = output<string>();

  protected readonly sorts = SORTS;
  protected readonly kinds = KINDS;
  protected readonly facets = FACETS;

  protected readonly sort = signal('relevance');
  protected readonly kind = signal('all');
  protected readonly chosen = signal<readonly string[]>(['delivery']);
  protected readonly page = signal(1);

  protected readonly shown = computed(() => {
    const list = [...LISTINGS];
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
