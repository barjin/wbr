export class ConsoleControls {
  static write(message: string, color: 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'cyan' | 'white' | 'black') {
    const console = document.getElementById('console') as any;
    console.innerHTML += `<span ${color ? `style="color: ${color}"` : ''}>${message}</span>\n`;
    console.scrollTop = console.scrollHeight;
  }

  static clear() {
    const console = document.getElementById('console') as any;
    console.innerHTML = '';
  }
}

export default function Console() {
  return (<pre id='console' style={{
    overflowY: 'scroll',
    width: '100%',
    aspectRatio: '4/1',
    backgroundColor: 'black',
    color: 'white',
    font: '1.3rem Inconsolata, monospace',
    padding: '10px',
    boxSizing: 'border-box',
  }}></pre>);
}
