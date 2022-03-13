import { useState } from "react";
import Pair from "./conditions/Pair";
import { WhereWhatPair, WorkflowFile } from "./wbr-types/workflow";

const emptyPair : WhereWhatPair = {
    where: {
        $and: []
    },
    what: []
}

export default function Workflow ({workflow}: {workflow: WorkflowFile['workflow']}) : JSX.Element {
    const [wf, setWorkflow] = useState(workflow);

    const removePair = (idx: keyof typeof wf) => () => {
        setWorkflow(wf.filter((_,i) => i !== idx));
    }
    
    const updatePair = (idx: keyof typeof wf) => (pair: WhereWhatPair) => {
        setWorkflow(wf.map((x,i) => i === idx ? pair : x));
    }

    const pushPair = () => {
        setWorkflow([...wf, emptyPair]);
    }

    return (
        <>
        {wf.map((pair,i) => <Pair updater={updatePair(i)} pair={pair}/>)}
        </>
    )
}