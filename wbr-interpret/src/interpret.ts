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

function resetIterators(actions: Workflow[number]['what']): void {
  actions.forEach((action) => action.params.forEach(
    (param, idx) => {
      if (Array.isArray(param)) {
        action[idx] = 0; //eslint-disable-line
      }
    },
  ));
}

function applicable(context: Context, compare: Workflow[number]) : boolean {
  const exhausted = (actions: Workflow[number]['what']) => (
    actions.some((action) => (
      action.params.some(
        (param, idx) => (
          Array.isArray(param) && action[idx] === param.length),
      )
    ))
  );

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

async function carryOutSteps(page: Page, steps: Workflow[number]['what']) : Promise<void> {
  for (const step of steps) {
    console.log(`Launching ${step.type}`);
    // TODO: think about the "recursive" iteration in detail.
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

async function getContext(page: Page, workflow: Workflow) {
  // TODO : add recursive selector search (also in click/fill etc. events?)
  const queryableSelectors = workflow
    .map((step) => step.where)
    .reduce((p, where) => (
      { ...p, ...(where.selectors ? <Record<string, unknown>>where.selectors : {}) }
    ),
    {});

  const accontable = async (selector: string) : Promise<boolean> => {
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

  const presentSelectors = await Promise.all(
    Object.keys(queryableSelectors)
      .map(async (selector) => ((await accontable(selector)) ? selector : null)),
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
  public static async runWorkflow(
    workflow: Workflow,
    debugCallback : (type: string, data: any) => void = () => {},
  ) : Promise<any> {
    let lastAction = null;
    let repeatCount = 0;

    const browser = await chromium.launch();
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

// fs.writeFileSync('name.json', JSON.stringify(wf));
// SWInterpret.runWorkflow(wf);
