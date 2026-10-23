import React from 'react';
import { ArenaAvatar, ArenaIcon, ArenaTag } from '@dravensoft/arena-react';
import type { Thread } from './data/Mail';

export function Cap({ children }: { children: React.ReactNode }) {
  return <kbd className="cap">{children}</kbd>;
}

export function ThreadRow({
  item, current, onOpen,
}: {
  item: Thread;
  current: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <li className="row" data-unread={item.unread} aria-current={current ? 'true' : undefined}>
      <button type="button" className="row__hit" onClick={() => onOpen(item.id)}>
        <span className="row__mark" aria-hidden="true">
          {item.starred ? <ArenaIcon icon="ph-fill ph-star" /> : null}
        </span>
        <ArenaAvatar src={item.avatar} name={item.from} className="arena-size-xs" />
        <span className="row__text">
          <span className="row__top">
            <span className="row__from">{item.from}</span>
            {item.count > 1 ? <span className="row__count arena-num">{item.count}</span> : null}
            <span className="row__gap" />
            {item.labels.map((label, index) => (
              <ArenaTag key={label} colorId={((index % 8) + 1) as 1}>{label}</ArenaTag>
            ))}
            {item.attachments.length ? <span className="row__clip" aria-hidden="true"><ArenaIcon icon="ph-bold ph-paperclip" /></span> : null}
            <span className="row__at arena-num">{item.at}</span>
          </span>
          <span className="row__line">
            <span className="row__subject">{item.subject}</span>
            <span className="row__snippet">{item.snippet}</span>
          </span>
        </span>
      </button>
    </li>
  );
}
