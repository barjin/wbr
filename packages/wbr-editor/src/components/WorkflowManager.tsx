import { useState, useRef } from 'react';
import { WorkflowFile } from "../wbr-types/workflow";
import Workflow from "../WorkflowEditor";
import { runWorkflow } from "./tiny/Player";
import Button from './tiny/Button';
import { AiOutlineUndo, AiOutlineRedo, AiOutlineDownload, AiOutlinePlayCircle } from 'react-icons/ai';

/**
 * A generic class for managing discrete state history.
 */
class HistoryManager<T> {
    private historyStack : T[] = [];
    private historyId : number = 0;
    private outCallback: (state: T) => void = () => {};

    /**
     * Constructor for the HistoryManager class.
     * @param state The initial history state.
     * @param outCallback A callback to be called when undo/redo is called.
     */
    constructor(state: T, outCallback: (state: T) => void){
        this.historyStack.push(state);
        this.outCallback = outCallback;
    }

    /**
     * Adds a new state to the history stack.
     * If `redo` is possible, the "next" state will be replaced by the new one.
     * @param state The new state to be added to the history.
     */
    public newState(state: T){
        if(this.historyId < this.historyStack.length - 1){
            this.historyStack.splice(this.historyId + 1);
        }
        this.historyStack.push(state);
        this.historyId += 1;
    }

    /**
     * Tests if the history can be undone.
     * @returns `true` if the history can be undone, `false` otherwise.
     */
    public canUndo(){
        return this.historyId > 0;
    }

    /**
     * Tests if the history can be redone.
     * @returns `true` if the history can be redone, `false` otherwise.
     */
    public canRedo(){
        return this.historyId < this.historyStack.length - 1;
    }

    /**
     * Redoes the last action.
     */
    public redo = () => {
        if(this.canRedo()){
            this.historyId += 1;
            this.outCallback(this.historyStack[this.historyId]);
        }
    }

    /**
     * Undoes the last action.
     */
    public undo = () => {
        if(this.canUndo()){
            this.historyId -= 1;
            this.outCallback(this.historyStack[this.historyId]);
        }
    }
}

/**
 * A wrapper element for high-level worklfow management (renaming, download, undo/redo, etc.).
 */
export function WorkflowManager({workflow}: {workflow: WorkflowFile}) : JSX.Element {
    const [workflowState, _setWorkflow] = useState(workflow);
    const historyManager = useRef(new HistoryManager(workflowState, _setWorkflow));

    /**
     * Tags each pair in the given WorkflowFile with a unique ID (React specific).
     * @param workflow The WorkflowFile to be tagged.
     * @returns Tagged WorkflowFile.
     */
    const tagPairIds = (workflow: WorkflowFile) => {
        return {
            ...workflow,
            workflow: workflow.workflow.map((pair) => (
            {
                ...pair,
                _reactID: (pair as any)._reactID ?? Math.random().toString(36).substr(2, 9),
            }
        ))};
    }
    
    /**
     * Removes the React tags from each pair in the given WorkflowFile.
     * @param workflow The WorkflowFile to be untagged.
     * @returns Untagged WorkflowFile.
     */
    const untagPairIds = (workflow: WorkflowFile) => {
        return {
            ...workflow,
            workflow: workflow.workflow.map((pair) => (
            {
                ...pair,
                _reactID: undefined,
            }
        ))};
    }

    const playWorkflow = () => {
        runWorkflow(workflowState);
    }

    /**
     * Wrapper function for the state setter. Handles the history management, download link generation, etc.
     * @param newWorkflow New WorkflowFile to be set.
     */
    const setWorkflow = (newWorkflow: typeof workflowState) : void => {
        const taggedWorkflow = tagPairIds(newWorkflow);
        historyManager.current.newState(taggedWorkflow);

        _setWorkflow(taggedWorkflow);
        const downloadLink = document.getElementById('downloadLink');
        downloadLink?.setAttribute(
            'href', 
            `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify({...workflow, workflow: untagPairIds(newWorkflow)}, null, 2))}`
        );
        downloadLink?.setAttribute('download', `workflow.json`);
    }
    return (
        <div style={{width: '100%', paddingRight: '10px'}}>
            <div>
            <Button 
                onClick={historyManager.current.undo} 
                icon={<AiOutlineUndo/>}
                text={'Undo'}
                disabled={!historyManager.current.canUndo()}
            />
            <Button 
                onClick={historyManager.current.redo} 
                icon={<AiOutlineRedo/>}
                text={'Redo'}
                disabled={!historyManager.current.canRedo()}
            />
            <a id='downloadLink'>
            <Button 
                icon={<AiOutlineDownload/>}
                text={'Download'}
            />
            </a>
            <Button 
                onClick={playWorkflow} 
                icon={<AiOutlinePlayCircle/>}
                text={'Play'}
            />
            </div>
            <Workflow {
                ...{ 
                    workflow: workflowState.workflow, 
                    setWorkflow: (pairs: WorkflowFile['workflow']) => setWorkflow({...workflowState, workflow: pairs})
                }
            }
            />
        </div>
    )
}