import Where from "./Where";
import { WorkflowFile } from '../wbr-types/workflow';
import What from "./What";
import { useDrag } from 'react-dnd';
import { DropTypes } from "./tiny";
import { useContext } from 'react';
import { CollapseContext, HoverContext } from './functions/globalState';

type PairType = WorkflowFile['workflow'][number] & {_reactID: string};

export default function Pair({pair, updater}: {pair: PairType, updater: Function}) : JSX.Element {
    const updateWhere = (where: typeof pair.where) => {
        updater({
            ...pair,
            where: where
        })
    }

    const updateWhat = (what: typeof pair.what) => {
        updater({
            ...pair,
            what: what
        })
    }

    const deletePair = () => updater({});

    const { isHovering, setHovering } = useContext(HoverContext);
    const { isCollapsed } = useContext(CollapseContext);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: DropTypes.Pair,
        item: {_reactID: pair._reactID},
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging()
        }),
        end: () => {
            setHovering(false);
        },
    }), [pair._reactID]);

    return (
        <div className='pair'
            ref={drag}
            onDrag={() => {setHovering(true)}}
            style={{
                backgroundColor: isDragging ? 'rgba(0,128,128,0.1)' : '',
            }}
        >
            <div className='pairHeader'>
                <h1>{pair.id}</h1><div className="deleteButton" onClick={deletePair}>x</div>
            </div>
            <div className='pairBody' style={{display: isCollapsed || isHovering ? 'none' : ''}}>
                <h2>If...</h2>
                <Where where={pair.where} updater={updateWhere}/>
                <h2>Then...</h2>
                <What what={pair.what} updater={updateWhat}/>
            </div>
        </div>
    )
}