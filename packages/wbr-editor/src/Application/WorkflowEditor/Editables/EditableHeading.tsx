import { useRef, useState } from 'react';
import { BsFillPencilFill, BsPencil } from 'react-icons/bs';

export default function EditableHeading(
  { text, updater }: { text: string, updater: Function },
) : JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);

  const saveValue = () => {
    if (value !== text) {
      updater(value);
    }
    setEditing(false);
  };

  return (
      <>
      <div style={{ display: 'flex', alignItems: 'center', width: '90%' }}>
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
        width: '100%',
      }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={saveValue}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          saveValue();
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
          onClick={saveValue}
        />
      }
      </div>
      </>
  );
}
