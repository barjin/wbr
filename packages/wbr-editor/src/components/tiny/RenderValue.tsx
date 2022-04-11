import {EditableArray, EditableObject, EditableValue, IInputOptions} from '.';

export default function RenderValue<T extends unknown>({val, updater, options} : {val: T, updater: (x: T) => void, options?: IInputOptions}) : JSX.Element {
    const type = typeof val;
    switch (type) {
        case 'object':
            return Array.isArray(val) ? 
            <EditableArray array={val} {...{updater, options}}/> : 
            <EditableObject object={val as Record<string, unknown>} {...{updater, options}}/>;
        default:
            return <EditableValue val={val} updater={updater}/>
    }
}