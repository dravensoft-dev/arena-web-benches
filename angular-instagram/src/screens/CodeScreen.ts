import { ChangeDetectionStrategy, Component, output, signal, viewChild } from '@angular/core';
import { ArenaBrand, ArenaButton, ArenaFooter, ArenaPinInput, ArenaUnauthCard } from '@dravensoft/arena-angular';
import { Wordmark } from '../Pieces';
import { TWO_FACTOR } from '../data/Feed';

/* The two-factor step. The panel and the cells report; checking the code is this screen's. */
@Component({
  selector: 'app-code-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaBrand, ArenaButton, ArenaFooter, ArenaPinInput, ArenaUnauthCard, Wordmark],
  host: { class: 'auth' },
  template: `
    <arena-unauth-card title="Enter your security code" headingLevel="h1">
      <app-wordmark brand />

      <div class="auth__fields">
        <p class="auth__lede">
          We sent a 6-digit code by text message to the number ending in {{ twoFactor.ending }}.
        </p>
        <arena-pin-input
          label="Security code"
          name="otp"
          [value]="code()"
          [error]="error()"
          (valueChange)="code.set($event); error.set(undefined)"
          (complete)="verify($event)"
        />
        <arena-button class="arena-fill" [disabled]="code().length < 6" (activate)="verify(code())">Confirm</arena-button>
        <arena-button class="arena-emphasis-ghost arena-fill">Resend code</arena-button>
      </div>

      <a footer class="auth__link" href="#/login" (click)="back.emit()">Back to log in</a>
    </arena-unauth-card>
  `,
})
export class CodeScreen {
  readonly verified = output<void>();
  readonly back = output<void>();

  private readonly pin = viewChild.required(ArenaPinInput);

  protected readonly code = signal('');
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly twoFactor = TWO_FACTOR;

  protected verify(entered: string): void {
    if (entered === TWO_FACTOR.code) {
      this.verified.emit();
      return;
    }
    this.error.set('That code is not right. Check the latest text message and enter it again.');
    this.code.set('');
    this.pin().focus();
  }
}
