import { Page, Browser } from 'playwright';
import { operators, meta } from './logic';

type Operator = typeof operators[number];
type Meta = typeof meta[number];

type SelectorArray = string[];

type BaseConditions = {
  'url': string,
  'cookies': Record<string, string>,
  'selectors': SelectorArray,
} & Record<Meta, string>;

type Where =
Partial<{ [key in Operator]: Where | Where[] }>
& Partial<BaseConditions>
& Partial<Record<Meta, string>>;

type MethodNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type What = {
  type: MethodNames<Page>,
  params?: any[] | any
};

type PageState = Partial<BaseConditions>;

type ParamType = Record<string, string>;

type MetaData = {
  params?: (keyof ParamType)[],
  dataset?: string,
  name?: string,
  desc?: string,
};

type Workflow = {
  name?: string
  where: Where
  what: What[],
}[];

type WorkflowFile = {
  meta: metaData,
  workflow: Workflow
};
