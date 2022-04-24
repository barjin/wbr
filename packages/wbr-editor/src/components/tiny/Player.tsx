import { WorkflowFile } from '@wbr-project/wbr-interpret';
import io from 'socket.io-client';
import Console, { ConsoleControls } from './Console';
import Screen, { ScreenControls } from './Screen';

const hostname = 'http://127.0.0.1';
const port = 8080;

export async function runWorkflow(
  workflow: WorkflowFile,
  currentIdx: Function,
) : Promise<Function> {
  const { url } = await fetch(
    `${hostname}:${port}/performer`,
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
    const socket = io(`${hostname}:${port}/${namespace}`);
    socket.on('screen', (a) => ScreenControls.draw(a.data));
    socket.on('error', (error) => {
      ConsoleControls.write(error);
    });
    socket.on('finished', () => {
      ConsoleControls.write('The workflow execution has finished');
      currentIdx(-1);
    });

    socket.on(
      'activeId',
      (x) => currentIdx(+x),
    );

    socket.on(
      'serializableCallback',
      (x) => {
        ConsoleControls.write(JSON.stringify(x, null, 2));
      },
    );
  }

  await connectRunner(url);

  return async () => {
    await fetch(`${hostname}:${port}/performer/${url}/stop`);
    currentIdx(-1);
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
