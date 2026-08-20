import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArenaAppBar,
  ArenaButton,
  ArenaIconButton,
  ArenaInput,
  ArenaKeyValue,
  ArenaMain,
  ArenaSheet,
  ArenaSiteFooter,
  ArenaSkipLink,
  initArenaTheme,
  useArenaTheme,
} from '@dravensoft/arena-react';

import '@phosphor-icons/web/regular';
import '@phosphor-icons/web/bold';
import '@phosphor-icons/web/fill';
import './icons.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { SearchScreen } from './screens/SearchScreen';
import { ListingScreen } from './screens/ListingScreen';
import { CATEGORIES, listing, money } from './data/Shop';

initArenaTheme({
  palettes: [
    { name: 'light', polarity: 'light' },
    { name: 'dark', polarity: 'dark' },
  ],
  default: 'light',
});

function Shop() {
  const [theme, setTheme] = useArenaTheme();
  const [open, setOpen] = useState<string | null>(() => {
    const match = /^\/listing\/([a-z0-9-]+)$/.exec(window.location.pathname);
    return match ? match[1]! : null;
  });
  const [saved, setSaved] = useState<string[]>(['stoneware-mug']);
  const [basket, setBasket] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState('floating shelf');

  const toggleSaved = (id: string) => setSaved(
    saved.includes(id) ? saved.filter((one) => one !== id) : [...saved, id],
  );

  const addToBasket = (id: string) => {
    setBasket([...basket, id]);
    setCartOpen(true);
  };

  const total = basket.reduce((sum, id) => sum + listing(id).price, 0);

  return (
    <div className="arena-shell">
      <ArenaSkipLink label="Skip to results" />

      <ArenaAppBar
        brand={
          <a className="brand" href="/" onClick={(event) => { event.preventDefault(); setOpen(null); }}>
            <i className="ph-fill ph-storefront brand__glyph" aria-hidden="true" />
            <span className="brand__word">Maker&apos;s Row</span>
          </a>
        }
        nav={
          <div className="search">
            <ArenaInput
              label="Search for anything"
              icon="ph-bold ph-magnifying-glass"
              value={query}
              onChange={setQuery}
            />
          </div>
        }
        actions={
          <div className="bar-actions">
            <ArenaIconButton
              icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'}
              label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
            <ArenaIconButton icon="ph-bold ph-heart" label="Favourites" />
            <ArenaIconButton
              icon="ph-bold ph-basket"
              label={`Basket, ${basket.length} items`}
              onClick={() => setCartOpen(true)}
            />
          </div>
        }
      />

      <nav className="cats" aria-label="Departments">
        <ul className="cats__list">
          {CATEGORIES.map((one) => (
            <li key={one}>
              <a className="cats__link" href={`/c/${one}`} onClick={(event) => event.preventDefault()}>{one}</a>
            </li>
          ))}
        </ul>
      </nav>

      <ArenaMain>
        <div className="arena-shell__main">
          {open
            ? (
              <ListingScreen
                id={open}
                saved={saved}
                onOpen={(id) => setOpen(id || null)}
                onSave={toggleSaved}
                onBasket={addToBasket}
              />
            )
            : <SearchScreen saved={saved} onOpen={setOpen} onSave={toggleSaved} />}
        </div>
      </ArenaMain>

      <ArenaSiteFooter note="Every item on this page is made by the person selling it.">
        <div className="foot">
          <span className="foot__word">Maker&apos;s Row</span>
          <a className="foot__link" href="/help" onClick={(event) => event.preventDefault()}>Help</a>
          <a className="foot__link" href="/sell" onClick={(event) => event.preventDefault()}>Sell on Maker&apos;s Row</a>
          <a className="foot__link" href="/terms" onClick={(event) => event.preventDefault()}>Terms</a>
        </div>
      </ArenaSiteFooter>

      <ArenaSheet
        open={cartOpen}
        placement="right"
        title="Your basket"
        dismissible
        onClose={() => setCartOpen(false)}
        footer={<ArenaButton variant="primary" full>Go to checkout</ArenaButton>}
      >
        {basket.length === 0
          ? <p className="basket__empty">Nothing in it yet.</p>
          : (
            <ArenaKeyValue
              rows={basket.map((id) => ({ term: listing(id).title, value: money(listing(id).price), numeric: true }))}
              total={{ term: 'Subtotal', value: money(total), numeric: true }}
            />
          )}
      </ArenaSheet>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Shop />);
