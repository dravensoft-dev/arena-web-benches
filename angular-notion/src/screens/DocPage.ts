import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import {
  ArenaAvatar, ArenaBreadcrumbs, ArenaButton, ArenaDivider, ArenaIcon, ArenaIconButton, ArenaMenu,
} from '@dravensoft/arena-angular';
import type { ArenaCrumb, ArenaMenuItem } from '@dravensoft/arena-angular';
import { Blocks } from '../Blocks';
import { DOC_BLOCKS, PAGE_COVER, PAGE_ICON, PAGE_TITLE } from '../data/Workspace';
import type { Screen } from '../Sidebar';

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
  imports: [ArenaAvatar, ArenaBreadcrumbs, ArenaButton, ArenaDivider, ArenaIcon, ArenaIconButton, ArenaMenu, Blocks],
  host: { class: 'doc' },
  template: `
    <header class="topbar">
      <arena-breadcrumbs ariaLabel="Page location" [items]="crumbs" />
      <div class="topbar__actions">
        <span class="topbar__edited">Edited 12 minutes ago</span>
        <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-share-network">Share</arena-button>
        <arena-divider class="arena-orientation-vertical" />
        <arena-icon-button icon="ph-bold ph-chat-circle" label="Comments" class="arena-size-sm" />
        <arena-icon-button icon="ph-bold ph-clock-counter-clockwise" label="Page history" class="arena-size-sm" />
        <arena-icon-button icon="ph-bold ph-star" label="Add to favourites" class="arena-size-sm" />
        <arena-menu align="end" [items]="menu">
          <arena-icon-button trigger icon="ph-bold ph-dots-three" label="More actions" class="arena-size-sm" />
        </arena-menu>
      </div>
    </header>

    <div class="doc__scroll">
      <div class="doc__cover">
        <img [src]="cover" alt="" />
      </div>

      <div class="doc__body">
        <div class="doc__icon">
          <arena-icon [icon]="icon" />
        </div>

        <h1 class="doc__title">{{ title }}</h1>

        <div class="doc__props">
          <div class="prop">
            <span class="prop__key"><arena-icon icon="ph-bold ph-user" />Owner</span>
            <span class="prop__value">
              <arena-avatar name="Marta Ilves" src="img/p1.jpg" class="arena-size-xs" />
              Marta Ilves
            </span>
          </div>
          <div class="prop">
            <span class="prop__key"><arena-icon icon="ph-bold ph-tag" />Area</span>
            <span class="prop__value">Platform</span>
          </div>
          <div class="prop">
            <span class="prop__key"><arena-icon icon="ph-bold ph-calendar-blank" />Reviewed</span>
            <span class="prop__value">Aug 12, 2026</span>
          </div>
        </div>

        <app-blocks [blocks]="blocks" (screenChange)="screenChange.emit($event)" />

        <div class="doc__add">
          <arena-icon icon="ph-bold ph-plus" />
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

  readonly screenChange = output<Screen>();
}
