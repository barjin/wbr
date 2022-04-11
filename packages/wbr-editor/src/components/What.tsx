import { What as StepType } from '../wbr-types/workflow';
import UpdaterFactory from './functions/UpdaterFactory';
import { RenderValue } from './tiny';
import { DeleteButton, Select } from './tiny/Controls';

function WhatStep({step, updater}: {step: StepType, updater: Function}): JSX.Element {
    const updateArgs = (args: StepType['args']) => {
        updater({
            ...step,
            args
        })
    }

    const deleteStep = () => updater({});

    return <div>
        <div style={{display: 'flex', flexDirection: 'row'}}><p>{step.action}</p><div className='spacer'/><DeleteButton callback={deleteStep}/></div>
        <p>{step.args ? <RenderValue val={step.args} updater={updateArgs}/> : <></>}</p>
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
    'waitForLoadState' : ['load'],
    'fill' : ['selector', 'text'],
    'keyboard.press' : ['Enter']
};

export default function What({what, updater}: {what: StepType[], updater: (x: StepType[]) => void}) : JSX.Element {
    const instantiateAction = (name: keyof typeof ActionDefaults) : void => {
        updater(
            [...what, {
                action: name,
                args: ActionDefaults[name],
            } as any]
        )
    }

    const updateStep = UpdaterFactory.ArrayIdxUpdater(what, updater, {deleteEmpty: true});

    return (
    <div>
        {what.map((x,i) => <WhatStep step={x} updater={updateStep(i)}/>)}
        <Select options={Object.keys(ActionDefaults)} select={instantiateAction}/>
    </div>
    );
}