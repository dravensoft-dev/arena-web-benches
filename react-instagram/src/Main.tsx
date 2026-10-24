import React, { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArenaAvatar,
  ArenaBottomNav,
  ArenaBottomNavItem,
  ArenaButton,
  ArenaDialog,
  ArenaFileInput,
  ArenaIcon,
  ArenaIconButton,
  ArenaIconsProvider,
  initArenaTheme,
  useArenaTheme,
  useArenaViewportBelow,
} from '@dravensoft/arena-react';
import type { ArenaFileInputHandle } from '@dravensoft/arena-react';

import { ARENA_SPRITE } from './arena.icons.generated.js';
import './arena.package.generated.css';
import './arena.generated.css';
import './plugin.generated.css';
import './app.css';

import { Carousel, Handle } from './Pieces';
import { CodeScreen } from './screens/CodeScreen';
import { FeedScreen } from './screens/FeedScreen';
import { LogInScreen } from './screens/LogInScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ACCOUNTS, ME, POSTS, UPLOAD, writeCount } from './data/Feed';
import type { GridPost, Post } from './data/Feed';

initArenaTheme({
  palettes: [
    { name: 'dark', polarity: 'dark' },
    { name: 'light', polarity: 'light' },
  ],
  default: 'dark',
});

type Screen = 'feed' | 'profile' | 'login' | 'code';

const SCREENS: Screen[] = ['feed', 'profile', 'login', 'code'];

const NAV: { id: string; label: string; icon: string; fill: string }[] = [
  { id: 'home', label: 'Home', icon: 'ph-bold ph-house', fill: 'ph-fill ph-house' },
  { id: 'search', label: 'Search', icon: 'ph-bold ph-magnifying-glass', fill: 'ph-fill ph-magnifying-glass' },
  { id: 'explore', label: 'Explore', icon: 'ph-bold ph-compass', fill: 'ph-fill ph-compass' },
  { id: 'reels', label: 'Reels', icon: 'ph-bold ph-film-strip', fill: 'ph-fill ph-film-strip' },
  { id: 'messages', label: 'Messages', icon: 'ph-bold ph-paper-plane-tilt', fill: 'ph-fill ph-paper-plane-tilt' },
  { id: 'notifications', label: 'Notifications', icon: 'ph-bold ph-heart', fill: 'ph-fill ph-heart' },
  { id: 'create', label: 'Create', icon: 'ph-bold ph-plus-square', fill: 'ph-fill ph-plus-square' },
];

/* Below a phone width the sidebar gives way to the bar of five destinations. Create opens a
   dialog rather than going anywhere, so it is the one without an address. */
const DESTINATIONS: { id: string; label: string; icon: string; href?: string }[] = [
  { id: 'home', label: 'Home', icon: 'ph-bold ph-house', href: '#/' },
  { id: 'search', label: 'Search', icon: 'ph-bold ph-magnifying-glass', href: '#/search' },
  { id: 'create', label: 'Create', icon: 'ph-bold ph-plus-square' },
  { id: 'reels', label: 'Reels', icon: 'ph-bold ph-film-strip', href: '#/reels' },
  { id: 'profile', label: 'Profile', icon: 'ph-bold ph-user-circle', href: '#/profile' },
];

function PostDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  if (!post) return null;
  const account = ACCOUNTS[post.handle];

  return (
    <div style={{ display: 'contents', '--arena-dialog-width': 'min(calc(var(--sp-1) * 260), 94vw)' } as CSSProperties}>
    <ArenaDialog open title={`Post by ${account.handle}`} onClose={onClose}>
      <div className="detail">
        <div className="detail__media">
          <Carousel media={post.media} alt={`Photo by ${account.handle}`} />
        </div>

        <div className="detail__side">
          <header className="detail__head">
            <ArenaAvatar name={account.name} src={account.avatar} className="arena-size-sm" />
            <Handle handle={post.handle} bold />
            <span className="post__gap" />
            <ArenaButton className="arena-emphasis-ghost arena-size-sm">Follow</ArenaButton>
          </header>

          <div className="detail__thread">
            <p className="post__comment">
              <Handle handle={post.handle} bold /> {post.caption}
            </p>
            {post.comments.map((comment) => (
              <div key={comment.handle + comment.text} className="thread">
                <ArenaAvatar name={ACCOUNTS[comment.handle].name} src={ACCOUNTS[comment.handle].avatar} className="arena-size-xs" />
                <div className="thread__body">
                  <p className="post__comment"><Handle handle={comment.handle} bold /> {comment.text}</p>
                  <p className="thread__meta">
                    <span>{comment.when}</span>
                    <span>{comment.likes} likes</span>
                    <span>Reply</span>
                  </p>
                </div>
                <ArenaIconButton icon="ph-bold ph-heart" label={`Like the comment by ${comment.handle}`} className="arena-size-sm" />
              </div>
            ))}
          </div>

          <footer className="detail__foot">
            <p className="post__likes"><strong>{writeCount(post.likes)} likes</strong></p>
            <p className="post__when">{post.when}</p>
            <div className="post__add">
              <input className="post__input" placeholder="Add a comment..." aria-label="Add a comment" />
              <ArenaButton className="arena-emphasis-ghost arena-size-sm">Post</ArenaButton>
            </div>
          </footer>
        </div>
      </div>
    </ArenaDialog>
    </div>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const picker = useRef<ArenaFileInputHandle>(null);
  const [held, setHeld] = useState(0);
  const tooMany = held > UPLOAD.maxFiles;

  function share() {
    picker.current?.clear();
    onClose();
  }

  return (
    <ArenaDialog
      open
      title="Create new post"
      fillBelow="sm"
      onClose={onClose}
      footer={<ArenaButton disabled={held === 0 || tooMany} onClick={share}>Share</ArenaButton>}
    >
      <ArenaFileInput
        ref={picker}
        label="Photos and videos"
        accept={UPLOAD.accept}
        maxSize={UPLOAD.maxSize}
        multiple
        droppable
        hint={`Drag photos and videos here. Up to ${UPLOAD.maxFiles}, 30 MB each.`}
        error={tooMany ? `A post holds up to ${UPLOAD.maxFiles}. Remove ${held - UPLOAD.maxFiles} to share it.` : undefined}
        onChange={(selection) => setHeld(selection.names.length)}
      />
    </ArenaDialog>
  );
}

