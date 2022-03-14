import {EditableValue, IInputOptions} from '.';
import UpdaterFactory from '../functions/UpdaterFactory';

export default function EditableObject({object, updater, options} : {object: Record<string, unknown>, updater: Function, options?: IInputOptions}) : JSX.Element {
    options = {...options, dynamic: true};

    const setObject = (object: Record<string,unknown>) : void => {
        const clean = options?.dynamic ? Object.entries(object).filter(([k,x]) => !(k === "" && x === "")) : Object.entries(object);
        updater(Object.fromEntries(clean));
    }

    const addKey = UpdaterFactory.ObjectAddKey(object, setObject);

    const updateKey = UpdaterFactory.ObjectKeyUpdater(object, setObject);
    const updateOnKey = UpdaterFactory.ObjectValueUpdater(object, setObject);


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
        {options?.dynamic ? <tr>
            <td>
                <EditableValue val={''} key={Math.random()} updater={addKey()} placeholder='New key...'/>:&nbsp;
            </td>
        </tr> : null}
        </table>
    );
}