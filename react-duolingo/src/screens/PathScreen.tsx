import React from 'react';
import { ArenaAvatar, ArenaButton, ArenaIcon, ArenaCard, ArenaPeopleList, ArenaPersonRow, ArenaProgressBar, arenaCatColor } from '@dravensoft/arena-react';
import {
  GEMS,
  HEARTS,
  HEART_MAX,
  LEAGUE,
  NODE_ICON,
  STREAK,
  UNITS,
  XP_GOAL,
  XP_TODAY,
} from '../data/Course';
import type { PathNode, Unit } from '../data/Course';

function Node({ node, slot, onStart }: { node: PathNode; slot: number; onStart: () => void }) {
  const colour = node.state === 'locked' ? 'var(--color-base-300)' : arenaCatColor(slot);
  const button = (
    <button
      type="button"
      className="node__btn"
      data-state={node.state}
      style={{ background: colour }}
      aria-label={`${node.label}, ${node.state}`}
      onClick={onStart}
    >
      <ArenaIcon icon={node.state === 'locked' ? 'ph-fill ph-lock-simple' : NODE_ICON[node.kind]} />
    </button>
  );
  return (
    <div className="node" style={{ marginInlineStart: `calc(var(--sp-12) * ${node.offset})` }}>
      {node.state === 'active' ? (
        <ArenaProgressBar
          shape="radial"
          className="arena-size-lg"
          showLabel={false}
          showPercentage={false}
          progressPercentage={node.progress ?? 0}
          label={`${node.label} progress`}
        >
          {button}
        </ArenaProgressBar>
      ) : button}
      {node.state === 'active' && <span className="node__bubble">Start</span>}
    </div>
  );
}

function UnitBlock({ unit, onStart }: { unit: Unit; onStart: () => void }) {
  return (
    <section className="unit">
      <header className="unit__head" style={{ background: arenaCatColor(unit.slot) }}>
        <div className="unit__text">
          <span className="unit__eyebrow">Unit {unit.number}</span>
          <h2 className="unit__title">{unit.title}</h2>
          <p className="unit__blurb">{unit.blurb}</p>
        </div>
        <button type="button" className="unit__guide">
          <ArenaIcon icon="ph-fill ph-book-open-text" />
          Guidebook
        </button>
      </header>

      <div className="path">
        {unit.nodes.map((node) => (
          <Node key={node.id} node={node} slot={unit.slot} onStart={onStart} />
        ))}
      </div>
    </section>
  );
}

export function PathScreen({ onStart }: { onStart: () => void }) {
  const pct = Math.round((XP_TODAY / XP_GOAL) * 100);

  return (
    <div className="path-screen">
      <div className="path-screen__main">
        {UNITS.map((unit) => <UnitBlock key={unit.id} unit={unit} onStart={onStart} />)}
      </div>

      <aside className="rail">
        <div className="rail__row">
          <span className="chip chip--streak"><ArenaIcon icon="ph-fill ph-fire" />{STREAK}</span>
          <span className="chip chip--gems"><ArenaIcon icon="ph-fill ph-diamond" />{GEMS}</span>
          <span className="chip chip--hearts">
            <ArenaIcon icon="ph-fill ph-heart" />{HEARTS}
            <span className="chip__of">/{HEART_MAX}</span>
          </span>
        </div>

        <ArenaCard title="Daily quest">
          <div className="quest">
            <span className="quest__icon" style={{ background: arenaCatColor(4) }}>
              <ArenaIcon icon="ph-fill ph-lightning" />
            </span>
            <div className="quest__body">
              <p className="quest__name">Earn {XP_GOAL} XP</p>
              <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Daily quest progress">
                <span className="meter__fill" style={{ inlineSize: `${pct}%` }} />
                <span className="meter__text arena-num">{XP_TODAY} / {XP_GOAL}</span>
              </div>
            </div>
          </div>
        </ArenaCard>

        <ArenaCard title="Ruby league" eyebrow="Top 10 advance">
          <ArenaPeopleList label="Ruby league standings" ordered className="arena-size-sm">
            {LEAGUE.slice(0, 5).map((leader) => (
              <ArenaPersonRow key={leader.rank} rank={leader.rank} name={leader.name}
                src={leader.image} figure={`${leader.xp} XP`} current={leader.me} />
            ))}
          </ArenaPeopleList>
        </ArenaCard>

        <ArenaCard title="Unlock Super">
          <p className="rail__blurb">No ads, unlimited hearts, and a personalised practice hub.</p>
          <ArenaButton className="arena-fill" icon="ph-bold ph-crown-simple">Try 2 weeks free</ArenaButton>
        </ArenaCard>
      </aside>
    </div>
  );
}
