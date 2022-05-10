import { WorkflowFile } from '@wbr-project/wbr-interpret';
import io from 'socket.io-client';
import Console, { ConsoleControls } from './Console';
import Screen, { ScreenControls } from './Screen';

export async function runWorkflow(
  workflow: WorkflowFile,
  currentIdx: Function,
) : Promise<Function> {
  const { url } = await fetch(
    '/api/performer',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow,
      }),
    },
  ).then((j) => j.json());

  function connectRunner(namespace: string) {
    const socket = io(`/${namespace}`);
    socket.on('screen', (a) => ScreenControls.draw(a.data));
    socket.on('error', (error) => {
      ConsoleControls.write(error, 'red');
    });
    socket.on('finished', () => {
      ConsoleControls.write('The workflow execution has finished', 'yellow');
      currentIdx(-1);
      socket.close();
    });

    socket.on(
      'activeId',
      (x) => currentIdx(+x),
    );

    socket.on(
      'serializableCallback',
      (x) => {
        ConsoleControls.write(JSON.stringify(x, null, 2), 'cyan');
      },
    );
    socket.on(
      'debugMessage',
      (x) => {
        ConsoleControls.write(x, 'blue');
      },
    );

    return socket;
  }

  const socket = await connectRunner(url);

  return async () => {
    await fetch(`/api/performer/${url}/stop`, {
      method: 'POST',
      body: JSON.stringify({ action: 'stop' }),
    }).catch((e) => console.error(e));
    currentIdx(-1);
    socket.close();
  };
}

export default function Player() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Screen/>
      <Console />
    </div>
  );
}
