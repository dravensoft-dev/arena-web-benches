import React from 'react';
import { ArenaBoard, ArenaBoardColumn, ArenaButton, ArenaIcon, ArenaIconButton, ArenaProgressBar } from '@dravensoft/arena-react';
import { Assignees, PriorityFlag, Tags } from '../Chrome';
import { STATUS_ORDER, STATUS_SLOT, TASKS } from '../data/Space';
import type { Status, Task } from '../data/Space';

function Card({ task }: { task: Task }) {
  return (
    <article className="kcard">
      <header className="kcard__head">
        <span className="kcard__id arena-num">{task.id}</span>
        <PriorityFlag priority={task.priority} />
        <span className="kcard__gap" />
        <ArenaIconButton icon="ph-bold ph-dots-three" label={`Actions for ${task.name}`} className="arena-size-sm" />
      </header>

      <p className="kcard__name">{task.name}</p>
      <Tags tags={task.tags} />

      {task.progress > 0 && task.progress < 100 && (
        <ArenaProgressBar label={`${task.name} progress`} progressPercentage={task.progress} className="arena-size-sm" showLabel={false} showPercentage={false} />
      )}

      <footer className="kcard__foot">
        <Assignees ids={task.assignees} />
        <span className="kcard__gap" />
        <span className="kcard__stat"><ArenaIcon icon="ph-bold ph-chat-circle" />{task.comments}</span>
        <span className="kcard__stat"><ArenaIcon icon="ph-bold ph-tree-structure" />{task.subtasks}</span>
        <span className="kcard__due arena-num">{task.due}</span>
      </footer>
    </article>
  );
}

export function BoardView() {
  return (
    <div className="screen">
      <div className="toolbar">
        <span className="toolbar__label">Grouped by status</span>
        <div className="toolbar__gap" />
        <ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-funnel">Filter</ArenaButton>
        <ArenaButton className="arena-emphasis-ghost arena-size-sm" icon="ph-bold ph-users-three">Me mode</ArenaButton>
        <ArenaButton className="arena-size-sm" icon="ph-bold ph-plus">Add task</ArenaButton>
      </div>

      <ArenaBoard label="Sprint 32 tasks by status">
        {STATUS_ORDER.map((status: Status) => {
          const column = TASKS.filter((task) => task.status === status);
          const points = column.reduce((sum, task) => sum + task.points, 0);
          return (
            <ArenaBoardColumn key={status} title={status} count={column.length}
              summary={`${points} pts`} colorId={STATUS_SLOT[status]}
              action={<ArenaIconButton icon="ph-bold ph-plus" label={`Add a task to ${status}`} className="arena-size-sm" />}
              footer={<ArenaButton className="arena-emphasis-ghost arena-size-sm arena-fill" icon="ph-bold ph-plus">Add task</ArenaButton>}>
              {column.map((task) => <Card key={task.id} task={task} />)}
            </ArenaBoardColumn>
          );
        })}
      </ArenaBoard>
    </div>
  );
}
