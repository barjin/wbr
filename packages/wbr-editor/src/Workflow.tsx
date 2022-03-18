import { useState } from "react";
import UpdaterFactory from "./conditions/functions/UpdaterFactory";
import Pair from "./conditions/Pair";
import { WhereWhatPair, WorkflowFile } from "./wbr-types/workflow";
import { runWorkflow } from "./conditions/tiny/Player";

const emptyPair : WhereWhatPair = {
    where: {
        $and: []
    },
    what: []
}

export default function Workflow ({workflow}: {workflow: WorkflowFile}) : JSX.Element {
    
    const [wf, _setWorkflow] = useState(workflow.workflow);

    const setWorkflow = (newWorkflow: typeof wf) => {
        _setWorkflow(newWorkflow);
        const downloadLink = document.getElementById('download_link');
        downloadLink?.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify({...workflow, workflow: newWorkflow}, null, 2))}`);
        downloadLink?.setAttribute('download', `workflow.json`);
    }
    
    const updatePair = UpdaterFactory.ArrayIdxUpdater(wf, setWorkflow, {deleteEmpty: true});

    const pushPair = UpdaterFactory.ArrayPusher(wf,setWorkflow);

    const playWorkflow = () => {
        runWorkflow({...workflow, workflow: wf});
    }

    console.log(JSON.stringify(wf,null,2));

    return (
        <div style={{display: 'block'}}>
        <a id='download_link'>Download this Workflow!</a>
        <button onClick={playWorkflow}>Play this workflow!</button>
        {wf.map((pair,i) => <Pair updater={updatePair(i)} pair={pair}/>)}
        <div className="button primary" onClick={() => pushPair()(emptyPair)}>+</div>
        </div>
    )
}