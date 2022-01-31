import { Page } from 'playwright';
import { operators, meta } from './logic';

export type Operator = typeof operators[number];
export type Meta = typeof meta[number];

export type SelectorArray = string[];

type RegexableString = string | { '$regex':string };

type BaseConditions = {
  'url': RegexableString,
  'cookies': Record<string, RegexableString>,
  'selectors': SelectorArray | string, // (CSS/Playwright) selectors use their own logic, there is no reason (and several technical difficulties) to allow regular expression notation
} & Record<Meta, RegexableString>;

export type Where =
Partial<{ [key in Operator]: Where | Where[] }> // either a (logic) operator
& Partial<BaseConditions>; // or one of the base conditions

type MethodNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

export type CustomFunctions = 'scrape' | 'scrapeSchema' | 'scroll' | 'screenshot' | 'script' | 'enqueueLinks';

export type What = {
  type: MethodNames<Page> & CustomFunctions,
  params?: any[] | any
};

export type PageState = Partial<BaseConditions>;

export type ParamType = Record<string, string>;

export type MetaData = {
  name?: string,
  desc?: string,
  params?: (keyof ParamType)[]
};

export type Workflow = {
  name?: string
  where: Where
  what: What[],
}[];

export type WorkflowFile = {
  meta: MetaData,
  workflow: Workflow
};
