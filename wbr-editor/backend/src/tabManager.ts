/* eslint-disable max-len */
import EventEmitter from 'events';
import {
  CDPSession, Page, Response, BrowserContext,
} from 'playwright';
import path from 'path';
import logger, { Level } from './Logger';
import type { ExtendedBrowser, PerfBrowser } from './perfBrowser';

export type NamedPage = Page & { tabName?: string };
/**
 * Class for handling the browser tab management.
 */
export default class TabManager extends EventEmitter {
/**
 * Associated Playwright Browser object.
 */
  private perfBrowser : PerfBrowser;

  /**
 * Functions or paths to scripts to be injected to every new page.
 */
  private injections : ({ path:string } | Function)[] = []; /* eslint-disable-line @typescript-eslint/ban-types */

  /**
 * Playwright Page object exposing the currently selected page.
 */
  private page : Page | null = null;

  /**
     * Callback function to be called with any new screencast frame.
     */
  private screencastCallback : (type: string, content: any) => void;

  private cdpSession : CDPSession | null = null;

  private mutationPolling: NodeJS.Timer | null = null;

  /**
    * Constructor for the TabManager class
    * @param browser Sessions Playwright Browser object
    */
  constructor(browser : ExtendedBrowser, screencastCallback : (type: string, content: any) => void) {
    super();
    this.perfBrowser = browser;
    this.screencastCallback = screencastCallback;
    this.injectToAll({ path: path.join(__dirname, './selgen.js') });
    this.injectToAll({ path: path.join(__dirname, './mutationInject.js') });
  }

