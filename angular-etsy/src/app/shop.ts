import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  ArenaActions,
  ArenaAppBar,
  ArenaBrand,
  ArenaButton,
  ArenaFooter,
  ArenaIconButton,
  ArenaInput,
  ArenaKeyValue,
  ArenaMain,
  ArenaNav,
  ArenaSheet,
  ArenaSiteFooter,
  ArenaSkipLink,
  ArenaThemeService,
} from '@dravensoft/arena-angular';
import type { ArenaKeyValueRow } from '@dravensoft/arena-angular';
import { SearchScreen } from './search-screen';
import { ListingScreen } from './listing-screen';
import { CATEGORIES, listing, money } from '../data/Shop';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [
    ArenaActions, ArenaAppBar, ArenaBrand, ArenaButton, ArenaFooter, ArenaIconButton,
    ArenaInput, ArenaKeyValue, ArenaMain, ArenaNav, ArenaSheet, ArenaSiteFooter,
    ArenaSkipLink, SearchScreen, ListingScreen,
  ],
  template: `
    <div class="arena-shell">
      <arena-skip-link label="Skip to results" />

      <arena-app-bar>
        <a brand class="brand" href="/" (click)="home($event)">
          <i class="ph-fill ph-storefront brand__glyph" aria-hidden="true"></i>
          <span class="brand__word">Maker&apos;s Row</span>
        </a>
        <div nav class="search">
          <arena-input
            label="Search for anything"
            icon="ph-bold ph-magnifying-glass"
            [value]="query()"
            (change)="query.set($event)"
          />
        </div>
        <div actions class="bar-actions">
          <arena-icon-button
            [icon]="theme() === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'"
            [label]="theme() === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'"
            (click)="themes.set(theme() === 'dark' ? 'light' : 'dark')"
          />
          <arena-icon-button icon="ph-bold ph-heart" label="Favourites" />
          <arena-icon-button
            icon="ph-bold ph-basket"
            [label]="'Basket, ' + basket().length + ' items'"
            (click)="cartOpen.set(true)"
          />
        </div>
      </arena-app-bar>

      <nav class="cats" aria-label="Departments">
        <ul class="cats__list">
          @for (one of categories; track one) {
            <li><a class="cats__link" [href]="'/c/' + one" (click)="$event.preventDefault()">{{ one }}</a></li>
          }
        </ul>
      </nav>

      <arena-main>
        <div class="arena-shell__main">
          @if (open(); as id) {
            <app-listing-screen
              [id]="id"
              [saved]="saved()"
              (openListing)="open.set($event || null)"
              (save)="toggleSaved($event)"
              (basket)="addToBasket($event)"
            />
          } @else {
            <app-search-screen
              [saved]="saved()"
              (openListing)="open.set($event)"
              (save)="toggleSaved($event)"
            />
          }
        </div>
      </arena-main>

      <arena-site-footer note="Every item on this page is made by the person selling it.">
        <div class="foot">
          <span class="foot__word">Maker&apos;s Row</span>
          <a class="foot__link" href="/help" (click)="$event.preventDefault()">Help</a>
          <a class="foot__link" href="/sell" (click)="$event.preventDefault()">Sell on Maker&apos;s Row</a>
          <a class="foot__link" href="/terms" (click)="$event.preventDefault()">Terms</a>
        </div>
      </arena-site-footer>

      <arena-sheet
        [open]="cartOpen()"
        placement="end"
        title="Your basket"
        dismissible
        (close)="cartOpen.set(false)"
      >
        @if (basket().length === 0) {
          <p class="basket__empty">Nothing in it yet.</p>
        } @else {
          <arena-key-value [rows]="rows()" [total]="total()" />
        }
        <div footer>
          <arena-button variant="primary" full>Go to checkout</arena-button>
        </div>
      </arena-sheet>
    </div>
  `,
})
export class Shop {
  protected readonly themes = inject(ArenaThemeService);
  protected readonly theme = this.themes.theme;
  protected readonly categories = CATEGORIES;

  protected readonly open = signal<string | null>(
    (() => {
      const match = /^\/listing\/([a-z0-9-]+)$/.exec(window.location.pathname);
      return match ? match[1]! : null;
    })(),
  );
  protected readonly saved = signal<readonly string[]>(['stoneware-mug']);
  protected readonly basket = signal<readonly string[]>([]);
  protected readonly cartOpen = signal(false);
  protected readonly query = signal('floating shelf');

  protected readonly rows = computed<ArenaKeyValueRow[]>(() =>
    this.basket().map((id) => ({ term: listing(id).title, value: money(listing(id).price), numeric: true })),
  );

  protected readonly total = computed<ArenaKeyValueRow>(() => ({
    term: 'Subtotal',
    value: money(this.basket().reduce((sum, id) => sum + listing(id).price, 0)),
    numeric: true,
  }));

  protected home(event: MouseEvent): void {
    event.preventDefault();
    this.open.set(null);
  }

  protected toggleSaved(id: string): void {
    const saved = this.saved();
    this.saved.set(saved.includes(id) ? saved.filter((one) => one !== id) : [...saved, id]);
  }

  protected addToBasket(id: string): void {
    this.basket.set([...this.basket(), id]);
    this.cartOpen.set(true);
  }
}
