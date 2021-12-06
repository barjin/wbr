/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { chromium, Page, PageScreenshotOptions } from 'playwright';
import Apify from 'apify';
import path from 'path';

const MAX_REPEAT = 5;

type NameType = string;

const operators = ['$and', '$or'] as const;
const meta = ['$before', '$after'] as const;

type Operator = typeof operators[number];
type Meta = typeof meta[number];

type BaseConditions = {
  'url': string,
  'cookies': Record<string, string>,
  'selectors': string[],
  '$after': NameType,
  '$before': NameType,
};

type Where = Partial<{ [key in Operator]: Where | Where[] }>
& Partial<BaseConditions> & Partial<Record<Meta, string>>;

export type Workflow = {
  name?: NameType
  where: Where
  what: What[],
}[];

type MethodNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type What = {
  type: MethodNames<Page>,
  params?: any[] | any
};

type Context = Partial<BaseConditions>;

/**
 * Tests if the given action is applicable with the given context.
 * @param context Current browser context.
 * @param where Tested *where* condition
 * @returns True if `where` is applicable in the given context, false otherwise
 */
export function applicable(where: Where, context: Context, usedActions : string[] = []) : boolean {
  /**
   * Given two objects, determines whether `subset` is a subset of `superset`.\
   * \
   * For every key in `subset`, there must be a corresponding key with equal scalar
   * value in `superset`, or `inclusive(subset[key], superset[key])` must hold.
   * @param subset Arbitrary non-cyclic JS object (where clause)
   * @param superset Arbitrary non-cyclic JS object (browser context)
   * @returns True if `subset <= superset`, false otherwise.
   */
  const inclusive = (subset: Record<string, unknown>, superset: Record<string, unknown>)
  : boolean => (
    Object.entries(subset).every(
      ([key, value]) => {
        value = Array.isArray(value) ? value.reduce((p, x) => ({ ...p, [x]: [] }), {}) : value;
        superset[key] = Array.isArray(superset[key])
          ? (<string[]>superset[key]).reduce((p, x) => ({ ...p, [x]: [] }), {})
          : superset[key];
        return superset[key] && (superset[key] === value || (typeof value === 'object' && inclusive(<typeof subset>value, <typeof superset>superset[key])));
      },
    )
  );

  return Object.entries(where).every(
    ([key, value]) => {
      if (operators.includes(<any>key)) {
        // Currently tested key is an operator ($and, $or)
        let array = Array.isArray(value) ? (value as Where[]) : undefined;
        const base = !Array.isArray(value) ? (value as Where) : undefined;

        switch (key as keyof typeof operators) {
          case '$and':
            return array?.every((x) => applicable(context, x))
              || (base && applicable(base, context)); // "and" is the implicit operation.
          case '$or':
            if (base) {
              // every entry is treated as a single context.
              array = Object.entries(base).map((a) => Object.fromEntries([a]));
            }
            return array?.some((x) => applicable(x, context));
          default:
            throw new Error('Undefined logic operator.');
        }
      } else if (meta.includes(<any>key)) {
        switch (key as keyof typeof meta) {
          case '$before':
            return !usedActions.find((x : any) => x === value);
          case '$after':
            return !!usedActions.find((x : any) => x === value);
          default:
            throw new Error('Undefined meta operator.');
        }
      } else {
        // Current key is a condition (url, cookies, selectors)
        const sub : Record<string, unknown> = {};
        sub[key] = value;
        return inclusive(sub, context);
      }
    },
  );
}

function* intGenerator() {
  let i = 0;
  while (true) {
    i += 1;
    yield i;
  }
}

const idGen = intGenerator();
/**
 * Given a Playwright's page object and a "declarative" list of actions, this function
 * calls all mentioned functions on the Page object.\
 * \
 * Manipulates the iterator indexes (experimental feature, likely to be removed in
 * the following versions of waw-interpreter)
 * @param page Playwright Page object
 * @param steps Array of actions.
 */
