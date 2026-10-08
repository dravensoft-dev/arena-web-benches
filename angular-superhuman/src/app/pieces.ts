import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ArenaAvatar, ArenaTag } from '@dravensoft/arena-angular';
import type { ArenaCatSlot } from '@dravensoft/arena-angular';
import type { Thread } from '../data/Mail';

@Component({
  selector: 'app-cap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `<kbd class="cap"><ng-content /></kbd>`,
})
export class Cap {}

@Component({
  selector: 'app-thread-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  imports: [ArenaAvatar, ArenaTag],
  template: `
    <li class="row" [attr.data-unread]="item().unread" [attr.aria-current]="current() ? 'true' : null">
      <button type="button" class="row__hit" (click)="openThread.emit(item().id)">
        <span class="row__mark" aria-hidden="true">
          @if (item().starred) { <i class="ph-fill ph-star"></i> }
        </span>
        <arena-avatar [src]="item().avatar" [name]="item().from" class="arena-size-xs" />
        <span class="row__text">
          <span class="row__top">
            <span class="row__from">{{ item().from }}</span>
            @if (item().count > 1) { <span class="row__count arena-num">{{ item().count }}</span> }
            <span class="row__gap"></span>
            @for (label of item().labels; track label; let index = $index) {
              <arena-tag [colorId]="slot(index)">{{ label }}</arena-tag>
            }
            @if (item().attachments.length) { <i class="ph-bold ph-paperclip row__clip" aria-hidden="true"></i> }
            <span class="row__at arena-num">{{ item().at }}</span>
          </span>
          <span class="row__line">
            <span class="row__subject">{{ item().subject }}</span>
            <span class="row__snippet">{{ item().snippet }}</span>
          </span>
        </span>
      </button>
    </li>
  `,
})
export class ThreadRow {
  readonly item = input.required<Thread>();
  readonly current = input.required<boolean>();
  readonly openThread = output<string>();

  protected slot(index: number): ArenaCatSlot {
    return ((index % 8) + 1) as ArenaCatSlot;
  }
}
