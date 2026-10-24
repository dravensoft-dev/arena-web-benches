import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ArenaAvatar, ArenaButton, ArenaCard, ArenaGrid, ArenaIcon, ArenaIconButton } from '@dravensoft/arena-angular';
import { RECENT, TEMPLATES } from '../data/Workspace';
import type { Screen } from '../Sidebar';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar, ArenaButton, ArenaCard, ArenaGrid, ArenaIcon, ArenaIconButton],
  host: { class: 'doc' },
  template: `
    <header class="topbar">
      <span class="topbar__title">Home</span>
      <div class="topbar__actions">
        <arena-button class="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-magnifying-glass" (activate)="search.emit()">
          Search
        </arena-button>
        <arena-icon-button icon="ph-bold ph-gear" label="Settings" class="arena-size-sm" />
      </div>
    </header>

    <div class="doc__scroll">
      <div class="home">
        <div class="home__greeting">
          <arena-avatar name="Marta Ilves" src="img/p1.jpg" class="arena-size-lg" />
          <div>
            <h1 class="home__hello">Good afternoon, Marta</h1>
            <p class="home__sub">Six pages changed in your workspace since you were last here.</p>
          </div>
        </div>

        <section class="home__section">
          <h2 class="home__section-title">
            <arena-icon icon="ph-bold ph-clock-counter-clockwise" />
            Recently visited
          </h2>
          <div class="home__rail">
            @for (page of recent; track page.id) {
              <button type="button" class="recent" (click)="screenChange.emit(page.id === 'tasks' ? 'database' : 'doc')">
                <span class="recent__cover"></span>
                <span class="recent__icon"><arena-icon [icon]="page.icon" /></span>
                <span class="recent__title">{{ page.title }}</span>
                <span class="recent__meta">{{ page.where }}</span>
                <span class="recent__meta recent__meta--dim">{{ page.when }}</span>
              </button>
            }
          </div>
        </section>

        <section class="home__section" style="--arena-grid-min: calc(var(--sp-1) * 60)">
          <h2 class="home__section-title">
            <arena-icon icon="ph-bold ph-cards-three" />
            Start with a template
          </h2>
          <arena-grid>
            @for (template of templates; track template.id) {
              <arena-card [title]="template.title" interactive (activate)="screenChange.emit('doc')">
                <p class="template__blurb">
                  <span class="template__icon" aria-hidden="true"><arena-icon [icon]="template.icon" /></span>
                  {{ template.blurb }}
                </p>
              </arena-card>
            }
          </arena-grid>
        </section>
      </div>
    </div>
  `,
})
export class Home {
  readonly screenChange = output<Screen>();
  readonly search = output<void>();

  protected readonly recent = RECENT;
  protected readonly templates = TEMPLATES;
}
