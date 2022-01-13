import { Page } from 'playwright';
import { operators, meta } from './logic';

export type Operator = typeof operators[number];
export type Meta = typeof meta[number];

export type SelectorArray = string[];

type BaseConditions = {
  'url': string,
  'cookies': Record<string, string>,
  'selectors': SelectorArray | string,
} & Record<Meta, string>;

export type Where =
Partial<{ [key in Operator]: Where | Where[] }>
& Partial<BaseConditions>
& Partial<Record<Meta, string>>;

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
