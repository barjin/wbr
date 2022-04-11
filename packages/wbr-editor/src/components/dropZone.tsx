import { useDrop } from 'react-dnd'
import { DropTypes } from './tiny'
import { useContext } from 'react'
import { HoverContext } from './functions/globalState'

export default function DropZone({swap} : {swap: Function}) {
    const { isHovering } = useContext(HoverContext);

    const [{ isOver }, drop] = useDrop(
        () => ({
            accept: DropTypes.Pair,
            collect: (monitor) => ({
                isOver: !!monitor.isOver(),
            }),
            drop: (item, monitor) => {
                swap((item as any)._reactID);
            }
        }),[swap])

    return (
    <div className={`dropZone ${isOver ? 'expand' : ''}`}>
        <div
            ref={drop}
            className={`${isHovering ? 'dropZoneActive' : ''}`}
        >
        </div>
    </div>
    )
}