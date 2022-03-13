import { useState } from "react";
import UpdaterFactory from "./conditions/functions/UpdaterFactory";
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

    const removePair = UpdaterFactory.ArrayIdxDeleter(wf,setWorkflow);
    
    const updatePair = UpdaterFactory.ArrayIdxUpdater(wf,setWorkflow);

    const pushPair = UpdaterFactory.ArrayPusher(wf,setWorkflow);

    console.log(JSON.stringify(wf,null,2));

    return (
        <>
        {wf.map((pair,i) => <Pair updater={updatePair(i)} pair={pair}/>)}
        </>
    )
}