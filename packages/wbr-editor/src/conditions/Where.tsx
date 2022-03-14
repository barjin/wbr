import { Where as WhereType } from '../wbr-types/workflow';
import { naryOperators, unaryOperators } from '../wbr-types/logic';
import { RenderValue } from './tiny';
import { Select, DeleteButton } from './tiny/Controls';

import UpdaterFactory from './functions/UpdaterFactory';

type NaryOperator = typeof naryOperators[number];
type UnaryOperator = typeof unaryOperators[number];

// TODO: Implement all the "templates" (remove Partial<>)
const ConditionDefaults: Partial<Record<keyof WhereType, any>> = {
    'url': 'url',
    'selectors': ['selectors'],
    'cookies': {'cookie_name': 'cookie_value'},
    '$and': [],
    '$or': [],
    '$after': 'action_id',
    '$before': 'action_id',
    // '$not': {},
};

function WhereList<T extends WhereType>({whereList, updater}: {whereList: T[], updater : (arg0: T[]) => void}): JSX.Element {
    const instantiateCondition = (name: keyof WhereType) : void => {
        updater(
            [...whereList, {
                [name]: ConditionDefaults[name],
            } as T]
        )
    }

    const updateOnIdx = UpdaterFactory.ArrayIdxUpdater(whereList, updater, {deleteEmpty: true});


    return (
    <div style={{display: 'flex', flexDirection: 'row'}}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
            <div className='verticalLine'/>
            <Select options={Object.keys(ConditionDefaults)} select={instantiateCondition}/>
            </div>
        <div>
            {whereList.map((x,i) => <Where where={x} updater={updateOnIdx(i)}/>)}
        </div>
    </div>);
}

export default function Where<T extends WhereType>({where, updater}: {where: T, updater: (arg0: T) => void}) : JSX.Element {
    const updateOnKey = UpdaterFactory.ObjectValueUpdater(where, updater);
    const removeKey = UpdaterFactory.ObjectRemoveKey(where, updater);

    return (
            <div className="where" style={{display: 'flex', flexDirection: 'row'}}>
                <div style={{flexDirection: 'column'}}>
                {Object.entries(where).map(([k,v]: [any, any]) => (
                    <div className='record'>
                    <div className='key'>
                        <span>{k}</span> 
                        <div className='spacer'/>
                        <DeleteButton callback={removeKey(k)}/>
                    </div>
                        {!naryOperators.includes(k as NaryOperator) ? 
                            (!unaryOperators.includes(k as UnaryOperator) ?
                            <div className='value'>
                                <RenderValue val={v} updater={updateOnKey(k) as any} options={{dynamic: true}}/>
                            </div> :
                            <Where where={v as WhereType} updater={updateOnKey(k) as any} />) :
                        <WhereList whereList={v as WhereType[]} updater={updateOnKey(k) as any}/>}
                    </div>
                ))}
                </div>
        </div>
    )
}