import {EditableValue, IInputOptions, RenderValue} from '.';
import UpdaterFactory from '../functions/UpdaterFactory';

export default function EditableArray({array, updater, options} : {array: unknown[], updater: Function, options?: IInputOptions}) : JSX.Element {

    const setArray = (newArray: any[]) : void => {
        if(options?.dynamic){
            updater(Object.values(newArray).filter(x => x !== ''));
        }
        else{
            updater(Object.values(newArray));
        }
    }

    const updateOnIdx = UpdaterFactory.ArrayIdxUpdater(array, setArray);
    const addItem = UpdaterFactory.ArrayPusher(array, setArray);

    return (
        <table>
        {array.map((x,i) => (
            <tr key={Math.random()}>
                <td>
                    <RenderValue updater={updateOnIdx(i)} val={x}/>
                </td>
            </tr>
        ))}
        {options?.dynamic ? <tr key={Math.random()}><td><EditableValue val={''} updater={addItem()} placeholder='Add new item'/></td></tr> : null}
        </table>
    );
}
