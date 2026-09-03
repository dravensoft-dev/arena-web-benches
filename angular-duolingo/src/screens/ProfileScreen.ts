import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ArenaAvatar, ArenaButton, ArenaCard, ArenaPeopleList, ArenaPersonRow, arenaCatColor,
} from '@dravensoft/arena-angular';
import { ACHIEVEMENTS, LEAGUE, STATS } from '../data/Course';

@Component({
  selector: 'app-profile-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArenaAvatar, ArenaButton, ArenaCard, ArenaPeopleList, ArenaPersonRow],
  host: { class: 'profile' },
  template: `
    <header class="profile__head">
      <arena-avatar name="Juno Reyes" src="img/l4.jpg" size="lg" />
      <div class="profile__who">
        <h1 class="profile__name">Juno Reyes</h1>
        <p class="profile__handle">juno_reyes &middot; Joined March 2024</p>
        <!-- On one line: see FINDINGS.md, difference 1. -->
        <p class="profile__follows"><strong class="arena-num">64</strong> following &nbsp;<strong class="arena-num">51</strong> followers</p>
      </div>
      <span class="profile__gap"></span>
      <arena-button icon="ph-bold ph-share-network">Share</arena-button>
    </header>

    <section class="block">
      <h2 class="block__title">Statistics</h2>
      <div class="stats">
        @for (stat of stats; track stat.id) {
          <div class="stat">
            <span class="stat__icon" [style.color]="cat(stat.slot)">
              <i [class]="stat.icon" aria-hidden="true"></i>
            </span>
            <span class="stat__body">
              <span class="stat__value arena-num">{{ stat.value }}</span>
              <span class="stat__label">{{ stat.label }}</span>
            </span>
          </div>
        }
      </div>
    </section>

    <section class="block">
      <h2 class="block__title">Achievements</h2>
      <div class="achs">
        @for (ach of achievements; track ach.id) {
          <div class="ach">
            <span class="ach__badge" [style.background]="cat(ach.slot)">
              <i [class]="ach.icon" aria-hidden="true"></i>
              <span class="ach__level arena-num">{{ ach.level }}</span>
            </span>
            <span class="ach__body">
              <span class="ach__row">
                <span class="ach__title">{{ ach.title }}</span>
                <span class="ach__count arena-num">{{ ach.progress }}/{{ ach.goal }}</span>
              </span>
              <span class="meter" role="progressbar" [attr.aria-valuenow]="pct(ach.progress, ach.goal)" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="ach.title + ' progress'">
                <span class="meter__fill" [style.inline-size.%]="pct(ach.progress, ach.goal)"></span>
              </span>
            </span>
          </div>
        }
      </div>
    </section>

    <section class="block">
      <h2 class="block__title">Ruby league</h2>
      <arena-card>
        <arena-people-list label="Ruby league standings" ordered>
          @for (leader of league; track leader.rank) {
            <arena-person-row [rank]="leader.rank" [name]="leader.name"
              [src]="leader.image" [figure]="leader.xp + ' XP'" [current]="leader.me" />
          }
        </arena-people-list>
      </arena-card>
    </section>
  `,
})
export class ProfileScreen {
  protected readonly stats = STATS;
  protected readonly achievements = ACHIEVEMENTS;
  protected readonly league = LEAGUE;
  protected readonly cat = arenaCatColor;

  protected pct(progress: number, goal: number): number {
    return Math.round((progress / goal) * 100);
  }
}
