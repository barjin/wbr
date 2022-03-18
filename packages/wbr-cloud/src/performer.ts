// Cloud interpreter communication layer
import { chromium, BrowserContext, Page } from 'playwright';
import { Namespace, Socket } from 'socket.io';
import Interpret, { WorkflowFile } from '@wbr-project/wbr-interpret';

export default class Performer {
  private workflow: WorkflowFile;

  private clients: Socket[] = [];

  public url: string;

  public state: ('NEW' | 'OCCUPIED' | 'FINISHED') = 'NEW';

  constructor(workflow: WorkflowFile, conn: Namespace) {
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

  async registerScreencast(ctx : BrowserContext, page: Page) {
    const CDP = await ctx.newCDPSession(page);
    await CDP.send('Page.startScreencast', { format: 'jpeg', quality: 50 });

    CDP.on('Page.screencastFrame', (payload) => {
      this.sendToClients('screen', payload);
      setTimeout(async () => {
        try {
          await CDP.send('Page.screencastFrameAck', { sessionId: payload.sessionId });
        } catch (e) {
          console.log(e);
        }
      }, 100);
    });

    return (() => CDP.send('Page.stopScreencast'));
  }

  async run(parameters: Record<string, string>) : Promise<void> {
    console.log('Running the interpret...');
    this.state = 'OCCUPIED';

    const interpreter = new Interpret(this.workflow, {
      maxConcurrency: 1,
      maxRepeats: 5,
      debugChannel: {
        activeId: (id: any) => this.sendToClients('activeId', id),
      },
    });

    const browser = await chromium.launch(process.env.DOCKER
      ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-gpu'] }
      : { });

    const ctx = await browser.newContext({ locale: 'en-GB' });
    const page = await ctx.newPage();

    const stopScreencasts = [await this.registerScreencast(ctx, page)];

    ctx.on('page', async (p) => {
      stopScreencasts.push(await this.registerScreencast(ctx, p));
    });

    await interpreter.run(page, parameters);

    this.state = 'FINISHED';
    await Promise.all(stopScreencasts);
    await browser.close();
  }
}
