import { useState } from 'react';

export default function Select({options, select}: {options: string[], select: (choice: any) => void}) : JSX.Element {
    const [collapsed, setCollapsed] = useState(true);

    const toggleCollapsed = () => setCollapsed(!collapsed);

    return (
        <div tabIndex={1} onBlur={() => setCollapsed(true)} style={{position: 'relative'}}>
        <div onClick={toggleCollapsed} className='button primary'>+</div>
        <div style={{
            display: collapsed ? 'none' : 'block',
            position: 'absolute',
            width: '200px',
            backgroundColor: '#ddd',
            zIndex: 10
        }}>
        {options.map(x => (
            <div className='option' onClick={() => {
                setCollapsed(true);
                select(x);
            }}>
                {x}
            </div>
        ))}
        </div>
        </div>
    )
}
