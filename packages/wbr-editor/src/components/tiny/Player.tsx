import { WorkflowFile } from '@wbr-project/wbr-interpret';
import io from 'socket.io-client';

const hostname = 'http://127.0.0.1';
const port = 8080;

function drawToCanvas(image: string) {
  const canvas = document.getElementById('screen') as any;
  if (canvas) {
    const ctx = canvas.getContext('2d');

    const img = new Image();

    img.src = `data:image/jpg;base64,${image}`;
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0);
    };
  }
}

function connectRunner(namespace: string) {
  const socket = io(`${hostname}:${port}/${namespace}`);
  socket.on('screen', (a) => drawToCanvas(a.data));
  //    socket.on('context',(context) => {
  //    const tree = JsonView.createTree(context);
  //    const context_area = document.getElementById('context');
  //    context_area.innerHTML = "";
  //        JsonView.render(tree, context_area);
  //    JsonView.expandChildren(tree);
  //    });
  //    socket.on('action',(action) => {
  //    const tree = JsonView.createTree(action);
  //    const action_area =  document.getElementById('action');
  //    action_area.innerHTML = "";
  //        JsonView.render(tree, action_area);
  //    JsonView.expandChildren(tree);
  //    });
  socket.on('error', (error) => {
    alert(error.message);
  });
  socket.on(
    'activeId',
    (id) => {
      document.querySelectorAll('.pair').forEach((x) => x.setAttribute('active', 'false'));
      document.querySelector(`.pair:nth-of-type(${id + 1})`)?.setAttribute('active', 'true');
    },
  );
}

export function runWorkflow(workflow: WorkflowFile) : void {
  fetch(
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
  ).then((j) => j.json())
    .then(({ url }) => {
      connectRunner(url);
    });
}

export default function Screen() {
  return (
        <canvas id='screen' width="1280" height="720" style={{ backgroundColor: 'lightgrey' }}/>
  );
}
