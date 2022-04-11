import { useState } from 'react';
import { IInputOptions } from '.';

export default function EditableValue({val, placeholder, updater, options} : {val: any, placeholder?: string, updater?: Function, options?: IInputOptions}) : JSX.Element {
    const [value, setValue] = useState(val);
    const handleChange = (ev: any) => {
        setValue(ev.target.value);
    }
    const handleFocusOut = (ev: any) => {
        if(updater){
            updater(value);
        };
    }
    return (
        <input onChange={handleChange} onBlur={handleFocusOut} placeholder={placeholder} value={value}/>
    );
}