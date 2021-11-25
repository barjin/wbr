/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { chromium, Page } from 'playwright';
import wf from './workflow';

const MAX_REPEAT = 5;

type NameType = string;

const operators = ['$and', '$or', '$not'] as const;

type Operator = typeof operators[number];

type BaseConditions = {
  'url': string,
  'cookies': Record<string, string>,
  'selectors': string[],
  '$after': NameType,
  '$before': NameType,
};

type Where = Partial<{ [key in Operator]: Where | Where[] }>
& Partial<BaseConditions>;

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
  params: any[]
};

type Context = Partial<BaseConditions>;

/**
 * Tests if the given action is applicable with the given context.
 * @param context Current browser context.
 * @param where Tested *where* condition
 * @returns True if `where` is applicable in the given context, false otherwise
 */
function applicable(where: Where, context: Context) : boolean {
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
      } else {
        // Current key is a condition (url, cookies, selectors)
        const sub : Record<string, unknown> = {};
        sub[key] = value;
        return inclusive(sub, context);
      }
    },
  );
}
/**
 * Given a Playwright's page object and a "declarative" list of actions, this function
 * calls all mentioned functions on the Page object.\
 * \
 * Manipulates the iterator indexes (experimental feature, likely to be removed in
 * the following versions of waw-interpreter)
 * @param page Playwright Page object
 * @param steps Array of actions.
 */
async function carryOutSteps(page: Page, steps: What[]) : Promise<void> {
  for (const step of steps) {
    console.log(`Launching ${step.type}`);
    // TODO : add more actions (not only page-related)
    await (<any>page[step.type])(...step.params);
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
  /**
   * Spawns a browser context and runs given workflow. If specified, calls debugCallback with
   * updates about playback (messages, screencast).\
   * \
   * Resolves after the playback is finished.
   * @param workflow Workflow to be executed.
   * @param debugCallback Callback function consuming the debug info.
   */
  public static async runWorkflow(
    workflow: Workflow,
    debugCallback : (type: string, data: any) => void = () => {},
  ) : Promise<any> {
    let lastAction = null;
    let repeatCount = 0;

    // TODO: Browser settings (fingerprinting, proxy) for defeating anti-bot measures?
    const browser = await chromium.launch(process.env.DOCKER ? 
      { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-gpu'] }
      : { headless: false });
    const ctx = await browser.newContext({ locale: 'en-GB' });
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

    while (true) {
      await new Promise((res) => setTimeout(res, 500));

      const context = await getContext(page, workflow);
      debugCallback('context', context);
      const action = workflow.find((step) => applicable(step.where, context));

      console.log(`Matched ${JSON.stringify(action?.where)}`);
      debugCallback('action', action);

      if (action) {
        repeatCount = action === lastAction ? repeatCount + 1 : 0;
        if (repeatCount >= MAX_REPEAT) {
          throw new Error(`Possible loop found, action ${action} repeated ${repeatCount} times.`);
        }
        lastAction = action;

        await carryOutSteps(page, action.what);
      } else {
        console.log(`No more applicable actions for context ${JSON.stringify(context)}, terminating!`);
        await CDP.send('Page.stopScreencast');
        await browser.close();
        break;
      }
    }
  }
}

SWInterpret.runWorkflow(<any>wf, () => {});
