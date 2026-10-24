import React, { useState } from 'react';
import { ArenaAvatar, ArenaBadge, ArenaIcon, ArenaIconButton } from '@dravensoft/arena-react';
import { ACCOUNTS } from './data/Feed';

/* A story ring is a gradient stroke around an avatar, and its state is whether it has been
   opened. Arena's avatar has a status dot and no ring, so the ring is drawn here. */
export function StoryRing({
  handle,
  seen,
  live,
  size = 'md',
  label,
}: {
  handle: string;
  seen?: boolean;
  live?: boolean;
  size?: 'md' | 'lg';
  label?: string;
}) {
  const account = ACCOUNTS[handle];
  return (
    <button type="button" className="story" data-seen={seen ? 'yes' : 'no'} data-size={size}>
      <span className="story__ring">
        <span className="story__inner">
          <ArenaAvatar name={account.name} src={account.avatar} className={size === 'lg' ? 'arena-size-lg' : undefined} />
        </span>
        {live && <span className="story__live"><ArenaBadge tone="danger" className="arena-mark-solid arena-size-sm">LIVE</ArenaBadge></span>}
      </span>
      <span className="story__name">{label ?? account.handle}</span>
    </button>
  );
}

export function Handle({ handle, bold }: { handle: string; bold?: boolean }) {
  const account = ACCOUNTS[handle];
  return (
    <span className="handle" data-bold={bold ? 'yes' : 'no'}>
      {account.handle}
      {account.verified && <span className="handle__tick" aria-hidden="true" title="Verified"><ArenaIcon icon="ph-fill ph-seal-check" /></span>}
    </span>
  );
}

/* A post carousel is a slideshow with a position indicator. ArenaScroller is deliberately
   not one: it is an honest scrolling row with no arrows and no dots. */
export function Carousel({ media, alt }: { media: readonly string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const many = media.length > 1;

  return (
    <div className="carousel">
      <div className="carousel__frame">
        <img src={media[index]} alt={alt} className="carousel__img" />
        {many && index > 0 && (
          <span className="carousel__nav carousel__nav--prev">
            <ArenaIconButton icon="ph-bold ph-caret-left" label="Previous photo" className="arena-size-sm" onActivate={() => setIndex(index - 1)} />
          </span>
        )}
        {many && index < media.length - 1 && (
          <span className="carousel__nav carousel__nav--next">
            <ArenaIconButton icon="ph-bold ph-caret-right" label="Next photo" className="arena-size-sm" onActivate={() => setIndex(index + 1)} />
          </span>
        )}
        {many && <span className="carousel__count arena-num">{index + 1}/{media.length}</span>}
      </div>
      {many && (
        <div className="carousel__dots" role="tablist" aria-label="Photos in this post">
          {media.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Photo ${i + 1}`}
              className="carousel__dot"
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* The lock-up a signed-out screen carries: the glyph and the wordmark, the same two the
   primary nav opens with. */
export function Wordmark() {
  return (
    <span className="wordmark">
      <img src="img/brand-glyph.svg" alt="" className="wordmark__glyph" />
      <span className="wordmark__word">Instagram</span>
    </span>
  );
}
