import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ArenaAvatar, ArenaButton, ArenaCard, ArenaGrid, ArenaIconButton } from '@dravensoft/arena-angular';
import { RECENT, TEMPLATES } from '../data/Workspace';
import type { Screen } from '../Sidebar';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar, ArenaButton, ArenaCard, ArenaGrid, ArenaIconButton],
  host: { class: 'doc' },
  template: `
    <header class="topbar">
      <span class="topbar__title">Home</span>
      <div class="topbar__actions">
        <arena-button variant="ghost" size="sm" icon="ph-bold ph-magnifying-glass" (click)="search.emit()">
          Search
        </arena-button>
        <arena-icon-button icon="ph-bold ph-gear" label="Settings" size="sm" />
      </div>
    </header>

    <div class="doc__scroll">
      <div class="home">
        <div class="home__greeting">
          <arena-avatar name="Marta Ilves" src="img/p1.jpg" size="lg" />
          <div>
            <h1 class="home__hello">Good afternoon, Marta</h1>
            <p class="home__sub">Six pages changed in your workspace since you were last here.</p>
          </div>
        </div>

        <section class="home__section">
          <h2 class="home__section-title">
            <i class="ph-bold ph-clock-counter-clockwise" aria-hidden="true"></i>
            Recently visited
          </h2>
          <div class="home__rail">
            @for (page of recent; track page.id) {
              <button type="button" class="recent" (click)="screenChange.emit(page.id === 'tasks' ? 'database' : 'doc')">
                <span class="recent__cover"></span>
                <span class="recent__icon"><i [class]="page.icon" aria-hidden="true"></i></span>
                <span class="recent__title">{{ page.title }}</span>
                <span class="recent__meta">{{ page.where }}</span>
                <span class="recent__meta recent__meta--dim">{{ page.when }}</span>
              </button>
            }
          </div>
        </section>

        <section class="home__section">
          <h2 class="home__section-title">
            <i class="ph-bold ph-cards-three" aria-hidden="true"></i>
            Start with a template
          </h2>
          <arena-grid min="240px" gap="md">
            @for (template of templates; track template.id) {
              <arena-card [title]="template.title" interactive (click)="screenChange.emit('doc')">
                <p class="template__blurb">
                  <i class="{{ template.icon }} template__icon" aria-hidden="true"></i>
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
