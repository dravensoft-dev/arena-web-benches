import React, { useMemo, useState } from 'react';
import {
  ArenaGrid,
  ArenaPagination,
  ArenaSegmentedControl,
  ArenaSelect,
  ArenaSkeleton,
  ArenaSlider,
  ArenaTag,
} from '@dravensoft/arena-react';
import { ListingCard } from '../Pieces';
import { CURRENCY, FACETS, LISTINGS } from '../data/Shop';

const SORTS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'low', label: 'Lowest price' },
  { value: 'high', label: 'Highest price' },
  { value: 'new', label: 'Most recent' },
];

const KINDS = [
  { value: 'all', label: 'All' },
  { value: 'handmade', label: 'Handmade' },
  { value: 'vintage', label: 'Vintage' },
];

const PRICE_FLOOR = 0;
const PRICE_CEILING = 250;

// As many placeholders as a first page holds, so the grid fills in rather than jumping.
const GHOSTS = [0, 1, 2, 3, 4, 5, 6, 7];

export function SearchScreen({
  loading, saved, onOpen, onSave,
}: {
  loading: boolean;
  saved: string[];
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const [sort, setSort] = useState('relevance');
  const [kind, setKind] = useState('all');
  const [facets, setFacets] = useState<string[]>(['delivery']);
  const [page, setPage] = useState(1);
  const [low, setLow] = useState(PRICE_FLOOR);
  const [high, setHigh] = useState(PRICE_CEILING);

  const shown = useMemo(() => {
    const list = LISTINGS.filter((one) => one.price >= low && one.price <= high);
    if (facets.includes('delivery')) return list.filter((one) => one.freeDelivery);
    if (sort === 'low') return list.sort((a, b) => a.price - b.price);
    if (sort === 'high') return list.sort((a, b) => b.price - a.price);
    return list;
  }, [facets, sort, low, high]);

  return (
    <div className="results arena-band">
      <div className="results__head">
        <div className="results__count">
          <h1 className="results__title">Handmade shelves and wall storage</h1>
          <p className="results__sub">
            <span className="arena-num">{`${shown.length * 187}`}</span>
            {' results, most of them from small workshops'}
          </p>
        </div>
        <div className="results__sort">
          <ArenaSegmentedControl
            ariaLabel="What kind of item"
            options={KINDS}
            value={kind}
            onChange={setKind}
          />
          <ArenaSelect
            label="Sort by"
            options={SORTS}
            value={sort}
            onChange={setSort}
          />
        </div>
      </div>

      <div className="results__filters">
        <div className="results__facets arena-row">
          {FACETS.map((facet) => (
            <ArenaTag
              key={facet.id}
              className={facets.includes(facet.id) ? 'arena-accent-primary' : undefined}
              removable={facets.includes(facet.id)}
              onRemove={() => setFacets(facets.filter((one) => one !== facet.id))}
            >
              {facet.label}
            </ArenaTag>
          ))}
        </div>
        <div className="results__price">
          <ArenaSlider
            label="Price"
            hint="Before delivery"
            range
            min={PRICE_FLOOR}
            max={PRICE_CEILING}
            step={5}
            valuePrefix={CURRENCY}
            value={low}
            valueEnd={high}
            onChange={setLow}
            onChangeEnd={setHigh}
          />
        </div>
      </div>

      {loading
        ? (
          <div role="status" aria-label="Loading results">
            <div aria-hidden="true">
              <ArenaGrid>
                {GHOSTS.map((n) => (
                  <div key={n} className="ghost">
                    <ArenaSkeleton />
                    <ArenaSkeleton lines={3} />
                  </div>
                ))}
              </ArenaGrid>
            </div>
          </div>
        )
        : shown.length
          ? (
            <ArenaGrid>
              {shown.map((one) => (
                <ListingCard
                  key={one.id}
                  listing={one}
                  saved={saved.includes(one.id)}
                  onOpen={onOpen}
                  onSave={onSave}
                />
              ))}
            </ArenaGrid>
          )
          : <p className="results__none">Nothing made in that price range yet.</p>}

      <div className="results__pages">
        <ArenaPagination
          ariaLabel="Search results"
          page={page}
          pageCount={12}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
