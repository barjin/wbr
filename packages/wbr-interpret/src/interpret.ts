/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { Page, PageScreenshotOptions } from 'playwright';
import path from 'path';

import { EventEmitter } from 'events';
import {
  Where, What, PageState, Workflow, WorkflowFile,
  ParamType, SelectorArray, CustomFunctions,
} from './types/workflow';

import { operators, meta } from './types/logic';
import { arrayToObject } from './utils/utils';
import Concurrency from './utils/concurrency';
import Preprocessor from './preprocessor';
import log, { Level } from './utils/logger';

/**
 * Defines optional intepreter options (passed in constructor)
 */
interface InterpreterOptions {
  maxRepeats: number;
  maxConcurrency: number;
  serializableCallback: (output: any) => (void | Promise<void>);
  binaryCallback: (output: any, mimeType: string) => (void | Promise<void>);
  debug: boolean;
  debugChannel: Partial<{
    activeId: Function,
    debugMessage: Function,
  }>
}

/**
 * Class for running the Smart Workflows.
 */
export default class Interpreter extends EventEmitter {
  private workflow: Workflow;

  private initializedWorkflow: Workflow | null;

  private options: InterpreterOptions;

  private concurrency : Concurrency;

  private stopper : Function | null = null;

  private log : typeof log;

