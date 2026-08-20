import React from 'react';
import { ArenaAvatar, ArenaButton, ArenaCard, ArenaPeopleList, ArenaPersonRow, arenaCatColor } from '@dravensoft/arena-react';
import { ACHIEVEMENTS, LEAGUE, STATS } from '../data/Course';

export function ProfileScreen() {
  return (
    <div className="profile">
      <header className="profile__head">
        <ArenaAvatar name="Juno Reyes" src="/img/l4.jpg" size="lg" />
        <div className="profile__who">
          <h1 className="profile__name">Juno Reyes</h1>
          <p className="profile__handle">juno_reyes &middot; Joined March 2024</p>
          <p className="profile__follows">
            <strong className="arena-num">64</strong> following &nbsp;
            <strong className="arena-num">51</strong> followers
          </p>
        </div>
        <span className="profile__gap" />
        <ArenaButton icon="ph-bold ph-share-network">Share</ArenaButton>
      </header>

      <section className="block">
        <h2 className="block__title">Statistics</h2>
        <div className="stats">
          {STATS.map((stat) => (
            <div key={stat.id} className="stat">
              <span className="stat__icon" style={{ color: arenaCatColor(stat.slot) }}>
                <i className={stat.icon} aria-hidden="true" />
              </span>
              <span className="stat__body">
                <span className="stat__value arena-num">{stat.value}</span>
                <span className="stat__label">{stat.label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <h2 className="block__title">Achievements</h2>
        <div className="achs">
          {ACHIEVEMENTS.map((ach) => {
            const pct = Math.round((ach.progress / ach.goal) * 100);
            return (
              <div key={ach.id} className="ach">
                <span className="ach__badge" style={{ background: arenaCatColor(ach.slot) }}>
                  <i className={ach.icon} aria-hidden="true" />
                  <span className="ach__level arena-num">{ach.level}</span>
                </span>
                <span className="ach__body">
                  <span className="ach__row">
                    <span className="ach__title">{ach.title}</span>
                    <span className="ach__count arena-num">{ach.progress}/{ach.goal}</span>
                  </span>
                  <span className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${ach.title} progress`}>
                    <span className="meter__fill" style={{ inlineSize: `${pct}%` }} />
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="block">
        <h2 className="block__title">Ruby league</h2>
        <ArenaCard>
          <ArenaPeopleList label="Ruby league standings" ordered>
            {LEAGUE.map((leader) => (
              <ArenaPersonRow key={leader.rank} rank={leader.rank} name={leader.name}
                src={leader.image} figure={`${leader.xp} XP`} current={leader.me} />
            ))}
          </ArenaPeopleList>
        </ArenaCard>
      </section>
    </div>
  );
}
