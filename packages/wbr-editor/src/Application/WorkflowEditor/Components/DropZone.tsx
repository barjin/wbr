import { useDrop } from 'react-dnd';
import { DropTypes } from './DropTypes';

export default function DropZone(
  {
    swap, type, active, key,
  } : { key: number, swap: Function, type: DropTypes, active: boolean },
) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: type,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
    drop: (item) => {
      swap((item as any)._reactID);
    },
  }), [swap, key]);

  return (
    <div className={`dropZone ${isOver ? 'expand' : ''}`}>
        <div
            ref={drop}
            className={`${active ? 'dropZoneActive' : ''}`}
        >
        </div>
    </div>
  );
}
