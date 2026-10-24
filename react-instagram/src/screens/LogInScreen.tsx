import React, { useState } from 'react';
import { ArenaButton, ArenaInput, ArenaUnauthCard } from '@dravensoft/arena-react';
import { Wordmark } from '../Pieces';

export function LogInScreen({ onLogIn }: { onLogIn: () => void }) {
  const [who, setWho] = useState('');

  return (
    <div className="auth">
      <ArenaUnauthCard
        brand={<Wordmark />}
        title="Log in to see photos and videos from your friends"
        headingLevel="h1"
        footer={<a className="auth__link" href="#/reset">Forgot password?</a>}
      >
        <div className="auth__fields">
          <ArenaInput label="Phone number, username or email" autoComplete="username" value={who} onValueChange={setWho} />
          <ArenaInput label="Password" type="password" autoComplete="current-password" />
          <ArenaButton className="arena-fill" disabled={who.trim() === ''} onActivate={onLogIn}>Log in</ArenaButton>
        </div>
      </ArenaUnauthCard>

      <p className="auth__alt">
        Don't have an account? <a className="auth__link" href="#/signup">Sign up</a>
      </p>
    </div>
  );
}
