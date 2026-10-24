import React, { useState } from 'react';
import {
  ArenaAccordion,
  ArenaAccordionItem,
  ArenaCheckbox,
  ArenaDivider,
  ArenaFigure,
  ArenaIcon,
  ArenaLink,
} from '@dravensoft/arena-react';
import type { Block, Run } from './data/Workspace';
import type { Screen } from './Sidebar';

function Todo({ text, done }: { text: string; done: boolean }) {
  const [checked, setChecked] = useState(done);
  return (
    <div className="block block--todo" data-done={checked ? 'yes' : 'no'}>
      <ArenaCheckbox checked={checked} label={text} onChange={setChecked} />
    </div>
  );
}

function Rich({ runs, onScreen }: { runs: readonly Run[]; onScreen: (next: Screen) => void }) {
  return (
    <p className="block block--text">
      {runs.map((run, index) => {
        if ('screen' in run) {
          return <ArenaLink key={index} href={run.href} onNavigate={() => onScreen(run.screen)}>{run.text}</ArenaLink>;
        }
        if ('external' in run) {
          return <ArenaLink key={index} href={run.href} external>{run.text}</ArenaLink>;
        }
        return <React.Fragment key={index}>{run.text}</React.Fragment>;
      })}
    </p>
  );
}

export function Blocks({ blocks, onScreen }: { blocks: readonly Block[]; onScreen: (next: Screen) => void }) {
  return (
    <div className="blocks">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        switch (block.kind) {
          case 'h1':
            return <h1 key={key} className="block block--h1">{block.text}</h1>;
          case 'h2':
            return <h2 key={key} className="block block--h2">{block.text}</h2>;
          case 'h3':
            return <h3 key={key} className="block block--h3">{block.text}</h3>;
          case 'text':
            return <p key={key} className="block block--text">{block.text}</p>;
          case 'rich':
            return <Rich key={key} runs={block.runs} onScreen={onScreen} />;
          case 'bullet':
            return (
              <div key={key} className="block block--list">
                <span className="list__marker" aria-hidden="true">&bull;</span>
                <span>{block.text}</span>
              </div>
            );
          case 'numbered':
            return (
              <div key={key} className="block block--list">
                <span className="list__marker list__marker--num" aria-hidden="true">{block.index}.</span>
                <span>{block.text}</span>
              </div>
            );
          case 'todo':
            return <Todo key={key} text={block.text} done={block.done} />;
          case 'quote':
            return <blockquote key={key} className="block block--quote">{block.text}</blockquote>;
          case 'callout':
            return (
              <aside key={key} className="block block--callout">
                <span className="callout__icon" aria-hidden="true"><ArenaIcon icon={block.icon} /></span>
                <p className="callout__text">{block.text}</p>
              </aside>
            );
          case 'toggles':
            return (
              <div key={key} className="block block--toggles">
                <ArenaAccordion multiple>
                  {block.items.map((item) => (
                    <ArenaAccordionItem key={item.value} value={item.value} label={item.label}>
                      <p className="toggle__body">{item.body}</p>
                    </ArenaAccordionItem>
                  ))}
                </ArenaAccordion>
              </div>
            );
          case 'code':
            return (
              <div key={key} className="block block--code">
                <span className="code__lang">{block.language}</span>
                <pre className="code__pre"><code>{block.text}</code></pre>
              </div>
            );
          case 'divider':
            return (
              <div key={key} className="block block--divider">
                <ArenaDivider label={block.label} />
              </div>
            );
          case 'image':
            return (
              <div key={key} className="block block--figure">
                <ArenaFigure
                  className="arena-ratio-video"
                  caption={block.caption}
                  media={<img src={block.src} alt={block.caption} />}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
