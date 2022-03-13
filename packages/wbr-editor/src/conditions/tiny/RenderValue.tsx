import EditableArray from "./EditableArray";
import EditableObject from "./EditableObject";
import EditableValue from "./EditableValue";

export default function RenderValue<T extends unknown>({val, updater} : {val: T, updater: (x: T) => void}) : JSX.Element {
    const type = typeof val;
    switch (type) {
        case 'object':
            return Array.isArray(val) ? <EditableArray array={val} updater={updater}/> : <EditableObject object={val as Record<string, unknown>} updater={updater}/>;
        default:
            return <EditableValue val={val} updater={updater}/>
    }
}