  private castPage = async (
    page: Page,
    params?: {
      scripts? : boolean,
      comments?: boolean
    },
  ) : Promise<void> => {
    try {
      await page.waitForLoadState('networkidle');
      const content = await page.content();

      const url = new URL(page.url());

      let absol = content.replaceAll(/["'`](\/\/.*?)["'`]/g, `"${url.protocol}$1"`); // matches doubleslash links with protocol
      absol = !params?.scripts ? absol.replaceAll(/<script.*?>[^]*?<\/script>/g, '') : absol; // removes "client-side" scripts
      absol = !params?.comments ? absol.replaceAll(/<!--[^]*?-->/g, '') : absol; // removes comments, thinning the sent file even more.

      absol = absol.replaceAll(/(src|href)=["']\/(.*?)["']/g, `$1="${url.origin}/$2"`); // makes "root" links (beginning with a slash) in attributes absolute
      absol = absol.replaceAll(/(src|href)=["'](?!([a-z0-9]*:|.{0})\/\/)(.*?)["']/g, `$1="${url.href}$3"`); // makes relative links (in attributes) absolute
      const renderedPage = absol.replaceAll(/url\((?!([a-z0-9]*:|.{0})\/\/|")(.*?)\)/g, `url("${url.href}$2")`); // makes relative links in inlined css absolute
      // note that we do not care about the relative "href" links, as the client only loads resources and doesn't browse (or follow links) on its own.

      this.screencastCallback('page', renderedPage);
    } catch (e) {
      logger(<string>e, Level.ERROR);
    }
  };

  /**
    * Getter method for listing all the managed tabs (Playwright Page objects) in all contexts.
    * @returns List of currently active tabs / pages.
   */
  public get pages() : NamedPage[] {
    return this.perfBrowser.browser.contexts()
      .map((context : BrowserContext) => context.pages())
      .reduce((acc: NamedPage[], pages: NamedPage[]) => [...acc, ...pages], []);
  }

  public set currentPage(value: Page) {
    logger('Setting page...');
    if (this.page === value) {
      return;
    }

    // if (this.page) {
    //   this.page.removeListener('domcontentloaded', this.castPage);
    //   logger('Removing listener...');
    // }

    this.page = value;
    this.page.on('domcontentloaded', (page) => {
      console.log('DOMLOADED');
      this.castPage(page);
    });

    setInterval(async () => {
      try {
        const mutationBuffer = await this.page?.evaluate('readMutationBuffer()');
        if ((<any>mutationBuffer).length) {
          this.screencastCallback('mutation', mutationBuffer);
        }
      } catch (e) {
        console.log(e);
        // clearInterval(this.mutationPolling!);
      }
    }, 1000);
  }

  public get currentPage() : Page {
    return <any> this.page;
  }

  public sendCDP(command: any, params: Record<string, unknown>) : void {
    if (this.cdpSession) {
      this.cdpSession.send(command, params);
    }
  }

  /**
 * Helper method for emiting the "tabsUpdate" event (listened to by BrowserSession) with the list of all tabs.
*/
  private notifyStateChange() : void {
    this.emit('tabsUpdate', this.listAllTabs());
  }

  /**
 * Helper method to sideload scripts into a new page as well as bind some listeners and introduce the "tabName" member variable into the page (for easier tab name retrieval).
 * @param page Current page to be bootstrapped.
 * @returns Promise gets resolved after the given page is bootstrapped with the specified scripts.
 */
  private async pageBootstrapper(page : NamedPage) : Promise<void> {
    await page.route('**/*', (route) => {
      const blocked = ['image', 'media', 'font'];
      return blocked.includes(route.request().resourceType())
        ? route.abort() // blocking server from loading visual-only resources => NOTE - we can afford this only because of the dynamic passthrough i.e. with the legacy screencast, this would hinder the UX quite a lot.
        : route.continue();
    });

    page.on('domcontentloaded', async () => {
      try {
        page.tabName = await page.title(); // eslint-disable-line
        this.notifyStateChange();
      } catch (e) {
        logger(<string>e, Level.ERROR);
      } // not optimal, just suppressing exceptions (exceptions usually stem from quick navigation, so no biggie, but still.)
    });

    page.on('popup', async (popup: Page) => {
      await this.pageBootstrapper(popup);
    });

    const injectedScripts:Promise<void>[] = [];
    this.injections.forEach((script) => {
      injectedScripts.push(page.addInitScript(script));
      logger('Injecting script!', Level.DEBUG);
    });

    await Promise.all(injectedScripts);
    logger('All scripts have been sideloaded!', Level.DEBUG);

    // Reload is needed for the injected scripts to get loaded (will this break anything?)
    await page.reload();
  }

  /**
 * Gets the current state of the browser tabs (current tab id and list of tab titles).
 * @returns List of open tabs and the current tab id.
 */
  public listAllTabs() : { currentTab: number, tabs: string[] } {
    const currentTab = this.pages.findIndex((page) => page === this.currentPage);

    const tabList = this.pages.map((page) => <string>(page.tabName));

    return { currentTab, tabs: tabList };
  }

  /**
 * Closes all the current browser contexts and opens up a blank page.
 * @returns Promise gets resolved after the blank page is open.
 */
  public async recycleContext() : Promise<void> {
    const closingContexts:Promise<void>[] = [];
    this.perfBrowser.browser.contexts().forEach((context: BrowserContext) => {
      closingContexts.push(context.close());
    });

    await Promise.all(closingContexts);

    await this.newTab();
  }

  /**
 * Opens up a new page in the last existing (running) context. If there is no running context, it gets created with some default options.
 * @param url Optional - url to open the page with.
 * @returns Promise gets resolved after the new page is open, bootstrapped and on the specified URL (if applicable).
 */
  public newTab = async (url? : string) : Promise<void> => {
    if (this.perfBrowser.browser?.contexts().length === 0) {
      // For freshly created (or recycled) browser without context
      logger('Creating new context...', Level.DEBUG);
      await this.perfBrowser.browser.newContext({ locale: 'en-GB' });
    }

    const currentContext = this.perfBrowser.browser?.contexts()[this.perfBrowser.browser.contexts().length - 1];

    const page = await currentContext.newPage();
    this.currentPage = page;
    await this.pageBootstrapper(this.currentPage);

    if (typeof (url) === 'string') {
      await this.currentPage.goto(url);
    }
  };

  /**
 * Closes the specified page. Handles possible termination of the current page, changes current page id accordingly.
 * @param idx id of the page to be closed (index in the pages array) or the Page object itself.
 * @returns Promise, gets resolved when the page is successfully closed.
 */
  public async closeTab(page: number | Page) : Promise<void> {
    const pageIndex = typeof page === 'number' ? page : this.pages.findIndex((p) => p === page);
    if (pageIndex === -1) throw new Error('Page could not be found.');

    await this.pages[pageIndex].close();

    if (this.currentPage?.isClosed()) {
      // If we did not close the last tab, the new focused tab will be the successor of the closed one (otherwise we pick the new last one).
      this.currentPage = this.pages[pageIndex !== this.pages.length ? pageIndex : this.pages.length - 1];
    }

    this.notifyStateChange();
  }

  /**
 * Injects the specified function/script to all the active pages, stores it in the injections array for the future pages (to be used during bootstrapping).
 * @param arg Function (or path to the script file) to be injected
 * @returns Promise, gets resolved when all the existing pages have been reloaded with the new script injected.
 */
  // The argument is either a JS function or an object with a path to a script (see documentation of Page.addInitScript)
  // Once registered, the injected script survives reloads and navigation.
  public async injectToAll(arg: (Function | { path: string })) : Promise<void> { /* eslint-disable-line @typescript-eslint/ban-types */
    this.injections.push(arg);

    const injectedPages : Promise<Response | null>[] = [];
    logger('Injecting new script!', Level.DEBUG);
    this.pages.forEach((page) => {
      injectedPages.push(page.addInitScript(arg).then(() => page.reload()));
      logger(`Injecting script to page ${page.tabName}!`, Level.DEBUG);
    });

    await Promise.all(injectedPages);
  }

  /**
* Changes the currentPage.
* @param newTab index of the new tab in the pages array
*/
  // switchTabs does not have to be async, since Playwright internally does not 'switch' tabs,
  //  and the switching mechanism is solely user-side.
  public switchTabs(newTab: number) : void {
    this.currentPage = this.pages[newTab];

    this.notifyStateChange();
  }
}
