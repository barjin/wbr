import { Where as WhereType } from '../wbr-types/workflow';
import { naryOperators, unaryOperators } from '../wbr-types/logic';
import { RenderValue } from './tiny';
import { useState } from 'react';
import Select from './tiny/Select';

type NaryOperator = typeof naryOperators[number];
type UnaryOperator = typeof unaryOperators[number];

const ConditionDefaults: Record<keyof Required<WhereType>, any>= {
    'url': 'url',
    'selectors': ['selectors'],
    'cookies': {'cookie_name': 'cookie_value'},
    '$and': [],
    '$or': [],
    '$after': 'action_id',
    '$before': 'action_id',
    '$not': {},
};

function WhereList({whereList, updater}: {whereList: WhereType[], updater:Function}): JSX.Element {
    const setList = (list: typeof whereList) => {
        updater(list);
    }

    const updateOnIdx = (idx: keyof typeof whereList) => (cond: WhereType) => {
        setList(whereList.map((x,i) => i === idx ? cond : x));
    }

    const addCondition = (name: keyof WhereType) : void => {
        setList(
            [...whereList, {
                [name]: ConditionDefaults[name],
            }]
        )
    }

    return (
    <div style={{display: 'flex', flexDirection: 'row'}}>
    <div style={{display: 'flex', flexDirection: 'column'}}>
        <div className='verticalLine'/>
        <Select options={Object.keys(ConditionDefaults)} select={addCondition}/>
        </div>
    <div>
        {whereList.map((x,i) => <Where where={x as WhereType} updater={updateOnIdx(i)}/>)}
    </div>
    </div>);
}

export default function Where({where, updater}: {where: WhereType, updater: Function}) : JSX.Element {
    // const [state, setWhere] = useState(where);

    // console.log(state);

    const setWhere = (newWhere: WhereType) => {
        updater(newWhere);
    }

    const updateOnKey = (key: keyof WhereType) : Function => (
        (newValue: keyof WhereType) => {
            setWhere({...where, [key]: newValue});
        }
    );
    
    const removeKey = (keyToRemove: keyof WhereType) => () => {
            setWhere(Object.fromEntries(Object.entries(where).filter(([k]) => k !== keyToRemove)));
        }

    return (
            <div className="where" style={{display: 'flex', flexDirection: 'row'}}>
                <div style={{flexDirection: 'column'}}>
                {Object.entries(where).map(([k,v]: [any, any]) => (
                    <div className='record'>
                    <div className='key'>
                        <span>{k}</span> 
                        <div className='spacer'/>
                        <div className='button warning' onClick={removeKey(k)}>x</div>
                    </div>
                        {!naryOperators.includes(k as NaryOperator) ? 
                            (!unaryOperators.includes(k as UnaryOperator) ?
                            <div className='value'>
                                <RenderValue val={v} updater={updateOnKey(k) as any}/>
                            </div> :
                            <Where where={v as WhereType} updater={updateOnKey(k) as any} />) :
                        <WhereList whereList={v as WhereType[]} updater={updateOnKey(k) as any}/>}
                    </div>
                ))}
                </div>
        </div>
    )
}