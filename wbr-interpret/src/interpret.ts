/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { chromium, Page } from 'playwright';

const MAX_REPEAT = 5;

type Workflow = {
  where: Record<string, unknown>,
  what: Record<string, unknown>[],
}[];

type Context = Record<string, any>;

function applicable(context: Context, compare: Workflow[number]['where']) : boolean {
  const inclusive = (subset: Workflow[number]['where'], superset: Context) : boolean => (
    Object.entries(subset).every(
      ([key, value]) => (superset[key] && (superset[key] === value || (typeof value === 'object' && inclusive(<Record<string, unknown>>value, superset[key])))),
    ));

  // TODO - not caring about AND logic so far - only all specified "where" rules must be
  // valid within current context - more general rules are more likely to be applied.
  return inclusive(compare, context);
}

async function carryOutSteps(page: Page, steps: Workflow[number]['what']) : Promise<void> {
  for (const step of steps) {
    console.log(`Launching ${step.type}`);
    // TODO : add more actions (not only page-related)
    await (<any>page)[<string>step.type](...<any[]>step.params);
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

  const presentSelectors = await Promise.all(
    Object.keys(queryableSelectors)
      .map(async (selector) => ((await page.isVisible(selector)) ? selector : null)),
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

class SWInterpret {
  public static async runWorkflow(workflow: Workflow) : Promise<any> {
    let lastAction = null;
    let repeatCount = 0;

    const browser = await chromium.launch({ headless: false });
    const ctx = await browser.newContext({ locale: 'en-GB' });
    const page = await ctx.newPage();

    await page.goto('https://seznam.cz');

    while (true) {
      await new Promise((res) => setTimeout(res, 500));

      const context = await getContext(page, workflow);
      const action = workflow.find((step) => applicable(context, step.where));

      console.log(`Matched ${JSON.stringify(action)}`);

      if (action) {
        repeatCount = action === lastAction ? repeatCount + 1 : 0;
        if (repeatCount >= MAX_REPEAT) {
          throw new Error(`Possible loop found, action ${action} repeated ${repeatCount} times.`);
        }
        lastAction = action;

        await carryOutSteps(page, action.what);
      } else {
        console.log(`No more applicable actions for context ${JSON.stringify(context)}, terminating!`);
        break;
      }
    }
  }
}

const cookieAccept = [
  // Accepts cookie modals.
  {
    where: {
      selectors: { 'button:text-matches("(accept|agree|souhlasím)", "i")': [] },
    },
    what: [
      {
        type: 'click',
        params: [
          'button:text-matches("(accept|agree|souhlasím)", "i")',
        ],
      },
    ],
  },
];

const loginer = [
  // Attempts to fill out the login form and submit it.
  {
    where: {
      selectors: {
        'input[type=text]': [],
        'input[type=password]': [],
      },
    },
    what: [
      {
        type: 'fill',
        params: [
          'input[type=text]',
          'test login',
        ],
      },
      {
        type: 'fill',
        params: [
          'input[type=password]',
          'test password',
        ],
      },
      {
        type: 'click',
        params: [
          'button[class*=login]',
        ],
      },
    ],
  },
];

SWInterpret.runWorkflow([
  ...cookieAccept,
  ...loginer,
  {
    where: {
      url: 'https://www.google.com/',
      cookies: {
        // empty array (object) means "any value" - if the google `NID` cookie is present,
        // user allowed Google to store cookies - and the cookie request overlay
        // is (most likely) not there.
        NID: [],
      },
    },
    what: [
      {
        type: 'fill',
        params: [
          '.gLFyf.gsfi',
          'seznam.cz',
        ],
      },
      {
        type: 'click',
        params: [
          '.FPdoLc [value="Zkusím štěstí"]',
        ],
      },
      {
        type: 'waitForNavigation',
        params: [],
      },
    ],
  },
  {
    where: {
      url: 'https://www.seznam.cz/',
    },
    what: [
      {
        type: 'click',
        params: [
          '.search__tab--mapy > button',
        ],
      },
      {
        type: 'fill',
        params: [
          '#mapy-input',
          'Cheb',
        ],
      },
      {
        type: 'click',
        params: [
          '[data-dot=search-button]',
        ],
      },
      {
        type: 'waitForNavigation',
        params: [],
      },
    ],
  },
]);
