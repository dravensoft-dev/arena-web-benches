import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  ArenaActions,
  ArenaButton,
  ArenaFigure,
  ArenaFigureSlot,
  ArenaGrid,
  ArenaHero,
  ArenaMedia,
  ArenaSection,
} from '@dravensoft/arena-angular';
import { ListingCard } from './pieces';
import { LISTINGS } from '../data/Shop';

const FRESH = LISTINGS.slice(0, 4);

@Component({
  selector: 'app-home-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [
    ArenaActions, ArenaButton, ArenaFigure, ArenaFigureSlot, ArenaGrid, ArenaHero, ArenaMedia,
    ArenaSection, ListingCard,
  ],
  template: `
    <div class="home arena-band">
      <arena-hero
        eyebrow="The autumn edit"
        title="Made slowly, by the person who sells it"
        lede="Wool, oak, linen and clay from small workshops, each listing written by the hands that made the thing in it."
      >
        <arena-button actions icon="ph-bold ph-storefront" class="arena-size-lg" (click)="shop.emit()">
          Shop the autumn edit
        </arena-button>
        <arena-button actions iconRight="ph-bold ph-arrow-right" class="arena-emphasis-ghost arena-size-lg">
          Open a shop
        </arena-button>
        <arena-figure figure>
          <img media src="img/p5.jpg" alt="A herringbone lambswool throw in moss and oat" />
        </arena-figure>
      </arena-hero>

      <arena-section title="Fresh from the workshops" eyebrow="New this week">
        <arena-grid>
          @for (one of fresh; track one.id) {
            <app-listing-card
              [listing]="one"
              [saved]="saved().includes(one.id)"
              (openListing)="openListing.emit($event)"
              (save)="save.emit($event)"
            />
          }
        </arena-grid>
      </arena-section>
    </div>
  `,
})
export class HomeScreen {
  readonly saved = input.required<readonly string[]>();
  readonly openListing = output<string>();
  readonly save = output<string>();
  readonly shop = output<void>();

  protected readonly fresh = FRESH;
}
