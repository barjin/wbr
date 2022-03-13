import { What as StepType } from '../wbr-types/workflow';
import { RenderValue } from './tiny';
import Select from './tiny/Select';

function WhatStep({step}: {step: StepType}): JSX.Element {
    return <div>
        <h3>{step.action}</h3>
        <p>{step.args ? <RenderValue val={step.args} updater={()=>{}}/> : <></>}</p>
    </div>
}

const ActionDefaults = {
    'click' : ['selector'],
    'goto' : ['url'],
    'scrape' : undefined,
    'scrapeSchema' : [{
        'first column name': 'selector',
        'second column name': 'selector',
    }],
    // '$not': {},
};

export default function What({what, updater}: {what: StepType[], updater: (x: StepType[]) => void}) : JSX.Element {
    const instantiateAction = (name: keyof typeof ActionDefaults) : void => {
        updater(
            [...what, {
                action: [name],
                args: ActionDefaults[name],
            } as any]
        )
    }

    return (
    <div>
        {what.map(x=><WhatStep step={x}/>)}
        <Select options={Object.keys(ActionDefaults)} select={instantiateAction}/>
    </div>
    );
}