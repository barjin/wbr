import getBrowser, { ExtendedBrowser } from './perfBrowser';
import Logger from './Logger';

type Workflow = Record<string, unknown>;
interface Controller {
  click: (selector: string) => void,
  goto: (url: string) => void,
  goBack: () => void,
  goForward: () => void,
  switchTab?: () => void,
  newTab: (url?: string) => void,
}

class Performer {
  Browser : ExtendedBrowser | null = null;

  public async runWorkflow(workflow: Workflow) : Promise<void> {
    // TODO: replace the stub implementation with something working
    Logger(`calling .runWorkflow! ${this} ${workflow}`);
  }

  public async halt() : Promise<void> {
    // TODO: implement the body
    Logger(`calling .halt()! ${this}`);
  }

  public async release() : Promise<void> {
    this.halt();
    await this.Browser?.close();
  }

  public async tapInto(DOMCallback : (...args: any[]) => void) : Promise<Controller> {
    if (!this.Browser || !this.Browser.isConnected()) {
      this.Browser = await getBrowser({ type: 'chromium', headless: false });
    }

    (this.Browser as any)?.on('DOMDiff', DOMCallback);
    return {
      // Todo - needs to be made simpler (three layers of callback for every action)
      newTab: async (url?: string) => {
        await this.Browser!.newTab(url);
      },
      goto: async (url: string) => {
        await this.Browser!.currentPage.goto(url);
      },
      click: async (selector: string) => {
        try { await this.Browser!.currentPage.click(selector); } catch (e) { console.log(e); }
      },
      goBack: async () => {
        await this.Browser!.currentPage.goBack();
      },
      goForward: async () => {
        await this.Browser!.currentPage.goForward();
      },
    };
  }
}

export default Performer;
