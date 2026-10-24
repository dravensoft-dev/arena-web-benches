import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { ArenaBrand, ArenaButton, ArenaFooter, ArenaInput, ArenaUnauthCard } from '@dravensoft/arena-angular';
import { Wordmark } from '../Pieces';

@Component({
  selector: 'app-log-in-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaBrand, ArenaButton, ArenaFooter, ArenaInput, ArenaUnauthCard, Wordmark],
  host: { class: 'auth' },
  template: `
    <arena-unauth-card title="Log in to see photos and videos from your friends" headingLevel="h1">
      <app-wordmark brand />

      <div class="auth__fields">
        <arena-input label="Phone number, username or email" autoComplete="username" [value]="who()" (change)="who.set($event)" />
        <arena-input label="Password" type="password" autoComplete="current-password" />
        <arena-button class="arena-fill" [disabled]="who().trim() === ''" (click)="logIn.emit()">Log in</arena-button>
      </div>

      <a footer class="auth__link" href="#/reset">Forgot password?</a>
    </arena-unauth-card>

    <p class="auth__alt">
      Don't have an account? <a class="auth__link" href="#/signup">Sign up</a>
    </p>
  `,
})
export class LogInScreen {
  readonly logIn = output<void>();

  protected readonly who = signal('');
}
