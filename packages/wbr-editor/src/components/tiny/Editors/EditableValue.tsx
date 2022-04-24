import { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { IInputOptions } from './types';

export default function EditableValue({
  val, placeholder, updater, options,
} : { val: any, placeholder?: string, updater?: Function, options?: IInputOptions }) : JSX.Element {
  const [value, setValue] = useState(val);
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
          onBlur={handleFocusOut} placeholder={placeholder} value={value}
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
