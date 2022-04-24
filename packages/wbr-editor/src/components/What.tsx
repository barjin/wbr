import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import update from 'immutability-helper';
import { What as StepType } from '../wbr-types/workflow';
import UpdaterFactory from './functions/UpdaterFactory';
import { DropTypes, RenderValue } from './tiny';
import { DeleteButton, Select } from './tiny/Controls';

function WhatStep({
  idx, step, reorder, updater,
}:
{ idx: number, step: StepType, updater: Function, reorder: Function }): JSX.Element {
  const ref = useRef<HTMLElement>(null);

  const updateArgs = (args: StepType['args']) => {
    updater({
      ...step,
      args,
    });
  };

  const [,drag] = useDrag(() => ({
    type: DropTypes.Action,
    item: { idx },
    canDrag: true,
  }));

  let direction : string;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: DropTypes.Action,
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    hover: (item, monitor) => {
      ref.current?.classList.remove('up');
      ref.current?.classList.remove('down');

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect!.bottom - hoverBoundingRect!.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect!.top;

      if (hoverClientY < hoverMiddleY) {
        ref.current?.classList.add('up');
        direction = 'up';
        return;
      }
      ref.current?.classList.add('down');
      direction = 'down';
    },
    drop: (item: any) => {
      if (item.idx !== idx) {
        reorder(item.idx, idx + (direction === 'down' ? 1 : 0));
      }
    },
  }), [reorder, idx]);

  if (!isOver) {
    ref.current?.classList.remove('up');
    ref.current?.classList.remove('down');
  }

  const deleteStep = () => updater({});

  return <div ref={drop(drag(ref)) as any} style={{ transition: '0.2s ease all' }}>
        <div className='whatStep'>
            <div className='whatHeader'>
                <p className='whatName'>{step.action}</p>
                <div className='spacer'/>
                <DeleteButton callback={deleteStep}/>
            </div>
            <div className='whatBody'>
                {step.args ? <RenderValue val={step.args} updater={updateArgs}/> : <></>}
            </div>
        </div>
    </div>;
}

const ActionDefaults = {
  click: ['selector'],
  goto: ['url'],
  scrape: undefined,
  scrapeSchema: [{
    'first column name': 'selector',
    'second column name': 'selector',
  }],
  waitForLoadState: ['load'],
  fill: ['selector', 'text'],
  'keyboard.press': ['Enter'],
};

export default function What(
  { what, updater }: { what: StepType[], updater: (x: StepType[]) => void },
) : JSX.Element {
  const instantiateAction = (name: keyof typeof ActionDefaults) : void => {
    updater(
      [...what, {
        action: name,
        args: ActionDefaults[name],
      } as any],
    );
  };

  const updateStep = UpdaterFactory.ArrayIdxUpdater(what, updater, { deleteEmpty: true });

  const moveStep = (from: number, to: number) => {
    const pair = what[from];
    const pairIdx = from;

    updater(update(what, {
      $splice: [[pairIdx, 1], [to - (to > pairIdx ? 1 : 0), 0, pair!]],
    }));
  };

  return (
    <div>
        {what.map((x, i) => (
          <WhatStep idx={i} step={x} reorder={moveStep} updater={updateStep(i)}/>
        ))}
        <Select options={Object.keys(ActionDefaults)} select={instantiateAction}/>
    </div>
  );
}

// export default memo(What, (prev, next) => objectEquality(prev.what, next.what));