async function carryOutSteps(page: Page, steps: What[], datasetID?: string) : Promise<void> {
  /**
   * Defines overloaded (or added) methods/actions usable in the workflow.
   * If a method overloads any existing method of the Page class, it accepts the same set
   * of parameters *(but can suppress some!)*
   */
  const wawActions : Record<string, (...args: any[]) => void> = {
    screenshot: async (params: PageScreenshotOptions) => {
      const screenshotBuffer = await page.screenshot({
        ...params, path: undefined, fullPage: true,
      });
      await Apify.setValue(`SCREENSHOT_${idGen.next().value}`, screenshotBuffer, { contentType: 'image/png' });
    },
    scrape: async (selector?: string) => {
      const dataset = await Apify.openDataset(datasetID);
      // eslint-disable-next-line
      // @ts-ignore
      const scrapeResults : Record<string, string>[] = <any> await page.evaluate((s) => scrape(s ?? null), selector);
      await dataset.pushData(scrapeResults);
    },
  };

  for (const step of steps) {
    console.log(`Launching ${step.type}`);

    if (step.type in wawActions) {
      if (!step.params || Array.isArray(step.params)) {
        await wawActions[step.type](...(step.params ?? []));
      } else {
        await wawActions[step.type](step.params);
      }
    } else {
      const levels = step.type.split('.');
      const methodName = levels[levels.length - 1];

      let invokee : any = page;
      for (const level of levels.splice(0, levels.length - 1)) {
        invokee = invokee[level];
      }

      if (!step.params || Array.isArray(step.params)) {
        await (<any>invokee[methodName])(...(step.params ?? []));
      } else {
        await (<any>invokee[methodName])(step.params);
      }
    }

    await new Promise((res) => { setTimeout(res, 500); });
  }
}

/**
 * Returns the context object from given Page and the current workflow.\
 * \
 * `workflow` is used for selector extraction - function searches for used selectors to
 * look for later in the page's context.
 * @param page Playwright Page object
 * @param workflow Current workflow (array of where-what pairs).
 * @returns Context of the current page.
 */
async function getContext(page: Page, workflow: Workflow) : Promise<Workflow[number]['where']> {
  /**
   * List of all the selectors used in the workflow's (only WHERE clauses!)
   */
  // TODO : add recursive selector search (also in click/fill etc. events?)

  function extractSelectors(where: Where | Where[]) : BaseConditions['selectors'] {
    if (Array.isArray(where)) {
      return where.reduce((p: BaseConditions['selectors'], x) => [...p, ...extractSelectors(x)], []);
    }
    let out = where.selectors ?? [];
    for (const op of operators) {
      if (where[op]) {
        out = [...out, ...extractSelectors(where[op]!)];
      }
    }
    return out;
  }

  const queryableSelectors = workflow
    .reduce((p: BaseConditions['selectors'], step) => [
      ...p,
      ...extractSelectors(step.where),
    ], []);

  /**
   * Determines whether the element targetted by the selector is [actionable](https://playwright.dev/docs/actionability).
   * @param selector Selector to be queried
   * @returns True if the targetted element is actionable, false otherwise.
   */
  const actionable = async (selector: string) : Promise<boolean> => {
    try {
      const proms = [
        page.isEnabled(selector, { timeout: 2000 }),
        page.isVisible(selector, { timeout: 2000 }),
      ];

      return await Promise.all(proms).then((bools) => bools.every((x) => x));
    } catch {
      return false;
    }
  };

  /**
   * Object of selectors present in the current page.
   */
  const presentSelectors : BaseConditions['selectors'] = await Promise.all(
    queryableSelectors.map(async (selector) => {
      if (await actionable(selector)) {
        return [selector];
      }
      return [];
    }),
  ).then((x) => x.flat());

  return {
    url: page.url(),
    cookies: (await page.context().cookies([page.url()]))
      .reduce((p, cookie) => (
        {
          ...p,
          [cookie.name]: cookie.value,
        }), {}),
    selectors: presentSelectors,
  };
}

