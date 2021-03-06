import { useContext, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';

import { AiOutlineNodeCollapse, AiOutlineNodeExpand } from 'react-icons/ai';
import { WorkflowFile } from '@wbr-project/wbr-interpret';
import UpdaterFactory from './Utils/UpdaterFactory';
import Pair from './Components/Pair';
import DropZone from './Components/DropZone';
import { HoverContext, CollapseContext, TutorialContext } from './Utils/GlobalStates';
import Button from '../Reusables/Button';
import { DropTypes } from './Components/DropTypes';

type WhereWhatPair = WorkflowFile['workflow'][number];

const emptyPair = {
  where: {
    $and: [],
  },
  what: [],
};

export default function WorkflowEditor({ workflow, setWorkflow, currentIdx }: { workflow: WorkflowFile['workflow'], setWorkflow: (pairs: WhereWhatPair[]) => void, currentIdx: number }) : JSX.Element {
  const [isHovering, setHovering] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);

  const { nextStep } = useContext(TutorialContext);

  const updatePair = UpdaterFactory.ArrayIdxUpdater(workflow, setWorkflow, { deleteEmpty: true });

  const pushPair = UpdaterFactory.ArrayPusher(workflow, setWorkflow);

  const movePair = (to: number) => (from: string) => {
    const pair = workflow.find((p: any) => p._reactID === from);
    const pairIdx = workflow.findIndex((p: any) => p._reactID === from);

    setWorkflow(update(workflow, {
      $splice: [[pairIdx, 1], [to - (to > pairIdx ? 1 : 0), 0, pair!]],
    }));
  };

  return (
        <div id='workflowEditor' style={{ display: 'block', position: 'relative' }}>
        <div className='stickyTools' style={{
          position: 'absolute', height: '100%', width: '25%', left: '-25%',
        }}>
          <Button
              icon={!isCollapsed ? <AiOutlineNodeCollapse/> : <AiOutlineNodeExpand/>}
              text={!isCollapsed ? 'Collapse rules' : 'Expand rules'}
              onClick={() => { setCollapsed(!isCollapsed); }}
              style={{ position: 'sticky', width: '80%', top: '10px' }}
          />
        </div>
        <CollapseContext.Provider value={{ isCollapsed, setCollapsed: (setCollapsed as any) }}>
            <HoverContext.Provider value={{ isHovering, setHovering: (setHovering as any) }}>
                <DndProvider backend={HTML5Backend}>
                    <DropZone active={isHovering}
                    key={Math.random()} type={DropTypes.Pair} swap={movePair(0)}/>
                    {workflow.map((pair, i) => (
                    <>
                        <Pair
                            updater={updatePair(i)}
                            pair={pair as any}
                            key={(pair as any)._reactID}
                            active={i === currentIdx}
                        />
                        <DropZone
                        active={isHovering}
                        type={DropTypes.Pair}
                        key={Math.random()} swap={movePair(i + 1)}/>
                    </>
                    ))}
                </DndProvider>
            </HoverContext.Provider>
        </CollapseContext.Provider>
        <div style={{ marginBottom: '50px' }} className="button primary" onClick={() => {
          pushPair()(emptyPair);
          nextStep();
        }}>+</div>
        </div>
  );
}
