import { What as StepType } from '../wbr-types/workflow';
import { RenderValue } from './tiny';

function WhatStep({step}: {step: StepType}): JSX.Element {
    return <div>
        <p>Action:</p>
        <RenderValue val={step.action} updater={()=>{}}/>
        <p>With params: {step.args ? <RenderValue val={step.args} updater={()=>{}}/> : <></>}</p>
    </div>
}

export default function What({what}: {what: StepType[]}) : JSX.Element {
    return (
    <div>
        {what.map(x=><WhatStep step={x}/>)}
    </div>
    );
}