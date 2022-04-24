import EditableValue from './EditableValue';
import EditableObject from './EditableObject';
import type { IInputOptions } from './types';
import UpdaterFactory from '../../functions/UpdaterFactory';

let EditableArray : Function;

export default function RenderValue<T extends unknown>(
  { val, updater, options } : { val: T, updater: (x: T) => void, options?: IInputOptions },
) : JSX.Element {
  const type = typeof val;

  switch (type) {
    case 'object':
      return Array.isArray(val)
        ? <EditableArray array={val} {...{ updater, options }}/>
        : <EditableObject object={val as Record<string, unknown>} {...{ updater, options }}/>;
    default:
      return <EditableValue val={val} updater={updater} {...{ options }}/>;
  }
}

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
EditableArray = (
  { array, updater, options } : { array: unknown[], updater: Function, options?: IInputOptions },
) : JSX.Element => {
  const setArray = (newArray: any[]) : void => {
    if (options?.dynamic) {
      updater(Object.values(newArray).filter((x) => x !== ''));
    } else {
      updater(Object.values(newArray));
    }
  };

  const updateOnIdx = UpdaterFactory.ArrayIdxUpdater(array, setArray);
  const addItem = UpdaterFactory.ArrayPusher(array, setArray);

  return (
        <table>
        {array.map((x, i) => (
            <tr key={Math.random()}>
                <td>
                    <RenderValue updater={updateOnIdx(i)} val={x} {...{ options }}/>
                </td>
            </tr>
        ))}
        {options?.dynamic ? <tr key={Math.random()}><td><EditableValue val={''} updater={addItem()} placeholder='Add new item'/></td></tr> : null}
        </table>
  );
};
