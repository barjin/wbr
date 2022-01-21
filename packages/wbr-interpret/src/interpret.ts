/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { Page, PageScreenshotOptions } from 'playwright';
import path from 'path';

import {
  Where, What, PageState, Workflow, WorkflowFile,
  ParamType, SelectorArray, MetaData, CustomFunctions,
} from './workflow';

import { operators, meta } from './logic';
import { arrayToObject } from './utils';
import Concurrency from './concurrency';
import Preprocessor from './preprocessor';
import log, { Level } from './logger';

/**
 * Defines optional intepreter options (passed in constructor)
 */
interface InterpreterOptions {
  maxRepeats: number;
  maxConcurrency: number;
  serializableCallback: (output: any) => (void | Promise<void>);
  binaryCallback: (output: any, mimeType: string) => (void | Promise<void>);
}

/**
 * Class for running the Smart Workflows.
 */
export default class Interpreter {
  private meta: MetaData;

  private workflow: Workflow;

  private initializedWorkflow: Workflow | null;

  private options: InterpreterOptions;

  private preprocess: Preprocessor = new Preprocessor();

  private concurrency : Concurrency;

  constructor(workflow: WorkflowFile, options?: Partial<InterpreterOptions>) {
    this.meta = workflow.meta;
    this.workflow = workflow.workflow;
    this.initializedWorkflow = null;
    this.options = {
      maxRepeats: 5,
      maxConcurrency: 1,
      serializableCallback: (data) => { log(JSON.stringify(data), Level.DEBUG); },
      binaryCallback: () => { log('Received binary data, thrashing them.', Level.DEBUG); },
      ...options,
    };
    this.concurrency = new Concurrency(this.options.maxConcurrency);
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
           * Arrays are compared without order (are transformed into objects before comparison).
           */

          const parsedValue = Array.isArray(value) ? arrayToObject(value) : value;

          const parsedSuperset : Record<string, unknown> = {};
          parsedSuperset[key] = Array.isArray(superset[key])
            ? arrayToObject(<any>superset[key])
            : superset[key];

          // Every `subset` key must exist in the `superset` and
          // have the same value (strict equality), or subset[key] <= superset[key]
          return parsedSuperset[key]
          && (
            parsedSuperset[key] === parsedValue
            || (typeof parsedValue === 'object' && inclusive(<typeof subset>parsedValue, <typeof superset>parsedSuperset[key]))
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
              return array?.every((x) => this.applicable(x, context));
            case '$or':
              return array?.some((x) => this.applicable(x, context));
            case '$none':
              return !array?.some((x) => this.applicable(x, context));
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
  private async carryOutSteps(page: Page, steps: What[]) : Promise<void> {
  /**
   * Defines overloaded (or added) methods/actions usable in the workflow.
   * If a method overloads any existing method of the Page class, it accepts the same set
   * of parameters *(but can suppress some!)*\
   * \
   * Also, following piece of code defines functions to be run in the browser's context.
   * Beware of false linter errors - here, we know better!
   */
    const wawActions : Record<CustomFunctions, (...args: any[]) => void> = {
      screenshot: async (params: PageScreenshotOptions) => {
        const screenshotBuffer = await page.screenshot({
          ...params, path: undefined,
        });
        await this.options.binaryCallback(screenshotBuffer, 'image/png');
      },
      enqueueLinks: async (selector : string) => {
        const links : string[] = await page.locator(selector)
          .evaluateAll(
            (elements) => elements.map((a) => a.href).filter((x) => x),
          );
        const context = page.context();

        for (const link of links) {
          this.concurrency.addJob(async () => {
            try {
              const newPage = await context.newPage();
              await newPage.goto(link);
              await newPage.waitForLoadState('networkidle');
              await this.runLoop(newPage, this.initializedWorkflow!);
            } catch (e) {
              // `runLoop` uses soft mode, so it recovers from it's own exceptions
              // but newPage(), goto() and waitForLoadState() don't (and will kill
              // the interpreter by throwing).
              log(<Error>e, Level.ERROR);
            }
          });
        }
      },
      scrape: async (selector?: string) => {
        const scrapeResults : Record<string, string>[] = <any> await page
          // eslint-disable-next-line
          // @ts-ignore
          .evaluate((s) => scrape(s ?? null), selector);
        await this.options.serializableCallback(scrapeResults);
      },
      scrapeSchema: async (schema: Record<string, string>) => {
        const values = await Promise.all(
          Object.values(schema).map(
            (selector) => {
              const locator = page.locator(selector);
              return locator.allInnerTexts();
            },
          ),
        );

        const nRows = Math.max(...values.map((x) => x.length));

        for (let j = 0; j < nRows; j += 1) {
          const out = Object.fromEntries(Object.keys(schema).map((key, i) => [key, values[i][j]]));
          await this.options.serializableCallback(out);
        }
      },
      scroll: async (pages? : number) => {
        await page.evaluate(async (pagesInternal) => {
          for (let i = 1; i <= (pagesInternal ?? 1); i += 1) {
            // @ts-ignore
            window.scrollTo(0, window.scrollY + window.innerHeight);
          }
        }, pages ?? 1);
      },
      script: async (code : string) => {
        const AsyncFunction : FunctionConstructor = Object.getPrototypeOf(
          async () => {},
        ).constructor;
        const x = new AsyncFunction('page', code);
        await x(page);
      },
    };

    for (const step of steps) {
      log(`Launching ${step.type}`, Level.DEBUG);

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

  private async runLoop(p : Page, workflow: Workflow) {
    const usedActions : string[] = [];
    let lastAction = null;
    let repeatCount = 0;

    /**
    *  Enables the interpreter functionality for popup windows.
    * User-requested concurrency should be entirely managed by the concurrency manager,
    * e.g. via `enqueueLinks`.
    */
    p.on('popup', (popup) => {
      this.concurrency.addJob(() => this.runLoop(popup, workflow));
    });

    /* eslint no-constant-condition: ["warn", { "checkLoops": false }] */
    while (true) {
      if (p.isClosed()) {
        return;
      }

      try {
        await p.waitForLoadState('networkidle');
      } catch (e) {
        await p.close();
        return;
      }

      const pageState = await this.getState(p, workflow);
      const action = workflow.find(
        (step) => this.applicable(step.where, pageState, usedActions),
      );

      log(`Matched ${JSON.stringify(action?.where)}`, Level.DEBUG);

      if (action) { // action is matched
        repeatCount = action === lastAction ? repeatCount + 1 : 0;
        if (this.options.maxRepeats && repeatCount >= this.options.maxRepeats) {
          return;
        }
        lastAction = action;

        try {
          await this.carryOutSteps(p, action.what);
          usedActions.push(action.name ?? 'undefined');
        } catch (e) {
          log(`${action.name} didn't run successfully, retrying because of soft mode...`, Level.WARN);
          log(<Error>e, Level.ERROR);
        }
      } else {
        return;
      }
    }
  }

  /**
   * Spawns a browser context and runs given workflow.
   * \
   * Resolves after the playback is finished.
   * @param {Page} [page] Page to run the workflow on.
   * @param {ParamType} params Workflow specific, set of parameters
   *  for the `{$param: nameofparam}` fields.
   */
  public async run(page: Page, params? : ParamType) : Promise<void> {
    /**
     * `this.workflow` with the parameters initialized.
     */
    this.initializedWorkflow = this.preprocess.initParams(this.workflow, params);

    // @ts-ignore
    if (await page.evaluate(() => !<any>window.scrape)) {
      page.context().addInitScript({ path: path.join(__dirname, 'scraper.js') });
    }

    this.concurrency.addJob(() => this.runLoop(page, this.initializedWorkflow!));

    await this.concurrency.waitForCompletion();

    log('Workflow done, bye!', Level.DEBUG);
  }
}
