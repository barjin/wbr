/* eslint-disable no-nested-ternary */
import { WorkflowFile, naryOperators, unaryOperators } from '@wbr-project/wbr-interpret';
import { RenderValue } from '../Editables';
import { Select, DeleteButton } from '../../Reusables/Controls';

import UpdaterFactory from '../Utils/UpdaterFactory';

type WhereType = WorkflowFile['workflow'][number]['where'];

type NaryOperator = typeof naryOperators[number];
type UnaryOperator = typeof unaryOperators[number];

// TODO: Implement all the "templates" (remove Partial<>)
const ConditionDefaults: Partial<Record<keyof WhereType, any>> = {
  url: 'https://jindrich.bar/',
  selectors: ['selectors'],
  cookies: { cookie_name: 'cookie_value' },
  $and: [],
  $or: [],
  $after: 'Pair_ID',
  $before: 'Pair_ID',
  // '$not': {},
};

let WhereList : Function;

export default function Where<T extends WhereType>(
  { where, updater, base }: { where: T, updater: (arg0: T) => void, base?: boolean },
) : JSX.Element {
  const updateOnKey = UpdaterFactory.ObjectValueUpdater(where, updater);
  const removeKey = UpdaterFactory.ObjectRemoveKey(where, updater);

  return (
    <div className="where" style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ flexDirection: 'column' }}>
        {Object.entries(where).map(([k, v]: [any, any]) => (
            <div className='record'>
              {!base
                ? <div className='key'>
                         <span>{k}</span>
                         <div className='spacer'/>
                         <DeleteButton callback={removeKey(k)}/>
                     </div>
                : null
            }
                {!naryOperators.includes(k as NaryOperator)
                  ? (!unaryOperators.includes(k as UnaryOperator)
                    ? <div className='value'>
                        <RenderValue
                          val={v}
                          updater={updateOnKey(k) as any} options={{ dynamic: true, type: k }}
                        />
                    </div>
                    : <Where where={v as WhereType} updater={updateOnKey(k) as any} />)
                  : <WhereList whereList={v as WhereType[]} updater={updateOnKey(k) as any}/>}
            </div>
        ))}
        </div>
    </div>
  );
}

WhereList = <T extends WhereType>(
  { whereList, updater }: { whereList: T[], updater : (arg0: T[]) => void },
): JSX.Element => {
  const instantiateCondition = (name: keyof WhereType) : void => {
    updater(
      [...whereList, {
        [name]: ConditionDefaults[name],
      } as T],
    );
  };

  const updateOnIdx = UpdaterFactory.ArrayIdxUpdater(whereList, updater, { deleteEmpty: true });

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className='verticalLine'/>
            <Select options={Object.keys(ConditionDefaults)} select={instantiateCondition}/>
            </div>
        <div>
            {whereList.map((x, i) => <Where where={x} updater={updateOnIdx(i)}/>)}
        </div>
    </div>);
};

// export default memo(Where, (prev, next) => objectEquality(prev.where, next.where));
