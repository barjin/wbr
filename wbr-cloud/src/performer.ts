// Cloud interpreter communication layer
import { Namespace } from 'socket.io';
import Interpret, { Workflow } from '../../wbr-interpret/src/interpret';

export default class Performer {
  private workflow : Workflow;

  private conn: Namespace;

  public url: string;

  public state: ('NEW' | 'OCCUPIED' | 'FINISHED') = 'NEW';

  constructor(workflow: Workflow, conn: Namespace) {
    this.workflow = workflow;
    this.url = conn.name;
    this.conn = conn;

    conn.on('connection', async (c) => {
      if (['OCCUPIED', 'FINISHED'].includes(this.state)) {
        c.disconnect();
      }

      if (this.state === 'NEW') {
        console.log('Running interpret');
        this.state = 'OCCUPIED';
        c.emit('workflow', { message: this.workflow });
        await Interpret.runWorkflow(this.workflow, (...args) => c.emit(...args));
        this.state = 'FINISHED';
      }
    });
  }
}
