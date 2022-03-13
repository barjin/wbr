import {EditableValue} from '.';

export default function EditableArray({array, updater} : {array: unknown[], updater: Function}) : JSX.Element {

    const setArray = (newArray: any[]) : void => {
        updater(Object.values(newArray).filter(x => x !== ''));
    }

    const updateOnIdx = (idx: number) : Function => (
        (value: any) => {
            setArray({...array, [idx]: value});
        });
    
    const addItem = (item: any) => {
            setArray([...array, item]);
        };

    return (
        <table>
        {array.map((x,i) => (
            <tr key={Math.random()}>
                <td>
                    <EditableValue updater={updateOnIdx(i)} val={x}/>
                </td>
            </tr>
        ))}
        <tr key={Math.random()}><td><EditableValue val={''} updater={addItem} placeholder='Add new item'/></td></tr>
        </table>
    );
}
