import React from 'react';
import {
  ArenaAvatar,
  ArenaBreadcrumbs,
  ArenaButton,
  ArenaIconButton,
  ArenaMenu,
} from '@dravensoft/arena-react';
import { Blocks } from '../Blocks';
import { DOC_BLOCKS, PAGE_COVER, PAGE_ICON, PAGE_TITLE } from '../data/Workspace';

const CRUMBS = [
  { label: 'Acme Platform', href: '#/' },
  { label: 'Engineering', href: '#/engineering' },
  { label: PAGE_TITLE },
];

const PAGE_MENU = [
  { label: 'Copy link', icon: 'ph-bold ph-link' },
  { label: 'Duplicate', icon: 'ph-bold ph-copy' },
  { label: 'Move to', icon: 'ph-bold ph-arrow-square-out' },
  { divider: true },
  { header: 'Export' },
  { label: 'Export as PDF', icon: 'ph-bold ph-file-pdf' },
  { label: 'Export as Markdown', icon: 'ph-bold ph-file-md' },
  { divider: true },
  { label: 'Move to trash', icon: 'ph-bold ph-trash', destructive: true },
];

export function DocPage() {
  return (
    <div className="doc">
      <header className="topbar">
        <ArenaBreadcrumbs ariaLabel="Page location" items={CRUMBS} />
        <div className="topbar__actions">
          <span className="topbar__edited">Edited 12 minutes ago</span>
          <ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-share-network">Share</ArenaButton>
          <ArenaIconButton icon="ph-bold ph-chat-circle" label="Comments" className="arena-size-sm" />
          <ArenaIconButton icon="ph-bold ph-clock-counter-clockwise" label="Page history" className="arena-size-sm" />
          <ArenaIconButton icon="ph-bold ph-star" label="Add to favourites" className="arena-size-sm" />
          <ArenaMenu
            align="end"
            items={PAGE_MENU}
            trigger={<ArenaIconButton icon="ph-bold ph-dots-three" label="More actions" className="arena-size-sm" />}
          />
        </div>
      </header>

      <div className="doc__scroll">
        <div className="doc__cover">
          <img src={PAGE_COVER} alt="" />
        </div>

        <div className="doc__body">
          <div className="doc__icon">
            <i className={PAGE_ICON} aria-hidden="true" />
          </div>

          <h1 className="doc__title">{PAGE_TITLE}</h1>

          <div className="doc__props">
            <div className="prop">
              <span className="prop__key"><i className="ph-bold ph-user" aria-hidden="true" />Owner</span>
              <span className="prop__value">
                <ArenaAvatar name="Marta Ilves" src="img/p1.jpg" className="arena-size-xs" />
                Marta Ilves
              </span>
            </div>
            <div className="prop">
              <span className="prop__key"><i className="ph-bold ph-tag" aria-hidden="true" />Area</span>
              <span className="prop__value">Platform</span>
            </div>
            <div className="prop">
              <span className="prop__key"><i className="ph-bold ph-calendar-blank" aria-hidden="true" />Reviewed</span>
              <span className="prop__value">Aug 12, 2026</span>
            </div>
          </div>

          <Blocks blocks={DOC_BLOCKS} />

          <div className="doc__add">
            <i className="ph-bold ph-plus" aria-hidden="true" />
            <span>Click here to continue writing, or press the slash key for commands</span>
          </div>
        </div>
      </div>
    </div>
  );
}
