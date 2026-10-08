import React, { useState } from 'react';
import {
  ArenaAlert,
  ArenaAvatar,
  ArenaBadge,
  ArenaBreadcrumbs,
  ArenaButton,
  ArenaFigure,
  ArenaKeyValue,
  ArenaScroller,
  ArenaScrollerItem,
  ArenaSection,
  ArenaSelect,
} from '@dravensoft/arena-react';
import { ListingCard, Mark, Price, Stars } from '../Pieces';
import { LISTINGS, listing as findListing, money } from '../data/Shop';

const SIZES = [
  { value: '60', label: '60 cm' },
  { value: '80', label: '80 cm' },
  { value: '100', label: '100 cm' },
];

const QUANTITIES = ['1', '2', '3', '4'].map((value) => ({ value, label: value }));

export function ListingScreen({
  id, saved, onOpen, onSave, onBasket,
}: {
  id: string;
  saved: string[];
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
  onBasket: (id: string) => void;
}) {
  const one = findListing(id);
  const [shot, setShot] = useState(0);
  const [size, setSize] = useState('80');
  const [quantity, setQuantity] = useState('1');

  const more = LISTINGS.filter((other) => other.id !== one.id).slice(0, 8);

  return (
    <div className="listing arena-band">
      <ArenaBreadcrumbs
        ariaLabel="Where this item sits"
        items={[
          { label: 'Home and living', href: '/c/home' },
          { label: 'Storage', href: '/c/storage' },
          { label: one.title },
        ]}
        onNavigate={() => onOpen('')}
      />

      <div className="listing__cols">
        <div className="listing__gallery">
          <div className="thumbs">
            {one.gallery.map((src, index) => (
              <button
                key={src}
                type="button"
                className="thumbs__one"
                aria-current={index === shot ? 'true' : undefined}
                onClick={() => setShot(index)}
              >
                <img src={src} alt={`${one.title}, view ${index + 1}`} />
                <span className="arena-sr-only">{`Show view ${index + 1}`}</span>
              </button>
            ))}
          </div>
          <div className="listing__shot">
            <ArenaFigure
              media={<img src={one.gallery[shot]} alt={one.title} />}
              overlay={one.mark ? <Mark kind={one.mark} /> : undefined}
              caption={`Made in ${one.madeIn}`}
            />
          </div>
        </div>

        <div className="buy arena-stack">
          <div className="buy__shop">
            <ArenaAvatar src={one.shopAvatar} name={one.shop} className="arena-size-sm" />
            <span className="buy__shop-name">{one.shop}</span>
            {one.mark === 'star-seller' ? <ArenaBadge className="arena-accent-gold">Star Seller</ArenaBadge> : null}
          </div>

          <h1 className="buy__title">{one.title}</h1>
          <Stars rating={one.rating} reviews={one.reviews} />
          <Price price={one.price} was={one.was} size="lg" />

          <ArenaAlert tone="warning" icon="ph-bold ph-fire">
            Only 3 left, and it is in 12 other baskets.
          </ArenaAlert>

          <ArenaSelect label="Width" options={SIZES} value={size} onChange={setSize} />
          <ArenaSelect label="Quantity" options={QUANTITIES} value={quantity} onChange={setQuantity} />

          <ArenaButton className="arena-fill" icon="ph-bold ph-basket" onClick={() => onBasket(one.id)}>
            Add to basket
          </ArenaButton>
          <ArenaButton
            className="arena-emphasis-secondary arena-fill"
            icon={saved.includes(one.id) ? 'ph-fill ph-heart' : 'ph-bold ph-heart'}
            onClick={() => onSave(one.id)}
          >
            {saved.includes(one.id) ? 'Saved' : 'Save for later'}
          </ArenaButton>

          <ArenaKeyValue
            rows={[
              { term: 'Delivery', value: one.freeDelivery ? 'Free' : money(4.95), numeric: !one.freeDelivery },
              { term: 'Arrives', value: '18 to 24 September' },
              { term: 'Returns', value: 'Accepted within 30 days' },
              { term: 'Ships from', value: one.madeIn },
            ]}
            total={{ term: 'Total today', value: money(one.price * Number(quantity)), numeric: true }}
          />
        </div>
      </div>

      {more.length ? (
        <ArenaSection title="You may also like" eyebrow="Picked for you">
          <ArenaScroller label="Items you may also like" className="arena-scroller-item-md">
            {more.map((other) => (
              <ArenaScrollerItem key={other.id}>
                <ListingCard
                  listing={other}
                  saved={saved.includes(other.id)}
                  onOpen={onOpen}
                  onSave={onSave}
                />
              </ArenaScrollerItem>
            ))}
          </ArenaScroller>
        </ArenaSection>
      ) : null}
    </div>
  );
}
