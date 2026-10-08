import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ArenaCheckbox, ArenaFigure, ArenaMedia } from '@dravensoft/arena-angular';
import type { Block } from './data/Workspace';

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
  selector: 'app-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <details class="block block--toggle">
      <summary class="toggle__summary">
        <i class="ph-bold ph-caret-right toggle__caret" aria-hidden="true"></i>
        <span>{{ text() }}</span>
      </summary>
      <p class="toggle__body">{{ body() }}</p>
    </details>
  `,
})
export class Toggle {
  readonly text = input.required<string>();
  readonly body = input.required<string>();
}

@Component({
  selector: 'app-blocks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaFigure, ArenaMedia, Todo, Toggle],
  host: { class: 'blocks' },
  template: `
    @for (block of blocks(); track $index) {
      @switch (block.kind) {
        @case ('h1') { <h1 class="block block--h1">{{ block.text }}</h1> }
        @case ('h2') { <h2 class="block block--h2">{{ block.text }}</h2> }
        @case ('h3') { <h3 class="block block--h3">{{ block.text }}</h3> }
        @case ('text') { <p class="block block--text">{{ block.text }}</p> }
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
            <i class="{{ block.icon }} callout__icon" aria-hidden="true"></i>
            <p class="callout__text">{{ block.text }}</p>
          </aside>
        }
        @case ('toggle') { <app-toggle [text]="block.text" [body]="block.body" /> }
        @case ('code') {
          <div class="block block--code">
            <span class="code__lang">{{ block.language }}</span>
            <pre class="code__pre"><code>{{ block.text }}</code></pre>
          </div>
        }
        @case ('divider') { <hr class="block block--divider" /> }
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
}
