// Cloud interpreter communication layer
import { Namespace, Socket } from 'socket.io';
import Interpret, { Workflow } from '../../wbr-interpret/src/interpret';

export default class Performer {
  private workflow : { meta: Record<string, unknown>, workflow: Workflow };

  private clients: Socket[] = [];

  public url: string;

  public state: ('NEW' | 'OCCUPIED' | 'FINISHED') = 'NEW';

  constructor(workflow: { meta: Record<string, unknown>, workflow: Workflow }, conn: Namespace) {
    this.workflow = workflow;
    this.url = conn.name;

    conn.on('connection', async (c) => {
      this.clients.push(c);
      c.on('disconnect', () => {
        this.clients = this.clients.filter((x) => x !== c);
      });
    });
  }

  sendToClients = (...args: any[]) : void => {
    this.clients.forEach((client) => {
      // @ts-ignore
      client.emit(...args);
    });
  };

  start(parameters: Record<string, string>) : void {
    console.log('Running interpret');
    this.state = 'OCCUPIED';
    Interpret.runWorkflow(this.workflow, parameters, this.sendToClients).then(() => {
      this.state = 'FINISHED';
    });
  }
}