export default class SWInterpret {
  public static getParams(
    metaWorkflow: {
      meta: {
        params: string[],
      },
      workflow: Workflow,
    },
  ) : string[] {
    return metaWorkflow.meta.params;
  }

  /**
   * Spawns a browser context and runs given workflow. If specified, calls debugCallback with
   * updates about playback (messages, screencast).\
   * \
   * Resolves after the playback is finished.
   * @param workflow Workflow to be executed.
   * @param params Workflow specific, set of parameters for the {$param: nameofparam} fields.
   * @param debugCallback Callback function consuming the debug info.
   */
  public static async runWorkflow(
    meta_workflow: {
      meta: {
        params?: string[],
        dataset?: string,
        name?: string,
        desc?: string,
      },
      workflow: Workflow,
    },
    params? : Record<string, string>,
    debugCallback : (type: string, data: any) => void = () => {},
  ) : Promise<any> {
    const { workflow } = meta_workflow;
    // Initialize params in "macro"-like manner - replace the {$param : paramName}
    // object with the defined value.
    const initParams = (object: unknown) => {
      if (!params) {
        return;
      }
      if (!object || typeof object !== 'object') {
        return;
      }
      for (const key of Object.keys(object!)) {
        if (Object.keys((<any>object)[key]).length === 1 && (<any>object)[key].$param) {
          if (params[(<any>object)[key].$param]) {
            (<any>object)[key] = params[(<any>object)[key].$param];
          } else {
            console.warn('Unspecified argument structure found!');
          }
        } else {
          initParams((<any>object)[key]);
        }
      }
    };

    initParams(workflow);

    const usedActions : string[] = [];
    let lastAction = null;
    let repeatCount = 0;

    // TODO: Browser settings (fingerprinting, proxy) for defeating anti-bot measures?
    const browser = await chromium.launch(process.env.DOCKER
      ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-gpu'] }
      : { headless: true });
    const ctx = await browser.newContext({ locale: 'en-GB' });

    ctx.addInitScript({ path: path.join(__dirname, 'scraper.js') });

    const page = await ctx.newPage();

    const CDP = await ctx.newCDPSession(page);
    await CDP.send('Page.startScreencast', { format: 'jpeg', quality: 50 });

    CDP.on('Page.screencastFrame', (payload) => {
      debugCallback('screen', payload);
      setTimeout(async () => {
        try {
          await CDP.send('Page.screencastFrameAck', { sessionId: payload.sessionId });
        } catch (e) {
          console.log(e);
        }
      }, 100);
    });

    const datasetID = meta_workflow.meta.dataset ?? `${meta_workflow.meta.name ?? 'waw'}_${Date.now()}`;

    while (true) {
      await new Promise((res) => setTimeout(res, 500));

      const context = await getContext(page, workflow);
      debugCallback('context', context);
      const action = workflow.find((step) => applicable(step.where, context, usedActions));

      console.log(`Matched ${JSON.stringify(action?.where)}`);
      debugCallback('action', action);

      if (action) {
        repeatCount = action === lastAction ? repeatCount + 1 : 0;
        if (repeatCount >= MAX_REPEAT) {
          debugCallback('error', { message: `Possible loop found, action ${action.name} repeated ${repeatCount} times.` });
          await CDP.send('Page.stopScreencast');
          await browser.close();
          break;
        // throw new Error(`Possible loop found, action ${action} repeated ${repeatCount} times.`);
        }
        lastAction = action;

        try {
          await carryOutSteps(page, action.what, String(datasetID));
          usedActions.push(action.name ?? 'undefined');
        } catch (e) {
          console.warn(`${action.name} didn't run successfully, retrying because of soft mode...`);
          console.error(e);
        }
      } else {
        console.log(`No more applicable actions for context ${JSON.stringify(context)}, terminating!`);
        await CDP.send('Page.stopScreencast');
        await browser.close();
        break;
      }
    }
  }
}
