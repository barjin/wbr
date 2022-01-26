/* eslint-disable class-methods-use-this */
import {
  Workflow, WorkflowFile, ParamType, SelectorArray, Where,
} from './workflow';
import { operators } from './logic';

/**
* Class for static processing the workflow files/objects.
*/
export default class Preprocessor {
/**
* Extracts parameters from the workflow's metadata.
* @param {WorkflowFile} workflow The given workflow
* @returns {String[]} List of parameters' names.
*/
  getParams(workflow: WorkflowFile) : string[] {
    const getParamsRecurse = (object : any) : string[] => {
      if (typeof object === 'object') {
        // Recursion base case
        if (object.$param) {
          return [object.$param];
        }

        // Recursion general case
        return Object.values(object)
          .reduce((p: string[], v : any) : string[] => [...p, ...getParamsRecurse(v)], []);
      }
      return [];
    };

    return getParamsRecurse(workflow.workflow);
  }

  /**
* List all the selectors used in the given workflow (only literal "selector"
* field in WHERE clauses so far)
*/
  // TODO : add recursive selector search (also in click/fill etc. events?)
  extractSelectors(workflow: Workflow) : SelectorArray {
    /**
* Given a Where condition, this function extracts
* all the existing selectors from it (recursively).
*/
    const selectorsFromCondition = (where: Where) : SelectorArray => {
      // the `selectors` field is either on the top level
      let out = where.selectors ?? [];
      if (!Array.isArray(out)) {
        out = [out];
      }

      // or nested in the "operator" array
      operators.forEach((op) => {
        let condWhere = where[op];
        if (condWhere) {
          condWhere = Array.isArray(condWhere) ? condWhere : [condWhere];
          (condWhere).forEach((subWhere) => {
            out = [...out, ...selectorsFromCondition(subWhere)];
          });
        }
      });

      return out;
    };

    // Iterate through all the steps and extract the selectors from all of them.
    return workflow.reduce((p: SelectorArray, step) => [
      ...p,
      ...selectorsFromCondition(step.where).filter((x) => !p.includes(x)),
    ], []);
  }

  /**
* Recursively crawl `object` and initializes params - replaces the `{$param : paramName}` objects
* with the defined value.
* @returns {Workflow} Copy of the given workflow, modified (the initial workflow is left untouched).
*/
  initParams(workflow: Workflow, params?: ParamType) : Workflow {
    if (!params) {
      return workflow;
    }

    const initParamsRecurse = (object: unknown) : unknown => {
      if (!object || typeof object !== 'object') {
        return object;
      }

      const out = object;
      // for every key (child) of the object
      Object.keys(object!).forEach((key) => {
        // if the field has only one key, which is `$param`
        if (Object.keys((<any>object)[key]).length === 1 && (<any>object)[key].$param) {
          // and the param name exists in the `params` object
          if (params[(<any>object)[key].$param]) {
            // then replace
            (<any>out)[key] = params[(<any>object)[key].$param];
          } else {
            throw new SyntaxError(`Unspecified parameter found ${(<any>object)[key].$param}.`);
          }
        } else {
          initParamsRecurse((<any>object)[key]);
        }
      });
      return out;
    };

    // TODO: do better deep copy, this is hideous.
    const workflowCopy = JSON.parse(JSON.stringify(workflow));
    return <Workflow> initParamsRecurse(workflowCopy);
  }
}
