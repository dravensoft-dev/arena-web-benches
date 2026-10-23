import React, { useState } from 'react';
import { ArenaButton, ArenaIcon, ArenaIconButton, arenaCatColor } from '@dravensoft/arena-react';
import { HEARTS, QUESTION } from '../data/Course';

type Phase = 'asking' | 'right' | 'wrong';

export function LessonScreen({ onQuit }: { onQuit: () => void }) {
  const asked = new URLSearchParams(window.location.search).get('phase');
  const [picked, setPicked] = useState<string | null>(asked ? 'c1' : null);
  const [phase, setPhase] = useState<Phase>(
    asked === 'right' || asked === 'wrong' ? (asked as Phase) : 'asking',
  );

  const chosen = QUESTION.choices.find((choice) => choice.id === picked);

  const check = () => {
    if (!chosen) return;
    setPhase(chosen.correct ? 'right' : 'wrong');
  };

  const next = () => {
    setPicked(null);
    setPhase('asking');
  };

  return (
    <div className="lesson" data-phase={phase}>
      <header className="lesson__top">
        <ArenaIconButton icon="ph-bold ph-x" label="Quit the lesson" onClick={onQuit} />
        <div className="bar" role="progressbar" aria-valuenow={45} aria-valuemin={0} aria-valuemax={100} aria-label="Lesson progress">
          <span className="bar__fill" style={{ inlineSize: '45%' }} />
        </div>
        <span className="chip chip--hearts"><ArenaIcon icon="ph-fill ph-heart" />{HEARTS}</span>
      </header>

      <main className="lesson__body">
        <h1 className="lesson__prompt">{QUESTION.prompt}</h1>

        <p className="lesson__sentence">
          <button type="button" className="speak">
            <ArenaIcon icon="ph-fill ph-speaker-high" />
            <span className="arena-sr-only">Play the sentence</span>
          </button>
          {QUESTION.sentence}
        </p>

        <div className="choices">
          {QUESTION.choices.map((choice, index) => (
            <button
              key={choice.id}
              type="button"
              className="choice"
              data-picked={picked === choice.id ? 'yes' : 'no'}
              aria-pressed={picked === choice.id}
              disabled={phase !== 'asking'}
              onClick={() => setPicked(choice.id)}
            >
              <span className="choice__art" style={{ color: arenaCatColor(index + 1) }}>
                <ArenaIcon icon={choice.image} />
              </span>
              <span className="choice__label">{choice.label}</span>
              <span className="choice__key arena-num">{index + 1}</span>
            </button>
          ))}
        </div>
      </main>

      <footer className="lesson__foot">
        {phase === 'asking' && (
          <div className="foot__row">
            <ArenaButton className="arena-emphasis-ghost arena-size-lg" onClick={next}>Skip</ArenaButton>
            <span className="foot__gap" />
            <ArenaButton className="arena-size-lg" disabled={!picked} onClick={check}>Check</ArenaButton>
          </div>
        )}

        {phase === 'right' && (
          <div className="foot__row foot__row--right">
            <span className="verdict">
              <span className="verdict__mark"><ArenaIcon icon="ph-bold ph-check" /></span>
              <span className="verdict__text">
                <strong>Nicely done</strong>
                <span>{chosen?.label} means {chosen?.hint}</span>
              </span>
            </span>
            <span className="foot__gap" />
            <ArenaButton className="arena-size-lg" onClick={next}>Continue</ArenaButton>
          </div>
        )}

        {phase === 'wrong' && (
          <div className="foot__row foot__row--wrong">
            <span className="verdict">
              <span className="verdict__mark"><ArenaIcon icon="ph-bold ph-x" /></span>
              <span className="verdict__text">
                <strong>Not quite</strong>
                <span>The answer is <em>la cuenta</em>, the bill</span>
              </span>
            </span>
            <span className="foot__gap" />
            <ArenaButton className="arena-size-lg" destructive onClick={next}>Got it</ArenaButton>
          </div>
        )}
      </footer>
    </div>
  );
}
