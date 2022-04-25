import EditableValue from './EditableValue';
import UpdaterFactory from '../../functions/UpdaterFactory';
import type { IInputOptions } from './types';

/**
 * Renders an object as an editable table.
 * Does not store the state of the object internally.
 * The updates are passed to the parent component using the updater passed in the parameter.
 * @param {Object} props - Parameters for the editor.
 * @param {any[]} props.object The object to render.
 * @param {Function} props.updater The callback updater function.
 *  EditableObject calls this function on any update in the UI.
 * @param {Object} props.options - Optional options to pass to the updater.
 * @param {boolean} props.options.dynamic - Whether the updater can add items to the object.
 * @returns {JSX.Element} React Element
 */
export default function EditableObject(
  { object, updater, options } :
  { object: Record<string, unknown>, updater: Function, options?: IInputOptions },
) : JSX.Element {
  // eslint-disable-next-line no-param-reassign
  options = { ...options, dynamic: true };

  const setObject = (newObject: Record<string, unknown>) : void => {
    const clean = options?.dynamic ? Object.entries(newObject).filter(([k, x]) => !(k === '' && x === '')) : Object.entries(newObject);
    updater(Object.fromEntries(clean));
  };

  const addKey = UpdaterFactory.ObjectAddKey(object, setObject);

  const updateKey = UpdaterFactory.ObjectKeyUpdater(object, setObject);
  const updateOnKey = UpdaterFactory.ObjectValueUpdater(object, setObject);

  return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Object.entries(object).map(([k, x]) => (
        <div className="objectRow" key={k}>
            <EditableValue updater={updateKey(k)} val={k} {...{ options }}/>
            <EditableValue updater={updateOnKey(k)} val={x} {...{ options }}/>
        </div>))
        }
        {options?.dynamic ? <tr>
            <td>
                <EditableValue val={''} key={Math.random()} updater={addKey()} placeholder='New key...' {...{ options }}/>
            </td>
        </tr> : null}
        </div>
  );
}
