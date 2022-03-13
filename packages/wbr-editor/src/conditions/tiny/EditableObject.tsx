// import { useState } from 'react';
import {EditableValue} from '.';

export default function EditableObject({object, updater} : {object: Record<string, unknown>, updater: Function}) : JSX.Element {
    // const [object, _setObject] = useState(val);

    const setObject = (object: Record<string,unknown>) : void => {
        const clean = Object.entries(object).filter(([k,x]) => !(k === "" && x === ""));
        updater(Object.fromEntries(clean));
        // _setObject(Object.fromEntries(clean));
    }

    const updateKey = (oldKey: string) : Function => (
        (newKey: string) => {
            const value = object[oldKey];
            const {[oldKey]: _, ...rest} = object;
            setObject({...rest, [newKey]: value});
        }
    );

    const addKey = (newKey: string) : void => {
        if(newKey){
            setObject({...object, [newKey]: ''});
        }
    };

    const updateOnKey = (key: string) : Function => (
        (value: any) => {
            setObject({...object, [key]: value});
        }
    );

    return (
        <table>
        {Object.entries(object).map(([k,x]) => 
        <tr key={k}>
            <td>
            <EditableValue updater={updateKey(k)} val={k}/>:&nbsp;
            </td>
            <td>
            <EditableValue updater={updateOnKey(k)} val={x}/>
            </td>
        </tr>
        )}
        <tr>
            <td>
                <EditableValue val={''} key={Math.random()} updater={addKey} placeholder='New key...'/>:&nbsp;
            </td>
        </tr>
        </table>
    );
}