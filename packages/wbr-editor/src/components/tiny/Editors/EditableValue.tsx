import { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { IInputOptions } from './types';

export default function EditableValue({
  val, placeholder, updater, options,
} : { val: any, placeholder?: string, updater?: Function, options?: IInputOptions }) : JSX.Element {
  const [value, setValueInternal] = useState(val);

  const setValue = (v: string) => {
    if (['true', 'false'].includes(v.toString())) {
      setValueInternal(v === 'true');
    } else if (v && !Number.isNaN(v)) {
      setValueInternal(+v);
    } else {
      setValueInternal(v);
    }
  };

  const handleChange = (ev: any) => {
    setValue(ev.target.value);
  };
  const handleFocusOut = () => {
    if (updater) {
      updater(value);
    }
  };

  return !['script'].includes(options?.type as string)
    ? <input
          onChange={handleChange}
          onBlur={handleFocusOut} placeholder={placeholder}
          value={value}
          style={{ minWidth: 0, width: '100%' }}
        />
    : <CodeEditor
          value={value as string}
          language='js'
          onChange={handleChange}
          onBlur={handleFocusOut}
          placeholder={'// your code belongs here'}
          style={{ whiteSpace: 'pre-line' }}
        />;
}
