/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { Browser, Page, PageScreenshotOptions } from 'playwright';
import Apify from 'apify';
import path from 'path';

import {
  Where, What, PageState, Workflow, WorkflowFile, ParamType, SelectorArray, MetaData,
} from './workflow';
import { operators, meta } from './logic';
import { toKebabCase, arrayToObject, intGenerator } from './utils';
import Preprocessor from './preprocessor';

/**
 * Defines optional intepreter options (passed in constructor)
 */
export interface InterpreterOptions {
  browser: Browser;
  maxRepeats: number;
}

const MAX_REPEAT = 5;

/**
 * Class for running the Smart Workflows.
 */
export default class Interpreter {
  private meta: MetaData;

  private workflow: Workflow;

  private browser: Browser;

  private preprocess: Preprocessor = new Preprocessor();

  private intGen = intGenerator();

  constructor(workflow: WorkflowFile, browser: Browser, options?: Partial<InterpreterOptions>) {
    this.meta = workflow.meta;
    this.workflow = workflow.workflow;
    this.browser = browser;
  }

  /**
    * Returns the context object from given Page and the current workflow.\
    * \
    * `workflow` is used for selector extraction - function searches for used selectors to
    * look for later in the page's context.
    * @param page Playwright Page object
    * @param workflow Current **initialized** workflow (array of where-what pairs).
    * @returns {PageState} State of the current page.
    */
  private async getState(page: Page, workflow: Workflow) : Promise<PageState> {
    /**
     * All the selectors present in the current Workflow
     */
    const selectors = this.preprocess.extractSelectors(workflow);

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
    const presentSelectors : SelectorArray = await Promise.all(
      selectors.map(async (selector) => {
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

  /**
   * Tests if the given action is applicable with the given context.
   * @param where Tested *where* condition
   * @param context Current browser context.
   * @returns True if `where` is applicable in the given context, false otherwise
   */
  private applicable(where: Where, context: PageState, usedActions : string[] = []) : boolean {
    /**
     * Given two arbitrary objects, determines whether `subset` is a subset of `superset`.\
     * \
     * For every key in `subset`, there must be a corresponding key with equal scalar
     * value in `superset`, or `inclusive(subset[key], superset[key])` must hold.
     * @param subset Arbitrary non-cyclic JS object (where clause)
     * @param superset Arbitrary non-cyclic JS object (browser context)
     * @returns `true` if `subset <= superset`, `false` otherwise.
     */
    const inclusive = (subset: Record<string, unknown>, superset: Record<string, unknown>)
    : boolean => (
      Object.entries(subset).every(
        ([key, value]) => {
          /**
           * Value on the current key. Arrays are compared without order (transformed into objects)
           */
          value = Array.isArray(value) ? arrayToObject(value) : value;
          superset[key] = Array.isArray(superset[key])
            ? arrayToObject(<any>superset[key])
            : superset[key];

          // Every `subset` key must exist in the `superset` and
          // have the same value (strict equality), or subset[key] <= superset[key]
          return superset[key]
          && (
            superset[key] === value
            || (typeof value === 'object' && inclusive(<typeof subset>value, <typeof superset>superset[key]))
          );
        },
      )
    );

    // Every value in the "where" object should be compliant to the current state.
    return Object.entries(where).every(
      ([key, value]) => {
        if (operators.includes(<any>key)) {
          const array = Array.isArray(value)
            ? value as Where[]
            : Object.entries(value).map((a) => Object.fromEntries([a]));
            // every condition is treated as a single context

          switch (key as keyof typeof operators) {
            case '$and':
              return array?.every((x) => this.applicable(context, x));
            case '$or':
              return array?.some((x) => this.applicable(x, context));
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
          // Current key is a base condition (url, cookies, selectors)
          return inclusive({ [key]: value }, context);
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
  private async carryOutSteps(page: Page, steps: What[], datasetID?: string) : Promise<void> {
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
        await Apify.setValue(`SCREENSHOT_${this.intGen.next().value}`, screenshotBuffer, { contentType: 'image/png' });
      },
      scrape: async (selector?: string) => {
        const dataset = await Apify.openDataset(datasetID);
        // eslint-disable-next-line
        // @ts-ignore
        const scrapeResults : Record<string, string>[] = <any> await page.evaluate((s) => scrape(s ?? null), selector);
        await dataset.pushData(scrapeResults);
      },
      scroll: async (pages? : number) => {
        await page.evaluate(async (pages) => {
          for (let i = 1; i <= (pages ?? 1); i++) {
            // @ts-ignore
            window.scrollTo(0, window.scrollY + window.innerHeight);
          }
        }, pages);
      },
    };

    for (const step of steps) {
      console.log(`Launching ${step.type}`);

      if (step.type in wawActions) {
        const params = !step.params || Array.isArray(step.params) ? step.params : [step.params];
        await wawActions[step.type](...(params ?? []));
      } else {
      // Implements the dot notation for the "method name" in the workflow
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
   * Spawns a browser context and runs given workflow. If specified, calls debugCallback with
   * updates about playback (messages, screencast).\
   * \
   * Resolves after the playback is finished.
   * @param {ParamType} params Workflow specific, set of parameters
   *  for the `{$param: nameofparam}` fields.
   * @param {Page} [page] Page to run the workflow on. If not set,
   *  the interpreter uses the browser given and creates a context to work with.
   */
  public async run(params? : ParamType, page?: Page) : Promise<void> {
    /**
     * `this.workflow` with the parameters initialized.
     */
    const workflow = this.preprocess.initParams(this.workflow, params);

    if (!page) {
      console.debug('Creating new page!');
      const ctx = await this.browser.newContext({ locale: 'en-GB' });
      page = await ctx.newPage();
    }

    // @ts-ignore
    if (await page.evaluate(() => !<any>window.scrape)) {
      page.context().addInitScript({ path: path.join(__dirname, 'scraper.js') });
    }

    const { dataset, name } = this.meta;
    const datasetID = dataset ?? `${toKebabCase(name ?? 'waw')}-${Date.now()}`;

    const usedActions : string[] = [];
    let lastAction = null;
    let repeatCount = 0;

    while (true) {
      await new Promise((res) => { setTimeout(res, 500); });

      const pageState = await this.getState(page, workflow);
      const action = workflow.find(
        (step) => this.applicable(step.where, pageState, usedActions),
      );

      console.log(`Matched ${JSON.stringify(action?.where)}`);

      if (action) {
        repeatCount = action === lastAction ? repeatCount + 1 : 0;
        if (repeatCount >= MAX_REPEAT) {
          break;
        }
        lastAction = action;

        try {
          await this.carryOutSteps(page, action.what, String(datasetID));
          usedActions.push(action.name ?? 'undefined');
        } catch (e) {
          console.warn(`${action.name} didn't run successfully, retrying because of soft mode...`);
          console.error(e);
        }
      } else {
        break;
      }
    }
  }
}
