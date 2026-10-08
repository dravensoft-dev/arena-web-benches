import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { ArenaButton, ArenaIconButton, arenaCatColor } from '@dravensoft/arena-angular';
import { HEARTS, QUESTION } from '../data/Course';

type Phase = 'asking' | 'right' | 'wrong';

@Component({
  selector: 'app-lesson-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaButton, ArenaIconButton],
  host: { class: 'lesson', '[attr.data-phase]': 'phase()' },
  template: `
    <header class="lesson__top">
      <arena-icon-button icon="ph-bold ph-x" label="Quit the lesson" (click)="quit.emit()" />
      <div class="bar" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" aria-label="Lesson progress">
        <span class="bar__fill" style="inline-size: 45%"></span>
      </div>
      <span class="chip chip--hearts"><i class="ph-fill ph-heart" aria-hidden="true"></i>{{ hearts }}</span>
    </header>

    <main class="lesson__body">
      <h1 class="lesson__prompt">{{ question.prompt }}</h1>

      <!-- The sentence sits against the closing tags: see FINDINGS.md, difference 1. -->
      <p class="lesson__sentence"><button type="button" class="speak">
          <i class="ph-fill ph-speaker-high" aria-hidden="true"></i>
          <span class="arena-sr-only">Play the sentence</span>
        </button>{{ question.sentence }}</p>

      <div class="choices">
        @for (choice of question.choices; track choice.id; let index = $index) {
          <button
            type="button"
            class="choice"
            [attr.data-picked]="picked() === choice.id ? 'yes' : 'no'"
            [attr.aria-pressed]="picked() === choice.id"
            [disabled]="phase() !== 'asking'"
            (click)="picked.set(choice.id)"
          >
            <span class="choice__art" [style.color]="cat(index + 1)">
              <i [class]="choice.image" aria-hidden="true"></i>
            </span>
            <span class="choice__label">{{ choice.label }}</span>
            <span class="choice__key arena-num">{{ index + 1 }}</span>
          </button>
        }
      </div>
    </main>

    <footer class="lesson__foot">
      @if (phase() === 'asking') {
        <div class="foot__row">
          <arena-button class="arena-emphasis-ghost arena-size-lg" (click)="next()">Skip</arena-button>
          <span class="foot__gap"></span>
          <arena-button class="arena-size-lg" [disabled]="!picked()" (click)="check()">Check</arena-button>
        </div>
      }

      @if (phase() === 'right') {
        <div class="foot__row foot__row--right">
          <span class="verdict">
            <span class="verdict__mark"><i class="ph-bold ph-check" aria-hidden="true"></i></span>
            <span class="verdict__text">
              <strong>Nicely done</strong>
              <span>{{ chosen()?.label }} means {{ chosen()?.hint }}</span>
            </span>
          </span>
          <span class="foot__gap"></span>
          <arena-button class="arena-size-lg" (click)="next()">Continue</arena-button>
        </div>
      }

      @if (phase() === 'wrong') {
        <div class="foot__row foot__row--wrong">
          <span class="verdict">
            <span class="verdict__mark"><i class="ph-bold ph-x" aria-hidden="true"></i></span>
            <span class="verdict__text">
              <strong>Not quite</strong>
              <span>The answer is <em>la cuenta</em>, the bill</span>
            </span>
          </span>
          <span class="foot__gap"></span>
          <arena-button class="arena-size-lg" destructive (click)="next()">Got it</arena-button>
        </div>
      }
    </footer>
  `,
})
export class LessonScreen {
  readonly quit = output<void>();

  private readonly asked = new URLSearchParams(window.location.search).get('phase');

  protected readonly hearts = HEARTS;
  protected readonly question = QUESTION;
  protected readonly cat = arenaCatColor;

  protected readonly picked = signal<string | null>(this.asked ? 'c1' : null);
  protected readonly phase = signal<Phase>(
    this.asked === 'right' || this.asked === 'wrong' ? this.asked : 'asking',
  );

  protected readonly chosen = computed(() =>
    QUESTION.choices.find((choice) => choice.id === this.picked()),
  );

  protected check(): void {
    const chosen = this.chosen();
    if (!chosen) return;
    this.phase.set(chosen.correct ? 'right' : 'wrong');
  }

  protected next(): void {
    this.picked.set(null);
    this.phase.set('asking');
  }
}
