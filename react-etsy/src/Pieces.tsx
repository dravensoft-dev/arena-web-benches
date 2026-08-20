import React from 'react';
import { ArenaFigure } from '@dravensoft/arena-react';
import { money, reviewCount } from './data/Shop';
import type { Listing } from './data/Shop';

const MARK_LABEL: Record<string, string> = {
  sale: 'Sale',
  bestseller: 'Bestseller',
  'star-seller': 'Star Seller',
};

export function Mark({ kind }: { kind: NonNullable<Listing['mark']> }) {
  return <span className="mark" data-kind={kind}>{MARK_LABEL[kind]}</span>;
}

export function Stars({ rating, reviews }: { rating: number; reviews: number }) {
  const whole = Math.floor(rating);
  return (
    <span className="stars">
      <span className="arena-sr-only">{`Rated ${rating} out of 5 from ${reviews} reviews`}</span>
      <span className="stars__row" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((n) => (
          <i key={n} className={n < whole ? 'ph-fill ph-star' : 'ph-bold ph-star'} />
        ))}
      </span>
      <span className="stars__count arena-num" aria-hidden="true">{`(${reviewCount(reviews)})`}</span>
    </span>
  );
}

export function Price({ price, was, size = 'sm' }: { price: number; was?: number; size?: 'sm' | 'lg' }) {
  return (
    <span className="price" data-size={size}>
      <span className="price__now arena-num" data-cut={was ? 'yes' : 'no'}>{money(price)}</span>
      {was ? <s className="price__was arena-num">{money(was)}</s> : null}
      {was ? <span className="price__off">{`${Math.round((1 - price / was) * 100)}% off`}</span> : null}
    </span>
  );
}

export function ListingCard({
  listing, saved, onOpen, onSave,
}: {
  listing: Listing;
  saved: boolean;
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
}) {
  return (
    <article className="card">
      <a
        className="card__link"
        href={`/listing/${listing.id}`}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onOpen(listing.id);
        }}
      >
        <ArenaFigure
          media={<img src={listing.img} alt={listing.title} loading="lazy" />}
          overlay={listing.mark ? <Mark kind={listing.mark} /> : undefined}
        />
        <span className="card__body">
          <span className="card__title">{listing.title}</span>
          <Stars rating={listing.rating} reviews={listing.reviews} />
          <Price price={listing.price} was={listing.was} />
          <span className="card__shop">{listing.shop}</span>
          {listing.freeDelivery ? <span className="card__ship">Free delivery</span> : null}
        </span>
      </a>
      <button
        type="button"
        className="save"
        aria-pressed={saved}
        onClick={() => onSave(listing.id)}
      >
        <i className={saved ? 'ph-fill ph-heart' : 'ph-bold ph-heart'} aria-hidden="true" />
        <span className="arena-sr-only">
          {saved ? `Remove ${listing.title} from favourites` : `Add ${listing.title} to favourites`}
        </span>
      </button>
    </article>
  );
}
