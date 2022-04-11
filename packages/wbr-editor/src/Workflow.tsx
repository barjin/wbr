import { useState, createContext } from "react";
import UpdaterFactory from "./components/functions/UpdaterFactory";
import Pair from "./components/Pair";
import { WhereWhatPair, WorkflowFile } from "./wbr-types/workflow";
import { runWorkflow } from "./components/tiny/Player";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import DropZone from "./components/dropZone";
import { HoverContext } from "./components/functions/globalState";

const emptyPair : any = {
    _reactID: Math.random().toString(36).substr(2, 9),
    where: {
        $and: []
    },
    what: [],
}

const tagPairIds = (workflow: WorkflowFile['workflow']) => {
    return workflow.map((pair, idx) => (
        {
            ...pair,
            _reactID: (pair as any)._reactID ?? Math.random().toString(36).substr(2, 9),
        }
    ));
}

const untagPairIds = (workflow: any[]) => {
    return workflow.map((pair) => (
        {
            ...pair,
            _reactID: undefined,
        }
    ));
}

export default function Workflow ({workflow}: {workflow: WorkflowFile}) : JSX.Element {
    const [wf, _setWorkflow] = useState(tagPairIds(workflow.workflow));
    const [isHovering, setHovering] = useState(false);

    const [historyStack, setHistoryStack] = useState({idx: 0, stack: [wf]});

    const pushToHistory = (newState: any) => {
        setHistoryStack({idx: historyStack.idx + 1, stack: [...historyStack.stack, newState]});
    }

    const canUndo = () => {
        return historyStack.idx > 0;
    }

    const canRedo = () => {
        return historyStack.idx < historyStack.stack.length - 1;
    }

    const undo = () => {
        const newIdx = historyStack.idx - 1;
        setHistoryStack({...historyStack, idx: newIdx});
        _setWorkflow(historyStack.stack[newIdx]);
    }

    const setWorkflow = (newWorkflow: typeof wf) => {
        const taggedWorkflow = tagPairIds(newWorkflow);
        pushToHistory(taggedWorkflow);

        _setWorkflow(taggedWorkflow);
        const downloadLink = document.getElementById('download_link');
        downloadLink?.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify({...workflow, workflow: untagPairIds(newWorkflow)}, null, 2))}`);
        downloadLink?.setAttribute('download', `workflow.json`);
    }
    
    const updatePair = UpdaterFactory.ArrayIdxUpdater(wf, setWorkflow, {deleteEmpty: true});

    const pushPair = UpdaterFactory.ArrayPusher(wf,setWorkflow);

    const movePair = (to: number) => (from: string) => {
        const pair = wf.find((pair) => pair._reactID === from);
        const pairIdx = wf.findIndex((pair) => pair._reactID === from);

        setWorkflow(update(wf, {
            $splice: [[pairIdx, 1], [to - (to > pairIdx ? 1 : 0), 0, pair!]]
        }));
    }

    const playWorkflow = () => {
        runWorkflow({...workflow, workflow: untagPairIds(wf)});
    }

    return (
        <div style={{display: 'block'}}>
        <button onClick={undo} disabled={!canUndo()}>&lt;</button>
        <button disabled={!canRedo()}>&gt;</button>
        <a id='download_link'>Download this Workflow!</a>
        <button onClick={playWorkflow}>Play this workflow!</button>
        <HoverContext.Provider value={{isHovering: isHovering, setHovering: (setHovering as any)}}>
            <DndProvider backend={HTML5Backend}>
                <DropZone key={0} swap={movePair(0)}/>
                {wf.map((pair,i) => (
                <>
                    <Pair 
                        updater={updatePair(i)} 
                        pair={pair}
                        key={pair._reactID}
                    />
                    <DropZone key={i+1} swap={movePair(i+1)}/>
                </>
            ))}
            </DndProvider>
        </HoverContext.Provider>
        <div className="button primary" onClick={() => pushPair()(emptyPair)}>+</div>
        </div>
    )
}