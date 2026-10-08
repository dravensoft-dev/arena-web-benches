import React, { useState } from 'react';
import { ArenaCheckbox, ArenaFigure } from '@dravensoft/arena-react';
import type { Block } from './data/Workspace';

function Todo({ text, done }: { text: string; done: boolean }) {
  const [checked, setChecked] = useState(done);
  return (
    <div className="block block--todo" data-done={checked ? 'yes' : 'no'}>
      <ArenaCheckbox checked={checked} label={text} onChange={setChecked} />
    </div>
  );
}

function Toggle({ text, body }: { text: string; body: string }) {
  return (
    <details className="block block--toggle">
      <summary className="toggle__summary">
        <i className="ph-bold ph-caret-right toggle__caret" aria-hidden="true" />
        <span>{text}</span>
      </summary>
      <p className="toggle__body">{body}</p>
    </details>
  );
}

export function Blocks({ blocks }: { blocks: readonly Block[] }) {
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
                <i className={`${block.icon} callout__icon`} aria-hidden="true" />
                <p className="callout__text">{block.text}</p>
              </aside>
            );
          case 'toggle':
            return <Toggle key={key} text={block.text} body={block.body} />;
          case 'code':
            return (
              <div key={key} className="block block--code">
                <span className="code__lang">{block.language}</span>
                <pre className="code__pre"><code>{block.text}</code></pre>
              </div>
            );
          case 'divider':
            return <hr key={key} className="block block--divider" />;
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
