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
    const [wf, _setWorkflow] = useState(workflow);

    const setWorkflow = (newWorkflow: typeof workflow) => {
        _setWorkflow(newWorkflow);
        const downloadLink = document.getElementById('download_link');
        downloadLink?.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(newWorkflow, null, 2))}`);
        downloadLink?.setAttribute('download', `workflow.json`);
    }

    const removePair = UpdaterFactory.ArrayIdxDeleter(wf,setWorkflow);
    
    const updatePair = UpdaterFactory.ArrayIdxUpdater(wf,setWorkflow);

    const pushPair = UpdaterFactory.ArrayPusher(wf,setWorkflow);

    console.log(JSON.stringify(wf,null,2));

    return (
        <>
        <a id='download_link'>Download this Workflow!</a>
        {wf.map((pair,i) => <Pair updater={updatePair(i)} pair={pair}/>)}
        </>
    )
}