function App() {
  const asked = new URLSearchParams(window.location.search).get('screen') as Screen | null;
  const [screen, setScreen] = useState<Screen>(asked && SCREENS.includes(asked) ? asked : 'feed');
  const [open, setOpen] = useState<Post | null>(
    new URLSearchParams(window.location.search).get('post') ? POSTS[0] : null,
  );
  const [active, setActive] = useState(screen === 'profile' ? 'profile' : 'home');
  const [creating, setCreating] = useState(new URLSearchParams(window.location.search).has('create'));
  const [theme, setTheme] = useArenaTheme();
  const narrow = useArenaViewportBelow('md');

  /* One router for both bars: the sidebar's rows and the bottom bar's destinations. */
  function go(id: string) {
    if (id === 'create') {
      setCreating(true);
      return;
    }
    setActive(id);
    if (id === 'home') setScreen('feed');
    if (id === 'profile') setScreen('profile');
  }

  if (screen === 'login') return <LogInScreen onLogIn={() => setScreen('code')} />;
  if (screen === 'code') {
    return <CodeScreen onVerified={() => { setActive('home'); setScreen('feed'); }} onBack={() => setScreen('login')} />;
  }

  return (
    <div className="app" data-narrow={narrow ? 'yes' : 'no'}>
      {narrow ? (
        <header className="top">
          <a className="nav__brand" href="#/" onClick={() => go('home')}>
            <span className="nav__word">Instagram</span>
          </a>
          <span className="post__gap" />
          <ArenaIconButton
            icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'}
            label="Appearance"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
          <ArenaIconButton icon="ph-bold ph-heart" label="Notifications" />
        </header>
      ) : (
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
                  onClick={() => go(item.id)}
                >
                  <ArenaIcon icon={active === item.id ? item.fill : item.icon} />
                  <span className="nav__label">{item.label}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="nav__item"
                aria-current={screen === 'profile' ? 'page' : undefined}
                onClick={() => go('profile')}
              >
                <ArenaAvatar name={ME.name} src={ME.avatar} className="arena-size-xs" />
                <span className="nav__label">Profile</span>
              </button>
            </li>
          </ul>

          <div className="nav__foot">
            <button type="button" className="nav__item" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <ArenaIcon icon={theme === 'dark' ? 'ph-bold ph-sun' : 'ph-bold ph-moon'} />
              <span className="nav__label">Appearance</span>
            </button>
            <button type="button" className="nav__item">
              <ArenaIcon icon="ph-bold ph-list" />
              <span className="nav__label">More</span>
            </button>
          </div>
        </nav>
      )}

      <main className="main">
        {screen === 'feed' && <FeedScreen onOpen={setOpen} onSwitchAccount={() => setScreen('login')} />}
        {screen === 'profile' && (
          <ProfileScreen onOpenGrid={(grid: GridPost) => setOpen({ ...POSTS[0], media: [grid.src] })} />
        )}
      </main>

      {narrow && (
        <ArenaBottomNav ariaLabel="Primary" active={active} onNav={go}>
          {DESTINATIONS.map((item) => (
            <ArenaBottomNavItem key={item.id} id={item.id} label={item.label} icon={item.icon} href={item.href} />
          ))}
        </ArenaBottomNav>
      )}

      <PostDialog post={open} onClose={() => setOpen(null)} />
      {creating && <CreateDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<ArenaIconsProvider href={ARENA_SPRITE}><App /></ArenaIconsProvider>);
