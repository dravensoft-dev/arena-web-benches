import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  ArenaAccordion, ArenaAccordionItem, ArenaCheckbox, ArenaDivider, ArenaFigure, ArenaIcon, ArenaLink,
  ArenaMedia,
} from '@dravensoft/arena-angular';
import type { Block, Run } from './data/Workspace';
import type { Screen } from './Sidebar';

@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaCheckbox],
  host: { style: 'display: contents' },
  template: `
    <div class="block block--todo" [attr.data-done]="checked() ? 'yes' : 'no'">
      <arena-checkbox [checked]="checked()" [label]="text()" (change)="checked.set($event)" />
    </div>
  `,
})
export class Todo {
  readonly text = input.required<string>();
  readonly done = input.required<boolean>();
  protected readonly checked = signal(false);

  constructor() {
    queueMicrotask(() => this.checked.set(this.done()));
  }
}

@Component({
  selector: 'app-rich',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaLink],
  host: { style: 'display: contents' },
  template: `
    <p class="block block--text">
      @for (run of runs(); track $index) {
        @if ('screen' in run) {
          <arena-link [href]="run.href" (navigate)="screenChange.emit(run.screen)">{{ run.text }}</arena-link>
        } @else if ('external' in run) {
          <arena-link [href]="run.href" external>{{ run.text }}</arena-link>
        } @else {<ng-container>{{ run.text }}</ng-container>}
      }
    </p>
  `,
})
export class Rich {
  readonly runs = input.required<readonly Run[]>();
  readonly screenChange = output<Screen>();
}

@Component({
  selector: 'app-blocks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAccordion, ArenaAccordionItem, ArenaDivider, ArenaFigure, ArenaIcon, ArenaMedia, Rich, Todo],
  host: { class: 'blocks' },
  template: `
    @for (block of blocks(); track $index) {
      @switch (block.kind) {
        @case ('h1') { <h1 class="block block--h1">{{ block.text }}</h1> }
        @case ('h2') { <h2 class="block block--h2">{{ block.text }}</h2> }
        @case ('h3') { <h3 class="block block--h3">{{ block.text }}</h3> }
        @case ('text') { <p class="block block--text">{{ block.text }}</p> }
        @case ('rich') { <app-rich [runs]="block.runs" (screenChange)="screenChange.emit($event)" /> }
        @case ('bullet') {
          <div class="block block--list">
            <span class="list__marker" aria-hidden="true">&bull;</span>
            <span>{{ block.text }}</span>
          </div>
        }
        @case ('numbered') {
          <div class="block block--list">
            <span class="list__marker list__marker--num" aria-hidden="true">{{ block.index }}.</span>
            <span>{{ block.text }}</span>
          </div>
        }
        @case ('todo') { <app-todo [text]="block.text" [done]="block.done" /> }
        @case ('quote') { <blockquote class="block block--quote">{{ block.text }}</blockquote> }
        @case ('callout') {
          <aside class="block block--callout">
            <span class="callout__icon" aria-hidden="true"><arena-icon [icon]="block.icon" /></span>
            <p class="callout__text">{{ block.text }}</p>
          </aside>
        }
        @case ('toggles') {
          <div class="block block--toggles">
            <arena-accordion multiple>
              @for (item of block.items; track item.value) {
                <arena-accordion-item [value]="item.value" [label]="item.label">
                  <p class="toggle__body">{{ item.body }}</p>
                </arena-accordion-item>
              }
            </arena-accordion>
          </div>
        }
        @case ('code') {
          <div class="block block--code">
            <span class="code__lang">{{ block.language }}</span>
            <pre class="code__pre"><code>{{ block.text }}</code></pre>
          </div>
        }
        @case ('divider') {
          <div class="block block--divider">
            <arena-divider [label]="block.label" />
          </div>
        }
        @case ('image') {
          <div class="block block--figure">
            <arena-figure class="arena-ratio-video" [caption]="block.caption">
              <img media [src]="block.src" [alt]="block.caption" />
            </arena-figure>
          </div>
        }
      }
    }
  `,
})
export class Blocks {
  readonly blocks = input.required<readonly Block[]>();
  readonly screenChange = output<Screen>();
}
