import { useRef, useState } from 'react';
import { BsFillPencilFill, BsPencil } from 'react-icons/bs';

export default function EditableHeading(
  { text, updater }: { text: string, updater: Function },
) : JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);

  return (
      <>
      <div style={{ display: 'flex', alignItems: 'center' }}>
      <h1
      onDoubleClick={() => setEditing(true)}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: editing ? 'none' : 'inline-block',
        width: 'auto',
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
      { !editing
        ? <BsFillPencilFill
          style={{ marginLeft: '20px', cursor: 'pointer' }}
          onClick={() => {
            setEditing(true);
          }}
        />
        : <BsPencil
          style={{ marginLeft: '20px', cursor: 'pointer' }}
          onClick={() => {
            setEditing(false);
            updater(value);
          }}
        />
      }
      </div>
      </>
  );
}
