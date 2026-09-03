import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArenaAvatar,
  ArenaButton,
  ArenaDialog,
  ArenaIconButton,
  initArenaTheme,
  useArenaTheme,
} from '@dravensoft/arena-react';

import '@phosphor-icons/web/regular';
import './icons.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { Carousel, Handle } from './Pieces';
import { FeedScreen } from './screens/FeedScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ACCOUNTS, ME, POSTS, writeCount } from './data/Feed';
import type { GridPost, Post } from './data/Feed';

initArenaTheme({
  palettes: [
    { name: 'dark', polarity: 'dark' },
    { name: 'light', polarity: 'light' },
  ],
  default: 'dark',
});

type Screen = 'feed' | 'profile';

const NAV: { id: string; label: string; icon: string; fill: string; screen?: Screen }[] = [
  { id: 'home', label: 'Home', icon: 'ph-bold ph-house', fill: 'ph-fill ph-house', screen: 'feed' },
  { id: 'search', label: 'Search', icon: 'ph-bold ph-magnifying-glass', fill: 'ph-fill ph-magnifying-glass' },
  { id: 'explore', label: 'Explore', icon: 'ph-bold ph-compass', fill: 'ph-fill ph-compass' },
  { id: 'reels', label: 'Reels', icon: 'ph-bold ph-film-strip', fill: 'ph-fill ph-film-strip' },
  { id: 'messages', label: 'Messages', icon: 'ph-bold ph-paper-plane-tilt', fill: 'ph-fill ph-paper-plane-tilt' },
  { id: 'notifications', label: 'Notifications', icon: 'ph-bold ph-heart', fill: 'ph-fill ph-heart' },
  { id: 'create', label: 'Create', icon: 'ph-bold ph-plus-square', fill: 'ph-fill ph-plus-square' },
];

function PostDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  if (!post) return null;
  const account = ACCOUNTS[post.handle];

  return (
    <ArenaDialog open title={`Post by ${account.handle}`} width="min(1040px, 94vw)" onClose={onClose}>
      <div className="detail">
        <div className="detail__media">
          <Carousel media={post.media} alt={`Photo by ${account.handle}`} />
        </div>

        <div className="detail__side">
          <header className="detail__head">
            <ArenaAvatar name={account.name} src={account.avatar} size="sm" />
            <Handle handle={post.handle} bold />
            <span className="post__gap" />
            <ArenaButton variant="ghost" size="sm">Follow</ArenaButton>
          </header>

          <div className="detail__thread">
            <p className="post__comment">
              <Handle handle={post.handle} bold /> {post.caption}
            </p>
            {post.comments.map((comment) => (
              <div key={comment.handle + comment.text} className="thread">
                <ArenaAvatar name={ACCOUNTS[comment.handle].name} src={ACCOUNTS[comment.handle].avatar} size="xs" />
                <div className="thread__body">
                  <p className="post__comment"><Handle handle={comment.handle} bold /> {comment.text}</p>
                  <p className="thread__meta">
                    <span>{comment.when}</span>
                    <span>{comment.likes} likes</span>
                    <span>Reply</span>
                  </p>
                </div>
                <ArenaIconButton icon="ph-bold ph-heart" label={`Like the comment by ${comment.handle}`} size="sm" />
              </div>
            ))}
          </div>

          <footer className="detail__foot">
            <p className="post__likes"><strong>{writeCount(post.likes)} likes</strong></p>
            <p className="post__when">{post.when}</p>
            <div className="post__add">
              <input className="post__input" placeholder="Add a comment..." aria-label="Add a comment" />
              <ArenaButton variant="ghost" size="sm">Post</ArenaButton>
            </div>
          </footer>
        </div>
      </div>
    </ArenaDialog>
  );
}

function App() {
  const asked = new URLSearchParams(window.location.search).get('screen');
  const [screen, setScreen] = useState<Screen>(asked === 'profile' ? 'profile' : 'feed');
  const [open, setOpen] = useState<Post | null>(
    new URLSearchParams(window.location.search).get('post') ? POSTS[0] : null,
  );
  const [active, setActive] = useState('home');
  const [theme, setTheme] = useArenaTheme();

  return (
    <div className="app">
      <nav className="nav" aria-label="Primary">
        <a className="nav__brand" href="#/" onClick={() => setScreen('feed')}>
          <img src="img/brand-glyph.svg" alt="" className="nav__glyph" />
          <span className="nav__word">Instagram</span>
        </a>

        <ul className="nav__list">
          {NAV.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="nav__item"
                aria-current={active === item.id ? 'page' : undefined}
                onClick={() => {
                  setActive(item.id);
                  if (item.screen) setScreen(item.screen);
                }}
              >
                <i className={active === item.id ? item.fill : item.icon} aria-hidden="true" />
                <span className="nav__label">{item.label}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="nav__item"
              aria-current={screen === 'profile' ? 'page' : undefined}
              onClick={() => { setActive('profile'); setScreen('profile'); }}
            >
              <ArenaAvatar name={ME.name} src={ME.avatar} size="xs" />
              <span className="nav__label">Profile</span>
            </button>
          </li>
        </ul>

        <div className="nav__foot">
          <button type="button" className="nav__item" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <i className={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'} aria-hidden="true" />
            <span className="nav__label">Appearance</span>
          </button>
          <button type="button" className="nav__item">
            <i className="ph-bold ph-list" aria-hidden="true" />
            <span className="nav__label">More</span>
          </button>
        </div>
      </nav>

      <main className="main">
        {screen === 'feed' && <FeedScreen onOpen={setOpen} />}
        {screen === 'profile' && (
          <ProfileScreen onOpenGrid={(grid: GridPost) => setOpen({ ...POSTS[0], media: [grid.src] })} />
        )}
      </main>

      <PostDialog post={open} onClose={() => setOpen(null)} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
