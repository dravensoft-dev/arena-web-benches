import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  ArenaButton, ArenaCard, ArenaIcon, ArenaPeopleList, ArenaPersonRow, ArenaProgressBar, arenaCatColor,
} from '@dravensoft/arena-angular';
import {
  GEMS,
  HEARTS,
  HEART_MAX,
  LEAGUE,
  NODE_ICON,
  STREAK,
  UNITS,
  XP_GOAL,
  XP_TODAY,
} from '../data/Course';
import type { PathNode, Unit } from '../data/Course';

@Component({
  selector: 'div[app-node]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaIcon, ArenaProgressBar, NgTemplateOutlet],
  host: { class: 'node', '[style.margin-inline-start]': "'calc(var(--sp-12) * ' + node().offset + ')'" },
  template: `
    @if (node().state === 'active') {
      <arena-progress-bar
        shape="radial"
        class="arena-size-lg"
        [showLabel]="false"
        [showPercentage]="false"
        [progressPercentage]="node().progress ?? 0"
        [label]="node().label + ' progress'"
      >
        <ng-container [ngTemplateOutlet]="button" />
      </arena-progress-bar>
    } @else {
      <ng-container [ngTemplateOutlet]="button" />
    }
    @if (node().state === 'active') { <span class="node__bubble">Start</span> }

    <ng-template #button>
      <button
        type="button"
        class="node__btn"
        [attr.data-state]="node().state"
        [style.background]="colour()"
        [attr.aria-label]="node().label + ', ' + node().state"
        (click)="start.emit()"
      >
        <arena-icon [icon]="node().state === 'locked' ? 'ph-fill ph-lock-simple' : icon[node().kind]" />
      </button>
    </ng-template>
  `,
})
export class Node {
  readonly node = input.required<PathNode>();
  readonly slot = input.required<number>();
  readonly start = output<void>();

  protected readonly icon = NODE_ICON;
  protected readonly colour = computed(() =>
    this.node().state === 'locked' ? 'var(--color-base-300)' : arenaCatColor(this.slot()),
  );
}

@Component({
  selector: 'section[app-unit]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaIcon, Node],
  host: { class: 'unit' },
  template: `
    <header class="unit__head" [style.background]="cat(unit().slot)">
      <div class="unit__text">
        <span class="unit__eyebrow">Unit {{ unit().number }}</span>
        <h2 class="unit__title">{{ unit().title }}</h2>
        <p class="unit__blurb">{{ unit().blurb }}</p>
      </div>
      <!-- On one line: Angular keeps a collapsed space around a text node where JSX drops the
           whitespace outright when it holds a newline. FINDINGS.md, difference 1. -->
      <button type="button" class="unit__guide"><arena-icon icon="ph-fill ph-book-open-text" />Guidebook</button>
    </header>

    <div class="path">
      @for (node of unit().nodes; track node.id) {
        <div app-node [node]="node" [slot]="unit().slot" (start)="start.emit()"></div>
      }
    </div>
  `,
})
export class UnitBlock {
  readonly unit = input.required<Unit>();
  readonly start = output<void>();

  protected readonly cat = arenaCatColor;
}

@Component({
  selector: 'app-path-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaButton, ArenaCard, ArenaIcon, ArenaPeopleList, ArenaPersonRow, UnitBlock],
  host: { class: 'path-screen' },
  template: `
    <div class="path-screen__main">
      @for (unit of units; track unit.id) {
        <section app-unit [unit]="unit" (start)="start.emit()"></section>
      }
    </div>

    <aside class="rail">
      <div class="rail__row">
        <span class="chip chip--streak"><arena-icon icon="ph-fill ph-fire" />{{ streak }}</span>
        <span class="chip chip--gems"><arena-icon icon="ph-fill ph-diamond" />{{ gems }}</span>
        <span class="chip chip--hearts"><arena-icon icon="ph-fill ph-heart" />{{ hearts }}<span class="chip__of">/{{ heartMax }}</span></span>
      </div>

      <arena-card title="Daily quest">
        <div class="quest">
          <span class="quest__icon" [style.background]="cat(4)">
            <arena-icon icon="ph-fill ph-lightning" />
          </span>
          <div class="quest__body">
            <p class="quest__name">Earn {{ xpGoal }} XP</p>
            <div class="meter" role="progressbar" [attr.aria-valuenow]="pct" aria-valuemin="0" aria-valuemax="100" aria-label="Daily quest progress">
              <span class="meter__fill" [style.inline-size.%]="pct"></span>
              <span class="meter__text arena-num">{{ xpToday }} / {{ xpGoal }}</span>
            </div>
          </div>
        </div>
      </arena-card>

      <arena-card title="Ruby league" eyebrow="Top 10 advance">
        <arena-people-list label="Ruby league standings" ordered class="arena-size-sm">
          @for (leader of top; track leader.rank) {
            <arena-person-row [rank]="leader.rank" [name]="leader.name"
              [src]="leader.image" [figure]="leader.xp + ' XP'" [current]="leader.me" />
          }
        </arena-people-list>
      </arena-card>

      <arena-card title="Unlock Super">
        <p class="rail__blurb">No ads, unlimited hearts, and a personalised practice hub.</p>
        <arena-button class="arena-fill" icon="ph-bold ph-crown-simple">Try 2 weeks free</arena-button>
      </arena-card>
    </aside>
  `,
})
export class PathScreen {
  readonly start = output<void>();

  protected readonly units = UNITS;
  protected readonly top = LEAGUE.slice(0, 5);
  protected readonly streak = STREAK;
  protected readonly gems = GEMS;
  protected readonly hearts = HEARTS;
  protected readonly heartMax = HEART_MAX;
  protected readonly xpToday = XP_TODAY;
  protected readonly xpGoal = XP_GOAL;
  protected readonly pct = Math.round((XP_TODAY / XP_GOAL) * 100);
  protected readonly cat = arenaCatColor;
}