  constructor(workflow: WorkflowFile, options?: Partial<InterpreterOptions>) {
    super();
    this.workflow = workflow.workflow;
    this.initializedWorkflow = null;
    this.options = {
      maxRepeats: 5,
      maxConcurrency: 5,
      serializableCallback: (data) => { log(JSON.stringify(data), Level.WARN); },
      binaryCallback: () => { log('Received binary data, thrashing them.', Level.WARN); },
      debug: false,
      debugChannel: {},
      ...options,
    };
    this.concurrency = new Concurrency(this.options.maxConcurrency);
    this.log = (...args) => log(...args);

    const error = Preprocessor.validateWorkflow(workflow);
    if (error) {
      throw (error);
    }

    if (this.options.debugChannel?.debugMessage) {
      const oldLog = this.log;
      // @ts-ignore
      this.log = (...args: Parameters<typeof oldLog>) => {
        if (args[1] !== Level.LOG) {
          this.options.debugChannel.debugMessage!(typeof args[0] === 'string' ? args[0] : args[0].message);
        }
        oldLog(...args);
      };
    }
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
    const selectors = Preprocessor.extractSelectors(workflow);

    /**
      * Determines whether the element targetted by the selector is [actionable](https://playwright.dev/docs/actionability).
      * @param selector Selector to be queried
      * @returns True if the targetted element is actionable, false otherwise.
      */
    const actionable = async (selector: string) : Promise<boolean> => {
      try {
        const proms = [
          page.isEnabled(selector, { timeout: 500 }),
          page.isVisible(selector, { timeout: 500 }),
          (async () => {
            const element = await page.locator(selector);
            return element.evaluate((e) => {
              const r = e.getBoundingClientRect();
              // @ts-ignore Playwright typings.
              return e === document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            });
          })(),
        ];

        return await Promise.all(proms).then((bools) => bools.every((x) => x));
      } catch (e) {
        // log(<Error>e, Level.ERROR);
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
            (parsedSuperset[key] === parsedValue)
            || ((parsedValue).constructor.name === 'RegExp' && (<RegExp>parsedValue).test(<string>parsedSuperset[key]))
            || (
              (parsedValue).constructor.name !== 'RegExp'
              && typeof parsedValue === 'object' && inclusive(<typeof subset>parsedValue, <typeof superset>parsedSuperset[key])
            )
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
            case '$not':
              return !this.applicable(<Where>value, context); // $not should be a unary operator
            default:
              throw new Error('Undefined logic operator.');
          }
        } else if (meta.includes(<any>key)) {
          const testRegexString = (x: string) => {
            if (typeof value === 'string') {
              return x === value;
            }

            return (<RegExp><unknown>value).test(x);
          };

          switch (key as keyof typeof meta) {
            case '$before':
              return !usedActions.find(testRegexString);
            case '$after':
              return !!usedActions.find(testRegexString);
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
   * of parameters *(but can override some!)*\
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
            // @ts-ignore
            (elements) => elements.map((a) => a.href).filter((x) => x),
          );
        const context = page.context();

        for (const link of links) {
          // eslint-disable-next-line
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
              this.log(<Error>e, Level.ERROR);
            }
          });
        }
        await page.close();
      },
      scrape: async (selector?: string) => {
        const scrapeResults : Record<string, string>[] = <any> await page
          // eslint-disable-next-line
          // @ts-ignore
          .evaluate((s) => scrape(s ?? null), selector);
        await this.options.serializableCallback(scrapeResults);
      },
      scrapeSchema: async (schema: Record<string, string>) => {
        const handleLists = await Promise.all(
          Object.values(schema).map((selector) => page.$$(selector)),
        );

        const namedHandleLists = Object.fromEntries(
          Object.keys(schema).map((key, i) => [key, handleLists[i]]),
        );

        const scrapeResult = await page.evaluate((n) => scrapeSchema(n), namedHandleLists);

        this.options.serializableCallback(scrapeResult);
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
        const x = new AsyncFunction('page', 'log', code);
        await x(page, this.log);
      },
      flag: async () => new Promise((res) => {
        this.emit('flag', page, res);
      }),
    };

    for (const step of steps) {
      this.log(`Launching ${step.action}`, Level.LOG);

      if (step.action in wawActions) {
        // "Arrayifying" here should not be needed (TS + syntax checker - only arrays; but why not)
        const params = !step.args || Array.isArray(step.args) ? step.args : [step.args];
        await wawActions[step.action as CustomFunctions](...(params ?? []));
      } else {
      // Implements the dot notation for the "method name" in the workflow
        const levels = step.action.split('.');
        const methodName = levels[levels.length - 1];

        let invokee : any = page;
        for (const level of levels.splice(0, levels.length - 1)) {
          invokee = invokee[level];
        }

        if (!step.args || Array.isArray(step.args)) {
          await (<any>invokee[methodName])(...(step.args ?? []));
        } else {
          await (<any>invokee[methodName])(step.args);
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
      // Checks whether the page was closed from outside,
      //  or the workflow execution has been stopped via `interpreter.stop()`
      if (p.isClosed() || !this.stopper) {
        return;
      }

      try {
        await p.waitForLoadState();
      } catch (e) {
        await p.close();
        return;
      }

      let pageState = {};
      try {
        pageState = await this.getState(p, workflow);
      } catch (e: any) {
        this.log('The browser has been closed.');
        return;
      }

      if (this.options.debug) {
        this.log(`Current state is: \n${JSON.stringify(pageState, null, 2)}`, Level.WARN);
      }
      const actionId = workflow.findIndex(
        (step) => this.applicable(step.where, pageState, usedActions),
      );

      const action = workflow[actionId];

      this.log(`Matched ${JSON.stringify(action?.where)}`, Level.LOG);

      if (action) { // action is matched
        if (this.options.debugChannel?.activeId) {
          this.options.debugChannel.activeId(actionId);
        }

        repeatCount = action === lastAction ? repeatCount + 1 : 0;
        if (this.options.maxRepeats && repeatCount >= this.options.maxRepeats) {
          return;
        }
        lastAction = action;

        try {
          await this.carryOutSteps(p, action.what);
          usedActions.push(action.id ?? 'undefined');
        } catch (e) {
          this.log(<Error>e, Level.ERROR);
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
    if (this.stopper) {
      throw new Error('This Interpreter is already running a workflow. To run another workflow, please, spawn another Interpreter.');
    }
    /**
     * `this.workflow` with the parameters initialized.
     */
    this.initializedWorkflow = Preprocessor.initWorkflow(this.workflow, params);

    // @ts-ignore
    if (await page.evaluate(() => !<any>window.scrape)) {
      page.context().addInitScript({ path: path.join(__dirname, 'browserSide', 'scraper.js') });
    }

    this.stopper = () => {
      this.stopper = null;
    };

    this.concurrency.addJob(() => this.runLoop(page, this.initializedWorkflow!));

    await this.concurrency.waitForCompletion();

    this.stopper = null;
  }

  public async stop() : Promise<void> {
    if (this.stopper) {
      await this.stopper();
      this.stopper = null;
    } else {
      throw new Error('Cannot stop, there is no running workflow!');
    }
  }
}
