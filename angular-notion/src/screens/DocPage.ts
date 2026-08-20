import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ArenaAvatar, ArenaBreadcrumbs, ArenaButton, ArenaIconButton, ArenaMenu,
} from '@dravensoft/arena-angular';
import type { ArenaCrumb, ArenaMenuItem } from '@dravensoft/arena-angular';
import { Blocks } from '../Blocks';
import { DOC_BLOCKS, PAGE_COVER, PAGE_ICON, PAGE_TITLE } from '../data/Workspace';

const CRUMBS: ArenaCrumb[] = [
  { label: 'Acme Platform', href: '#/' },
  { label: 'Engineering', href: '#/engineering' },
  { label: PAGE_TITLE },
];

const PAGE_MENU: ArenaMenuItem[] = [
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

@Component({
  selector: 'app-doc-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar, ArenaBreadcrumbs, ArenaButton, ArenaIconButton, ArenaMenu, Blocks],
  host: { class: 'doc' },
  template: `
    <header class="topbar">
      <arena-breadcrumbs ariaLabel="Page location" [items]="crumbs" />
      <div class="topbar__actions">
        <span class="topbar__edited">Edited 12 minutes ago</span>
        <arena-button variant="ghost" size="sm" icon="ph-bold ph-share-network">Share</arena-button>
        <arena-icon-button icon="ph-bold ph-chat-circle" label="Comments" size="sm" />
        <arena-icon-button icon="ph-bold ph-clock-counter-clockwise" label="Page history" size="sm" />
        <arena-icon-button icon="ph-bold ph-star" label="Add to favourites" size="sm" />
        <arena-menu align="end" [items]="menu">
          <arena-icon-button trigger icon="ph-bold ph-dots-three" label="More actions" size="sm" />
        </arena-menu>
      </div>
    </header>

    <div class="doc__scroll">
      <div class="doc__cover">
        <img [src]="cover" alt="" />
      </div>

      <div class="doc__body">
        <div class="doc__icon">
          <i [class]="icon" aria-hidden="true"></i>
        </div>

        <h1 class="doc__title">{{ title }}</h1>

        <div class="doc__props">
          <div class="prop">
            <span class="prop__key"><i class="ph-bold ph-user" aria-hidden="true"></i>Owner</span>
            <span class="prop__value">
              <arena-avatar name="Marta Ilves" src="/img/p1.jpg" size="xs" />
              Marta Ilves
            </span>
          </div>
          <div class="prop">
            <span class="prop__key"><i class="ph-bold ph-tag" aria-hidden="true"></i>Area</span>
            <span class="prop__value">Platform</span>
          </div>
          <div class="prop">
            <span class="prop__key"><i class="ph-bold ph-calendar-blank" aria-hidden="true"></i>Reviewed</span>
            <span class="prop__value">Aug 12, 2026</span>
          </div>
        </div>

        <app-blocks [blocks]="blocks" />

        <div class="doc__add">
          <i class="ph-bold ph-plus" aria-hidden="true"></i>
          <span>Click here to continue writing, or press the slash key for commands</span>
        </div>
      </div>
    </div>
  `,
})
export class DocPage {
  protected readonly crumbs = CRUMBS;
  protected readonly menu = PAGE_MENU;
  protected readonly blocks = DOC_BLOCKS;
  protected readonly cover = PAGE_COVER;
  protected readonly icon = PAGE_ICON;
  protected readonly title = PAGE_TITLE;
}
