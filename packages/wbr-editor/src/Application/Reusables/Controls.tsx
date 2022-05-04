import { MouseEventHandler, useState } from 'react';

/**
 * Dropdown select element.
 * @param {Object} props - Parameters for the dropdown select.
 * @param {string[]} props.options Available values for the dropdown select.
 * @param {Function} props.select Callback function, called when the user makes a choice.
 * @returns React element
 */
export function Select(
  { options, select, children }:
  { options: string[], select: (choice: any) => void, children?: any },
) : JSX.Element {
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  return (
        <div tabIndex={1} onBlur={() => setCollapsed(true)} style={{ position: 'relative' }}>
            <div onClick={toggleCollapsed} className='button primary'>
              {children ?? '+'}
            </div>
        <div style={{
          display: collapsed ? 'none' : 'block',
          position: 'absolute',
          width: '200px',
          backgroundColor: '#ddd',
          zIndex: 10,
        }}>
        {options.map((x) => (
            <div className='option' onClick={() => {
              setCollapsed(true);
              select(x);
            }}
            >
                {x}
            </div>
        ))}
        </div>
        </div>
  );
}

/**
 * Delete button
 * @param {Object} props - Parameters for the delete button.
 * @param {Function} props.callback Callback function, called when the user clicks the button.
 * @returns React element
 */
export function DeleteButton({ callback }: { callback: MouseEventHandler }) : JSX.Element {
  return <div className='button warning' onClick={callback}>x</div>;
}
