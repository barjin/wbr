import { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { IInputOptions } from './types';
import {
  isValidURL, isValidHref, isValidSelector, isValidCode, getSyntaxErrors,
} from './Validators';

export default function EditableValue({
  val, placeholder, updater, options,
} : { val: any, placeholder?: string, updater?: Function, options?: IInputOptions }) : JSX.Element {
  const [value, setValueInternal] = useState(val);

  const setValue = (v: string) => {
    if (['true', 'false'].includes(v.toString())) {
      setValueInternal(v === 'true');
    } else if (v !== '' && !Number.isNaN(+v)) {
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

  const validators : Record<string, [Function, string]> = {
    url: [isValidHref, 'a full URL with path'],
    goto: [isValidURL, 'a URL'],
    selectors: [isValidSelector, 'a CSS selector'],
    click: [isValidSelector, 'a CSS selector'],
    scrapeSchema_value: [isValidSelector, 'a CSS selector'],
    fill_0: [isValidSelector, 'a CSS selector'],
    script_0: [isValidCode, `${getSyntaxErrors(value)}`],
  };

  const getErrorMessage = (x: typeof val) => {
    if (options?.type) {
      const [, [c, message]] = Object.entries(validators)
        .find(([condName]) => (options?.type ?? '').startsWith(condName as any)) ?? [null, []];
      if (c) return c(x) ? '' : message;
      return null;
    }
    return null;
  };

  return !['script_0'].includes(options?.type as string)
    ? <input
          onChange={handleChange}
          onBlur={handleFocusOut} placeholder={placeholder}
          value={value}
          style={{
            minWidth: 0,
            width: '100%',
            borderColor: getErrorMessage(value) ? 'red' : '',
          }}
          title={getErrorMessage(value) ? `Suggestion: This does not look like a valid value for this field (${getErrorMessage(value)}).` : undefined}
        />
    : <CodeEditor
          value={value as string}
          language='js'
          onChange={handleChange}
          onBlur={handleFocusOut}
          placeholder={'// your code belongs here'}
          style={{
            whiteSpace: 'pre-line',
            border: getErrorMessage(value) ? '2px solid maroon' : '',
          }}
          title={getErrorMessage(value) ? `Suggestion: This does not look like a valid value for this field (${getErrorMessage(value)}).` : undefined}
        />;
}
