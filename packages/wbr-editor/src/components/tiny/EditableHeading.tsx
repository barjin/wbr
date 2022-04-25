import { useRef, useState } from 'react';

export default function EditableHeading(
  { text, updater }: { text: string, updater: Function },
) : JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);

  return (
      <>
    <h1
    onDoubleClick={() => {
      setEditing(true);
    }}
    style={{
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: editing ? 'none' : '',
    }}
    >
        {text}
    </h1>
    <input ref={inputRef}
      style={{
        display: editing ? 'block' : 'none',
        fontSize: '2em',
        marginTop: '0.67em',
        marginBottom: '0.67em',
        marginLeft: '0',
        marginRight: '0',
        fontWeight: 'bold',
      }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => { setEditing(false); updater(value); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          setEditing(false); updater(value);
        }
      }}
      />
      </>
  );
}
