import React from 'react';
import {
  ArenaButton,
  ArenaFigure,
  ArenaGrid,
  ArenaHero,
  ArenaSection,
} from '@dravensoft/arena-react';
import { ListingCard } from '../Pieces';
import { LISTINGS } from '../data/Shop';

const FRESH = LISTINGS.slice(0, 4);

export function HomeScreen({
  saved, onOpen, onSave, onShop,
}: {
  saved: string[];
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
  onShop: () => void;
}) {
  return (
    <div className="home arena-band">
      <ArenaHero
        eyebrow="The autumn edit"
        title="Made slowly, by the person who sells it"
        lede="Wool, oak, linen and clay from small workshops, each listing written by the hands that made the thing in it."
        actions={(
          <>
            <ArenaButton icon="ph-bold ph-storefront" className="arena-size-lg" onActivate={onShop}>
              Shop the autumn edit
            </ArenaButton>
            <ArenaButton iconRight="ph-bold ph-arrow-right" className="arena-emphasis-ghost arena-size-lg">
              Open a shop
            </ArenaButton>
          </>
        )}
        figure={<ArenaFigure media={<img src="img/p5.jpg" alt="A herringbone lambswool throw in moss and oat" />} />}
      />

      <ArenaSection title="Fresh from the workshops" eyebrow="New this week">
        <ArenaGrid>
          {FRESH.map((one) => (
            <ListingCard
              key={one.id}
              listing={one}
              saved={saved.includes(one.id)}
              onOpen={onOpen}
              onSave={onSave}
            />
          ))}
        </ArenaGrid>
      </ArenaSection>
    </div>
  );
}
