/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { chromium, Page } from 'playwright';

const MAX_REPEAT = 10;

export type Workflow = {
  where: Record<string, unknown>,
  what: What[],
}[];

type ParamIndex = number;

type What = {
  [key:number]: ParamIndex,
  type: string,
  params: any[]
};

type Context = Record<string, any>;

/**
 * Resets all the iterators in the given set of (exhausted) actions.\
 * \
 * *Note - the iterator syntax is experimental and is likely to be removed
 * in the following versions of the waw interpreter. Use at your own risk!*
 * @param actions Array of actions to be reset
 */
function resetIterators(actions: Workflow[number]['what']): void {
  actions.forEach((action) => action.params.forEach(
    (param, idx) => {
      if (Array.isArray(param)) {
        action[idx] = 0; //eslint-disable-line
      }
    },
  ));
}

/**
 * Tests if the given action is applicable with the given context.
 * @param context Current browser context.
 * @param compare Tested *where-what* pair
 * @returns True if `compare` is applicable in the given context, false otherwise
 */
function applicable(context: Context, compare: Workflow[number]) : boolean {
  /**
   * Given an array of actions tests if any of the actions' parameter iterator is exhausted.\
   * \
   * *Note - the iterator syntax is experimental and is likely to be removed
   * in the following versions of the waw interpreter. Use at your own risk!*
   * @param actions
   * @returns
   */
  const exhausted = (actions: Workflow[number]['what']) => (
    actions.some((action) => (
      action.params.some(
        (param, idx) => (
          Array.isArray(param) && action[idx] === param.length),
      )
    ))
  );

  /**
   * Given two objects, determines whether `subset` is a subset of `superset`.\
   * \
   * For every key in `subset`, there must be a corresponding key with equal scalar
   * value in `superset`, or `inclusive(subset[key], superset[key])` must hold.
   * @param subset Arbitrary non-cyclic JS object (where clause)
   * @param superset Arbitrary non-cyclic JS object (browser context)
   * @returns True if `subset <= superset`, false otherwise.
   */
  const inclusive = (subset: Workflow[number]['where'], superset: Context) : boolean => (
    Object.entries(subset).every(
      ([key, value]) => (superset[key] && (superset[key] === value || (typeof value === 'object' && inclusive(<Record<string, unknown>>value, superset[key])))),
    ));

  /* TODO - not caring about AND/OR logic so far - only all specified "where" rules must be
     valid within current context - more general rules are more likely to be applied. */

  if (exhausted(compare.what)) {
    resetIterators(compare.what);
    return false;
  }
  return inclusive(compare.where, context);
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
async function carryOutSteps(page: Page, steps: Workflow[number]['what']) : Promise<void> {
  for (const step of steps) {
    console.log(`Launching ${step.type}`);
    // TODO: think about the "recursive" iteration (Prolog-like) in detail.
    // TODO: loop detection fires, even if the iterators uses different parameters
    // First implementation - iteration over strings in array (in params - urls, logins etc.)
    for (let i = 0; i < (<any[]>step.params).length; i += 1) {
      // if nth parameter is an array, we remember the index
      if (Array.isArray((<any[]>step.params)[i])) {
        step[i] = step[i] ?? 0;
      }
    }

    // TODO : add more actions (not only page-related)
    await (<any>page)[<string>step.type](
      ...(<any[]>step.params).map(
        (x, idx) => (step[idx] !== undefined ? x[(<number>step[idx])++ % x.length] : x), // eslint-disable-line
      ),
    );
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
  const queryableSelectors = workflow
    .map((step) => step.where)
    .reduce((p, where) => (
      { ...p, ...(where.selectors ? <Record<string, unknown>>where.selectors : {}) }
    ),
    {});

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
   * Object of selectors present in the current page - selectors are the keys,
   * values are unused ([]).
   */
  const presentSelectors : { [selector: string] : any } = await Promise.all(
    Object.keys(queryableSelectors)
      .map(async (selector) => ((await actionable(selector)) ? selector : null)),
  ).then((arr) => (
    arr.filter((x: string | null) => x)
      .reduce((p: Record<string, unknown>, item: any) => (
        { ...p, [item]: [] }
      ),
      {})
  ));

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
    const browser = await chromium.launch(process.env.DOCKER ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-gpu'] } : {});
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
      const action = workflow.find((step) => applicable(context, step));

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
