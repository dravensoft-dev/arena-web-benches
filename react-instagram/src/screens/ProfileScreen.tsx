import React, { useState } from 'react';
import { ArenaAvatar, ArenaButton, ArenaIconButton } from '@dravensoft/arena-react';
import { Handle } from '../Pieces';
import { ACCOUNTS, HIGHLIGHTS, PROFILE_GRID, writeCount } from '../data/Feed';
import type { GridPost } from '../data/Feed';

const TABS = [
  { id: 'posts', label: 'Posts', icon: 'ph-bold ph-squares-four' },
  { id: 'reels', label: 'Reels', icon: 'ph-bold ph-film-strip' },
  { id: 'saved', label: 'Saved', icon: 'ph-bold ph-bookmark-simple' },
  { id: 'tagged', label: 'Tagged', icon: 'ph-bold ph-user-square' },
];

const KIND_ICON: Record<GridPost['kind'], string> = {
  carousel: 'ph-fill ph-copy',
  reel: 'ph-fill ph-film-strip',
  single: '',
};

export function ProfileScreen({ onOpenGrid }: { onOpenGrid: (post: GridPost) => void }) {
  const [tab, setTab] = useState('posts');
  const account = ACCOUNTS['atlas.knits'];

  return (
    <div className="profile">
      <header className="profile__head">
        <div className="profile__avatar">
          <ArenaAvatar name={account.name} src={account.avatar} size="lg" />
        </div>

        <div className="profile__meta">
          <div className="profile__row">
            <Handle handle={account.handle} />
            <ArenaButton size="sm">Follow</ArenaButton>
            <ArenaButton variant="secondary" size="sm">Message</ArenaButton>
            <ArenaIconButton icon="ph-bold ph-user-plus" label="Add to close friends" size="sm" />
            <ArenaIconButton icon="ph-bold ph-dots-three" label="More options" size="sm" />
          </div>

          <ul className="profile__stats">
            <li><strong className="arena-num">248</strong> posts</li>
            <li><strong className="arena-num">{writeCount(64200)}</strong> followers</li>
            <li><strong className="arena-num">312</strong> following</li>
          </ul>

          <div className="profile__bio">
            <p className="profile__name">{account.name}</p>
            <p className="profile__blurb">
              Undyed wool, spun in small runs. Reykjavik and Porto.
              <br />
              Winter collection opens 3 September.
            </p>
            <a className="profile__link" href="#/shop">atlasknitwear.example</a>
          </div>
        </div>
      </header>

      <div className="hl">
        {HIGHLIGHTS.map((highlight) => (
          <button key={highlight.id} type="button" className="hl__item">
            <span className="hl__ring"><img src={highlight.src} alt="" className="hl__img" /></span>
            <span className="hl__label">{highlight.label}</span>
          </button>
        ))}
        <button type="button" className="hl__item">
          <span className="hl__ring hl__ring--new"><i className="ph-bold ph-plus" aria-hidden="true" /></span>
          <span className="hl__label">New</span>
        </button>
      </div>

      <nav className="ptabs" aria-label="Profile sections">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="ptabs__tab"
            aria-current={tab === entry.id ? 'page' : undefined}
            onClick={() => setTab(entry.id)}
          >
            <i className={`${entry.icon} ptabs__icon`} aria-hidden="true" />
            {entry.label}
          </button>
        ))}
      </nav>

      <div className="grid">
        {PROFILE_GRID.map((post) => (
          <button key={post.id} type="button" className="cell" onClick={() => onOpenGrid(post)}>
            <img src={post.src} alt="" className="cell__img" />
            {KIND_ICON[post.kind] && (
              <i className={`${KIND_ICON[post.kind]} cell__kind`} aria-hidden="true" />
            )}
            <span className="cell__over">
              <span className="cell__stat"><i className="ph-fill ph-heart" aria-hidden="true" />{writeCount(post.likes)}</span>
              <span className="cell__stat"><i className="ph-fill ph-chat-circle" aria-hidden="true" />{post.comments}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
