import {
  chromium, firefox, webkit, LaunchOptions, Browser,
} from 'playwright';
import EventEmitter from 'events';
import throwErr from './utils';
import TabManager from './tabManager';

type PerfLaunchOpts = LaunchOptions & { type: ('chromium' | 'firefox' | 'webkit') };

export type ExtendedBrowser = Browser & PerfBrowser & TabManager;

export class PerfBrowser extends EventEmitter {
  public browser : Browser;

  private tabManager : TabManager;

  constructor(browser: Browser) {
    super();
    this.browser = browser;
    if (this.browser.isConnected()) {
      this.tabManager = new TabManager(<ExtendedBrowser><any> this, (type: string, content) => {
        this.emit('DOMDiff', { scope: type, content });
      });
    } else {
      throwErr('BrowserError', 'The Playwright session has not been initialized properly. Please try again.');
    }
    return (
      <PerfBrowser><any>(
        new Proxy(this, {
          get: (_, prop) => {
            if (!this.browser && prop !== 'launch') {
              throwErr('BrowserError', 'The Playwright session is not running.');
            }

            if (prop in this) {
              return this[<keyof PerfBrowser>prop];
            }
            if (this.tabManager?.[<keyof TabManager>prop]) {
              return this.tabManager?.[<keyof TabManager>prop];
            }
            if (this.browser?.[<keyof Browser>(prop)]) {
              return this.browser?.[<keyof Browser>prop];
            }
            return undefined;
          },
        })));
  }
}

export default async function getBrowser(options: PerfLaunchOpts) : Promise<ExtendedBrowser> {
  let playwright = null;
  switch (options.type) {
    case 'chromium':
      playwright = await chromium.launch(options);
      break;
    case 'firefox':
      playwright = await firefox.launch(options);
      break;
    case 'webkit':
      playwright = await webkit.launch(options);
      break;
    default:
      throwErr('LaunchError', 'Unrecognized browser type.');
  }
  const browser = new PerfBrowser(playwright);
  return <any>browser;
}
