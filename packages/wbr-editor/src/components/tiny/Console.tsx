export class ConsoleControls {
  static write(message: string) {
    const console = document.getElementById('console') as any;
    console.innerHTML += `${message}\n`;
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
    height: '350px',
    width: '1280px',
    backgroundColor: 'black',
    color: 'white',
    font: '1.3rem Inconsolata, monospace',
    padding: '10px',
    boxSizing: 'border-box',
  }}></pre>);
}
