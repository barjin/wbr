import { useState } from "react";
import UpdaterFactory from "./components/functions/UpdaterFactory";
import Pair from "./components/Pair";
import { WhereWhatPair, WorkflowFile } from "./wbr-types/workflow";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import DropZone from "./components/dropZone";
import { HoverContext, CollapseContext } from "./components/functions/globalState";
import Button from "./components/tiny/Button";
import { AiOutlineNodeCollapse, AiOutlineNodeExpand } from 'react-icons/ai';

const emptyPair = {
    _reactID: Math.random().toString(36).substr(2, 9),
    where: {
        $and: []
    },
    what: [],
}

export default function WorkflowEditor ({workflow, setWorkflow}: {workflow: WorkflowFile['workflow'], setWorkflow: (pairs: WhereWhatPair[]) => void}) : JSX.Element {
    const [isHovering, setHovering] = useState(false);
    const [isCollapsed, setCollapsed] = useState(false);
   
    const updatePair = UpdaterFactory.ArrayIdxUpdater(workflow, setWorkflow, {deleteEmpty: true});

    const pushPair = UpdaterFactory.ArrayPusher(workflow, setWorkflow);

    const movePair = (to: number) => (from: string) => {
        const pair = workflow.find((pair: any) => pair._reactID === from);
        const pairIdx = workflow.findIndex((pair: any) => pair._reactID === from);

        setWorkflow(update(workflow, {
            $splice: [[pairIdx, 1], [to - (to > pairIdx ? 1 : 0), 0, pair!]]
        }));
    }

    return (
        <div style={{display: 'block'}}>
        <Button
            icon={!isCollapsed ? <AiOutlineNodeCollapse/> : <AiOutlineNodeExpand/>}
            text={!isCollapsed ? "Collapse rules" : "Expand rules"}
            onClick={() => {setCollapsed(!isCollapsed)}}
        />
        <CollapseContext.Provider value={{isCollapsed: isCollapsed, setCollapsed: (setCollapsed as any)}}>
            <HoverContext.Provider value={{isHovering: isHovering, setHovering: (setHovering as any)}}>
                <DndProvider backend={HTML5Backend}>
                    <DropZone key={0} swap={movePair(0)}/>
                    {workflow.map((pair,i) => (
                    <>
                        <Pair 
                            updater={updatePair(i)} 
                            pair={pair as any}
                            key={(pair as any)._reactID}
                        />
                        <DropZone key={i+1} swap={movePair(i+1)}/>
                    </>
                ))}
                </DndProvider>
            </HoverContext.Provider>
        </CollapseContext.Provider>
        <div className="button primary" onClick={() => pushPair()(emptyPair)}>+</div>
        </div>
    )
}