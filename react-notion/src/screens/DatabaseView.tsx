import React, { useState } from 'react';
import {
  ArenaAvatar,
  ArenaBreadcrumbs,
  ArenaButton,
  ArenaIconButton,
  ArenaInput,
  ArenaMenu,
  ArenaTab,
  ArenaTabs,
  ArenaTable,
  ArenaTableCell,
  ArenaTableRow,
  ArenaTag,
  ArenaBoard,
  ArenaBoardColumn,
} from '@dravensoft/arena-react';
import type { ArenaTableColumn, ArenaTagTone } from '@dravensoft/arena-react';
import { BOARD_COLUMNS, TAG_SLOT, TASKS } from '../data/Workspace';
import type { Task } from '../data/Workspace';

const CRUMBS = [
  { label: 'Acme Platform', href: '#/' },
  { label: 'Engineering', href: '#/engineering' },
  { label: 'Sprint tasks' },
];

const COLUMNS: ArenaTableColumn[] = [
  { header: 'Name' },
  { header: 'Status' },
  { header: 'Owner' },
  { header: 'Tags' },
  { header: 'Due', key: 'due' },
  { header: 'Effort', key: 'effort', numeric: true },
];

const STATUS_TONE: Record<Task['status'], ArenaTagTone> = {
  'Not started': 'neutral',
  'In progress': 'neutral',
  'In review': 'warning',
  Done: 'success',
};

function Tags({ tags }: { tags: readonly string[] }) {
  return (
    <span className="tags">
      {tags.map((tag) => <ArenaTag key={tag} colorId={TAG_SLOT[tag] ?? 1}>{tag}</ArenaTag>)}
    </span>
  );
}

function Toolbar({ query, onQuery }: { query: string; onQuery: (next: string) => void }) {
  return (
    <div className="db__toolbar">
      <div className="db__toolbar-spacer" />
      <div className="db__search">
        <ArenaInput
          type="search"
          placeholder="Search tasks"
          icon="ph-bold ph-magnifying-glass"
          value={query}
          onChange={onQuery}
        />
      </div>
      <ArenaMenu
        align="end"
        items={[
          { header: 'Filter' },
          { label: 'Status', icon: 'ph-bold ph-circle-half' },
          { label: 'Owner', icon: 'ph-bold ph-user' },
          { label: 'Due date', icon: 'ph-bold ph-calendar-blank' },
        ]}
        trigger={<ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-funnel">Filter</ArenaButton>}
      />
      <ArenaMenu
        align="end"
        items={[
          { header: 'Sort by' },
          { label: 'Due date', icon: 'ph-bold ph-sort-ascending' },
          { label: 'Effort', icon: 'ph-bold ph-sort-descending' },
        ]}
        trigger={<ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-arrows-down-up">Sort</ArenaButton>}
      />
      <ArenaButton className="arena-size-sm" icon="ph-bold ph-plus">New</ArenaButton>
    </div>
  );
}

function BoardCard({ task }: { task: Task }) {
  return (
    <article className="board__card">
      <p className="board__name">{task.name}</p>
      <Tags tags={task.tags} />
      <footer className="board__foot">
        <span className="board__owner">
          <ArenaAvatar name={task.owner} src={task.ownerImage} className="arena-size-xs" />
          {task.owner}
        </span>
        <span className="board__due arena-num">{task.due}</span>
      </footer>
    </article>
  );
}

export function DatabaseView() {
  const [view, setView] = useState('table');
  const [query, setQuery] = useState('');

  const rows = TASKS.filter((task) => task.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="doc">
      <header className="topbar">
        <ArenaBreadcrumbs ariaLabel="Page location" items={CRUMBS} />
        <div className="topbar__actions">
          <ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-share-network">Share</ArenaButton>
          <ArenaIconButton icon="ph-bold ph-dots-three" label="More actions" className="arena-size-sm" />
        </div>
      </header>

      <div className="doc__scroll">
        <div className="db">
          <div className="db__head">
            <div className="doc__icon doc__icon--inline">
              <i className="ph-fill ph-kanban" aria-hidden="true" />
            </div>
            <h1 className="doc__title doc__title--db">Sprint tasks</h1>
          </div>

          <div className="db__views" style={{ '--arena-column-due-align': 'right', '--arena-column-effort-align': 'right' } as React.CSSProperties}>
            <ArenaTabs value={view} onChange={setView}>
              <ArenaTab value="table" label="Table">
                <Toolbar query={query} onQuery={setQuery} />
                <ArenaTable label="Sprint tasks" columns={COLUMNS}>
                  {rows.map((task) => (
                    <ArenaTableRow key={task.id} interactive>
                      <ArenaTableCell>
                        <span className="db__name">
                          <i className="ph-bold ph-file-text" aria-hidden="true" />
                          {task.name}
                        </span>
                      </ArenaTableCell>
                      <ArenaTableCell><ArenaTag tone={STATUS_TONE[task.status]} className={task.status === 'In progress' ? 'arena-accent-primary' : undefined}>{task.status}</ArenaTag></ArenaTableCell>
                      <ArenaTableCell>
                        <span className="db__owner">
                          <ArenaAvatar name={task.owner} src={task.ownerImage} className="arena-size-xs" />
                          {task.owner}
                        </span>
                      </ArenaTableCell>
                      <ArenaTableCell><Tags tags={task.tags} /></ArenaTableCell>
                      <ArenaTableCell>{task.due}</ArenaTableCell>
                      <ArenaTableCell>{task.effort}</ArenaTableCell>
                    </ArenaTableRow>
                  ))}
                </ArenaTable>
              </ArenaTab>

              <ArenaTab value="board" label="Board">
                <Toolbar query={query} onQuery={setQuery} />
                <ArenaBoard label="Sprint tasks by status">
                  {BOARD_COLUMNS.map((status) => {
                    const column = rows.filter((task) => task.status === status);
                    return (
                      <ArenaBoardColumn key={status} title={status} count={column.length}
                        action={<ArenaIconButton icon="ph-bold ph-plus" label={`Add to ${status}`} className="arena-size-sm" />}
                        footer={<ArenaButton className="arena-emphasis-ghost arena-size-sm arena-fill" icon="ph-bold ph-plus">New</ArenaButton>}>
                        {column.map((task) => <BoardCard key={task.id} task={task} />)}
                      </ArenaBoardColumn>
                    );
                  })}
                </ArenaBoard>
              </ArenaTab>
            </ArenaTabs>
          </div>
        </div>
      </div>
    </div>
  );
}
