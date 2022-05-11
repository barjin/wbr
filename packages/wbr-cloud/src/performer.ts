// Cloud interpreter communication layer
import {
  chromium, BrowserContext, Page, Browser,
} from 'playwright';
import { Namespace, Socket } from 'socket.io';
import Interpret, { WorkflowFile } from '@wbr-project/wbr-interpret';

export default class Performer {
  private workflow: WorkflowFile;

  private clients: Socket[] = [];

  public url: string;

  public state: ('NEW' | 'OCCUPIED' | 'FINISHED') = 'NEW';

  private interpreter : Interpret | null;

  private browser : Browser | null;

  constructor(workflow: WorkflowFile, conn: Namespace) {
    this.workflow = workflow;
    this.url = conn.name;
    this.interpreter = null;
    this.browser = null;

    conn.on('connection', async (c) => {
      this.clients.push(c);
      c.on('disconnect', async () => {
        try {
          await this.stop();
        } catch (e: any) {
          // console.error(e);
        }
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
    try {
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
    } catch (e) {
      console.log(e);
    }
  }

  async run(parameters: Record<string, string>) : Promise<void> {
    console.log('Running the interpret...');
    this.state = 'OCCUPIED';

    this.interpreter = new Interpret(this.workflow, {
      maxConcurrency: 1,
      maxRepeats: 5,
      debug: true,
      debugChannel: {
        activeId: (id: any) => this.sendToClients('activeId', id),
        debugMessage: (msg: any) => this.sendToClients('debugMessage', msg),
      },
      serializableCallback: (x: any) => this.sendToClients('serializableCallback', x),
    });

    this.browser = await chromium.launch(process.env.DOCKER
      ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-gpu'] }
      : { });

    const ctx = await this.browser.newContext({ locale: 'en-GB' });
    const page = await ctx.newPage();

    const stopScreencasts = [await this.registerScreencast(ctx, page)];

    ctx.on('page', async (p) => {
      stopScreencasts.push(await this.registerScreencast(ctx, p));
    });

    try {
      await this.interpreter.run(page, parameters);
    } catch (e:any) {
      this.sendToClients('error', `Error during interpretation: ${e}`);
    }

    this.state = 'FINISHED';
    this.sendToClients('finished');
    await Promise.all(stopScreencasts);
    await this.browser.close();
  }

  async stop() : Promise<void> {
    this.state = 'FINISHED';
    await this.interpreter?.stop();
    await this.browser?.close();
    this.clients.map((c) => c.disconnect());
  }
}
