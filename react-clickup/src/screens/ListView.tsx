import React, { useState } from 'react';
import {
  ArenaBulkActionBar,
  ArenaButton,
  ArenaCheckbox,
  ArenaIcon,
  ArenaIconButton,
  ArenaInput,
  ArenaMenu,
  ArenaProgressBar,
  ArenaSegmentedControl,
  arenaCatColor,
} from '@dravensoft/arena-react';
import { Assignees, PriorityFlag, StatusDot, StatusPill, Tags } from '../Chrome';
import { STATUS_ORDER, STATUS_SLOT, TASKS } from '../data/Space';
import type { Status, Task } from '../data/Space';

const GROUPINGS = [
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'priority', label: 'Priority' },
];

const BULK = [
  { id: 'status', label: 'Set status', icon: 'ph-bold ph-circle-half' },
  { id: 'assign', label: 'Assign', icon: 'ph-bold ph-user-plus' },
  { id: 'due', label: 'Set due date', icon: 'ph-bold ph-calendar-plus' },
  { id: 'delete', label: 'Delete', icon: 'ph-bold ph-trash', destructive: true },
];

function Row({
  task,
  checked,
  onCheck,
}: {
  task: Task;
  checked: boolean;
  onCheck: (id: string, next: boolean) => void;
}) {
  return (
    <div className="row" data-checked={checked ? 'yes' : 'no'}>
      <span className="row__check"><ArenaCheckbox checked={checked} onChange={(next) => onCheck(task.id, next)} /></span>
      <span className="row__grip"><ArenaIcon icon="ph-bold ph-dots-six-vertical" /></span>
      <span className="row__name">
        <span className="row__title">{task.name}</span>
        <span className="row__meta">
          <span className="row__id arena-num">{task.id}</span>
          {task.subtasks > 0 && (
            <span className="row__chip"><ArenaIcon icon="ph-bold ph-tree-structure" />{task.subtasks}</span>
          )}
          {task.comments > 0 && (
            <span className="row__chip"><ArenaIcon icon="ph-bold ph-chat-circle" />{task.comments}</span>
          )}
        </span>
      </span>
      <span className="row__cell"><StatusPill status={task.status} /></span>
      <span className="row__cell"><Assignees ids={task.assignees} /></span>
      <span className="row__cell"><PriorityFlag priority={task.priority} /></span>
      <span className="row__cell row__cell--date arena-num">{task.due}</span>
      <span className="row__cell row__cell--bar">
        <ArenaProgressBar label={`${task.name} progress`} progressPercentage={task.progress} className="arena-size-sm" showLabel={false} showPercentage={false} />
      </span>
      <span className="row__cell row__cell--tags"><Tags tags={task.tags} /></span>
      <span className="row__cell row__cell--pts arena-num">{task.points}</span>
      <span className="row__cell">
        <ArenaMenu
          align="end"
          items={[
            { label: 'Open task', icon: 'ph-bold ph-arrow-square-out' },
            { label: 'Copy link', icon: 'ph-bold ph-link' },
            { label: 'Duplicate', icon: 'ph-bold ph-copy' },
            { divider: true },
            { label: 'Delete', icon: 'ph-bold ph-trash', destructive: true },
          ]}
          trigger={<ArenaIconButton icon="ph-bold ph-dots-three" label={`Actions for ${task.name}`} className="arena-size-sm" />}
        />
      </span>
    </div>
  );
}

export function ListView() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [grouping, setGrouping] = useState('status');

  const rows = TASKS.filter((task) => task.name.toLowerCase().includes(query.toLowerCase()));
  const selected = Object.keys(checked).filter((id) => checked[id]);

  const onCheck = (id: string, next: boolean) => setChecked((prev) => ({ ...prev, [id]: next }));

  return (
    <div className="screen">
      <div className="toolbar">
        <ArenaSegmentedControl
          ariaLabel="Group tasks by"
          options={GROUPINGS}
          value={grouping}
          onChange={setGrouping}
          className="arena-size-sm"
        />
        <div className="toolbar__gap" />
        <div className="toolbar__search">
          <ArenaInput type="search" placeholder="Search tasks" icon="ph-bold ph-magnifying-glass" value={query} onChange={setQuery} />
        </div>
        <ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-funnel">Filter</ArenaButton>
        <ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-eye">Show</ArenaButton>
        <ArenaButton className="arena-size-sm" icon="ph-bold ph-plus">Add task</ArenaButton>
      </div>

      <div className="list">
        {STATUS_ORDER.map((status: Status) => {
          const group = rows.filter((task) => task.status === status);
          if (group.length === 0) return null;
          const points = group.reduce((sum, task) => sum + task.points, 0);
          return (
            <section key={status} className="group">
              <header className="group__head" style={{ borderInlineStartColor: arenaCatColor(STATUS_SLOT[status]) }}>
                <span className="group__caret" aria-hidden="true"><ArenaIcon icon="ph-bold ph-caret-down" /></span>
                <StatusDot status={status} />
                <h2 className="group__name">{status}</h2>
                <span className="group__count arena-num">{group.length}</span>
                <span className="group__gap" />
                <span className="group__points arena-num">{points} pts</span>
                <ArenaIconButton icon="ph-bold ph-plus" label={`Add a task to ${status}`} className="arena-size-sm" />
              </header>

              <div className="group__head-row">
                <span />
                <span />
                <span>Name</span>
                <span>Status</span>
                <span>Assignees</span>
                <span>Priority</span>
                <span>Due</span>
                <span>Progress</span>
                <span>Tags</span>
                <span>Pts</span>
                <span />
              </div>

              {group.map((task) => (
                <Row key={task.id} task={task} checked={Boolean(checked[task.id])} onCheck={onCheck} />
              ))}
            </section>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="bulk">
          <ArenaBulkActionBar
            count={selected.length}
            noun="task"
            actions={BULK}
            clearable
            onClear={() => setChecked({})}
          />
        </div>
      )}
    </div>
  );
}
