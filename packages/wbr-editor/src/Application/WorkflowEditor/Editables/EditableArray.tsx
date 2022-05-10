import EditableValue from './EditableValue';
import RenderValue from './RenderValue';
import UpdaterFactory from '../Utils/UpdaterFactory';
import type { IInputOptions } from './types';

/**
 * Renders an array as an editable table.
 * Does not store the state of the array internally.
 * The updates are passed to the parent component using the updater.
 * @param {Object} props - Parameters for the editor.
 * @param {any[]} props.array The array to render.
 * @param {Function} props.updater The callback updater function.
 *  EditableArray calls this function on any update in the UI.
 * @param {Object} props.options - Optional options to pass to the updater.
 * @param {boolean} props.options.dynamic - Whether the updater can add items to the array.
 * @returns {JSX.Element} React Element
 */
export default function EditableArray(
  { array, updater, options } : { array: unknown[], updater: Function, options?: IInputOptions },
) : JSX.Element {
  const setArray = (newArray: any[]) : void => {
    if (options?.dynamic) {
      updater(Object.values(newArray).filter((x) => x !== ''));
    } else {
      updater(Object.values(newArray));
    }
  };

  console.log('rendering Arrat!!!!');

  const updateOnIdx = UpdaterFactory.ArrayIdxUpdater(array, setArray);
  const addItem = UpdaterFactory.ArrayPusher(array, setArray);

  return (
        <table>
        {array.map((x, i) => (
            <tr key={Math.random()}>
                <td>
                    <RenderValue updater={updateOnIdx(i)} val={'ahoj'} {...{ options: { ...options, type: `${options?.type}_${i}` } }}/>
                </td>
            </tr>
        ))}
        {options?.dynamic ? <tr key={Math.random()}><td><EditableValue val={''} updater={addItem()} placeholder='Add new item'/></td></tr> : null}
        </table>
  );
}
