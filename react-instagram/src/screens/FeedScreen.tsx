import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArenaAvatar,
  ArenaButton,
  ArenaIcon,
  ArenaIconButton,
  ArenaMenu,
  ArenaPeopleList,
  ArenaPersonRow,
  ArenaScroller,
  ArenaScrollerItem,
} from '@dravensoft/arena-react';
import { Carousel, Handle, StoryRing } from '../Pieces';
import { ACCOUNTS, ME, POSTS, STORIES, SUGGESTIONS, writeCount } from '../data/Feed';
import type { Post } from '../data/Feed';

const POST_MENU = [
  { label: 'Report', icon: 'ph-bold ph-flag', destructive: true },
  { label: 'Unfollow', icon: 'ph-bold ph-user-minus', destructive: true },
  { divider: true },
  { label: 'Add to favourites', icon: 'ph-bold ph-star' },
  { label: 'Go to post', icon: 'ph-bold ph-arrow-square-out' },
  { label: 'Copy link', icon: 'ph-bold ph-link' },
];

function PostCard({ post, onOpen }: { post: Post; onOpen: (post: Post) => void }) {
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(post.saved);
  const account = ACCOUNTS[post.handle];
  const likes = post.likes + (liked && !post.liked ? 1 : 0) - (!liked && post.liked ? 1 : 0);

  return (
    <article className="post">
      <header className="post__head">
        <StoryRing handle={post.handle} size="md" label="" />
        <span className="post__who">
          <span className="post__line">
            <Handle handle={post.handle} bold />
            <span className="post__dot">&middot;</span>
            <span className="post__when">{post.when}</span>
          </span>
          {post.place && <span className="post__place">{post.place}</span>}
        </span>
        <span className="post__gap" />
        <ArenaMenu
          align="end"
          items={POST_MENU}
          trigger={<ArenaIconButton icon="ph-bold ph-dots-three" label={`Options for ${account.handle}`} className="arena-size-sm" />}
        />
      </header>

      <Carousel media={post.media} alt={`Photo by ${account.handle}`} />

      <div className="post__actions">
        <button
          type="button"
          className="act"
          data-on={liked ? 'yes' : 'no'}
          aria-pressed={liked}
          onClick={() => setLiked(!liked)}
        >
          <span className="act__heart" aria-hidden="true"><ArenaIcon icon={liked ? 'ph-fill ph-heart' : 'ph-bold ph-heart'} /></span>
          <span className="arena-sr-only">Like</span>
        </button>
        <button type="button" className="act" onClick={() => onOpen(post)}>
          <ArenaIcon icon="ph-bold ph-chat-circle" />
          <span className="arena-sr-only">Comment</span>
        </button>
        <button type="button" className="act">
          <ArenaIcon icon="ph-bold ph-paper-plane-tilt" />
          <span className="arena-sr-only">Share</span>
        </button>
        <span className="post__gap" />
        <button
          type="button"
          className="act"
          data-on={saved ? 'yes' : 'no'}
          aria-pressed={saved}
          onClick={() => setSaved(!saved)}
        >
          <ArenaIcon icon={saved ? 'ph-fill ph-bookmark-simple' : 'ph-bold ph-bookmark-simple'} />
          <span className="arena-sr-only">Save</span>
        </button>
      </div>

      <div className="post__body">
        <p className="post__likes">
          Liked by <Handle handle={post.likedBy} bold /> and <strong>{writeCount(likes)} others</strong>
        </p>
        <p className="post__caption">
          <Handle handle={post.handle} bold /> {post.caption}
        </p>
        <button type="button" className="post__more" onClick={() => onOpen(post)}>
          View all {post.comments.length} comments
        </button>
        {post.comments.slice(0, 2).map((comment) => (
          <p key={comment.handle + comment.text} className="post__comment">
            <Handle handle={comment.handle} bold /> {comment.text}
          </p>
        ))}
        <div className="post__add">
          <input className="post__input" placeholder="Add a comment..." aria-label="Add a comment" />
          <ArenaButton className="arena-emphasis-ghost arena-size-sm">Post</ArenaButton>
        </div>
      </div>
    </article>
  );
}

export function FeedScreen({ onOpen }: { onOpen: (post: Post) => void }) {
  return (
    <div className="feed">
      <div className="feed__col">
        <div className="rail" style={{ '--arena-scroller-item': 'var(--sp-20)' } as CSSProperties}>
          <ArenaScroller label="Stories" behaviour="snap">
            {STORIES.map((story) => (
              <ArenaScrollerItem key={story.handle}>
                <StoryRing handle={story.handle} seen={story.seen} live={story.live} />
              </ArenaScrollerItem>
            ))}
          </ArenaScroller>
        </div>

        {POSTS.map((post) => <PostCard key={post.id} post={post} onOpen={onOpen} />)}
      </div>

      <aside className="aside">
        <div className="aside__me">
          <ArenaAvatar name={ME.name} src={ME.avatar} className="arena-size-lg" />
          <span className="aside__me-text">
            <Handle handle={ME.handle} bold />
            <span className="aside__me-name">{ME.name}</span>
          </span>
          <ArenaButton className="arena-emphasis-ghost arena-size-sm">Switch</ArenaButton>
        </div>

        <div className="aside__head">
          <span className="aside__title">Suggested for you</span>
          <ArenaButton className="arena-emphasis-ghost arena-size-sm">See all</ArenaButton>
        </div>

        <ArenaPeopleList label="Suggested accounts">
          {SUGGESTIONS.map((handle) => (
            <ArenaPersonRow key={handle} name={handle} src={ACCOUNTS[handle].avatar}
              secondary="Followed by marisol.b"
              action={<ArenaButton className="arena-emphasis-ghost arena-size-sm">Follow</ArenaButton>} />
          ))}
        </ArenaPeopleList>

        <p className="aside__legal">
          About &middot; Help &middot; Press &middot; API &middot; Jobs &middot; Privacy &middot; Terms
          <br />
          &copy; 2026 Instagram from Meta
        </p>
      </aside>
    </div>
  );
}
