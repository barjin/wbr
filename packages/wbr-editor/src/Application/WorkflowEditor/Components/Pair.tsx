import { useDrag } from 'react-dnd';
import { useContext } from 'react';
import { WorkflowFile } from '@wbr-project/wbr-interpret';
import Where from './Where';
import What from './What';
import { DropTypes } from './DropTypes';
import { CollapseContext, HoverContext } from '../Utils/GlobalStates';
import EditableHeading from '../Editables/EditableHeading';

type PairType = WorkflowFile['workflow'][number] & { _reactID: string };
export default function Pair(
  { pair, updater, active }:
  { pair: PairType, updater: Function, active: boolean },
) : JSX.Element {
  const updateWhere = (where: typeof pair.where) => {
    updater({
      ...pair,
      where,
    });
  };

  const updateWhat = (what: typeof pair.what) => {
    updater({
      ...pair,
      what,
    });
  };

  const deletePair = () => updater({});

  const { isHovering, setHovering } = useContext(HoverContext);
  const { isCollapsed } = useContext(CollapseContext);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: DropTypes.Pair,
    item: () => {
      setHovering(true);
      return { _reactID: pair._reactID };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: () => {
      setHovering(false);
    },
  }), [pair._reactID]);

  return (
        <div className='pair'
            ref={drag}
            style={{
              backgroundColor: isDragging ? 'rgba(0,128,128,0.1)' : '',
              border: active ? '3px solid blue' : '',
            }}
        >
            <div className='pairHeader'>
                <EditableHeading text={pair.id ?? 'Pair ID'} updater={(newId: string) => { updater({ ...pair, id: newId }); }}/>
                <div className="deleteButton" onClick={deletePair}>x</div>
            </div>
            <div className='pairBody' style={{ display: isCollapsed || isHovering ? 'none' : '' }}>
                <div className="where">
                  <h2>
                    If...
                  </h2>
                  <Where where={pair.where} updater={updateWhere} base={true}/>
                </div>
                <div className="what">
                <h2>Then...</h2>
                <What id={pair._reactID} what={pair.what} updater={updateWhat} />
                </div>
            </div>
        </div>
  );
}
