import React, { useRef, useState } from 'react';
import { ArenaButton, ArenaPinInput, ArenaUnauthCard } from '@dravensoft/arena-react';
import type { ArenaPinInputHandle } from '@dravensoft/arena-react';
import { Wordmark } from '../Pieces';
import { TWO_FACTOR } from '../data/Feed';

/* The two-factor step. The panel and the cells report; checking the code is this screen's. */
export function CodeScreen({ onVerified, onBack }: { onVerified: () => void; onBack: () => void }) {
  const pin = useRef<ArenaPinInputHandle>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  function verify(entered: string) {
    if (entered === TWO_FACTOR.code) {
      onVerified();
      return;
    }
    setError('That code is not right. Check the latest text message and enter it again.');
    setCode('');
    pin.current?.focus();
  }

  return (
    <div className="auth">
      <ArenaUnauthCard
        brand={<Wordmark />}
        title="Enter your security code"
        headingLevel="h1"
        footer={<a className="auth__link" href="#/login" onClick={onBack}>Back to log in</a>}
      >
        <div className="auth__fields">
          <p className="auth__lede">
            We sent a 6-digit code by text message to the number ending in {TWO_FACTOR.ending}.
          </p>
          <ArenaPinInput
            ref={pin}
            label="Security code"
            name="otp"
            value={code}
            error={error}
            onChange={(next) => { setCode(next); setError(undefined); }}
            onComplete={verify}
          />
          <ArenaButton className="arena-fill" disabled={code.length < 6} onClick={() => verify(code)}>Confirm</ArenaButton>
          <ArenaButton className="arena-emphasis-ghost arena-fill">Resend code</ArenaButton>
        </div>
      </ArenaUnauthCard>
    </div>
  );
}
