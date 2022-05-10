import { useState, useRef, useEffect } from 'react';
import {
  AiOutlineUndo, AiOutlineRedo, AiOutlineDownload, AiOutlinePlayCircle,
} from 'react-icons/ai';
import { WorkflowFile } from '@wbr-project/wbr-interpret';
import Workflow from './WorkflowEditor';
import Screen, { runWorkflow } from '../WorkflowPlayer/Player';
import { ConsoleControls } from '../WorkflowPlayer/Console';
import Button from '../Reusables/Button';
import EditableHeading from './Editables/EditableHeading';

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
  constructor(state: T, outCallback: (state: T) => void) {
    this.historyStack.push(state);
    this.outCallback = outCallback;
  }

  /**
     * Adds a new state to the history stack.
     * If `redo` is possible, the "next" state will be replaced by the new one.
     * @param state The new state to be added to the history.
     */
  public newState(state: T) {
    if (this.historyId < this.historyStack.length - 1) {
      this.historyStack.splice(this.historyId + 1);
    }
    this.historyStack.push(state);
    this.historyId += 1;
  }

  /**
     * Tests if the history can be undone.
     * @returns `true` if the history can be undone, `false` otherwise.
     */
  public canUndo() {
    return this.historyId > 0;
  }

  /**
     * Tests if the history can be redone.
     * @returns `true` if the history can be redone, `false` otherwise.
     */
  public canRedo() {
    return this.historyId < this.historyStack.length - 1;
  }

  /**
     * Redoes the last action.
     */
  public redo = () => {
    if (this.canRedo()) {
      this.historyId += 1;
      this.outCallback(this.historyStack[this.historyId]);
    }
  };

  /**
     * Undoes the last action.
     */
  public undo = () => {
    if (this.canUndo()) {
      this.historyId -= 1;
      this.outCallback(this.historyStack[this.historyId]);
    }
  };
}

/**
 * A wrapper element for high-level worklfow management (renaming, download, undo/redo, etc.).
 */
export default function WorkflowManager(
  { workflow, setModal }: { workflow: WorkflowFile, setModal: (x: boolean) => void },
) : JSX.Element {
  /**
     * Tags each pair in the given WorkflowFile with a unique ID (React specific).
     * @param workflow The WorkflowFile to be tagged.
     * @returns Tagged WorkflowFile.
     */
  const tagPairIds = (w: WorkflowFile) => ({
    ...w,
    workflow: w.workflow.map((pair) => (
      {
        ...pair,
        _reactID: (pair as any)._reactID ?? window.crypto.randomUUID(),
      }
    )),
  });

  /**
     * Removes the React tags from each pair in the given WorkflowFile.
     * @param workflow The WorkflowFile to be untagged.
     * @returns Untagged WorkflowFile.
     */
  const untagPairIds = (w: WorkflowFile) => ({
    ...w,
    workflow: w.workflow.map((pair) => (
      {
        ...pair,
        _reactID: undefined,
      }
    )),
  });

  const [workflowState, setWorkflowInternal] = useState(tagPairIds(workflow));
  const [isRunning, setRunning] = useState(false);
  const [currentIdx, setCurrent] = useState(-1);

  const stopper = useRef<Function>(() => {});

  const historyManager = useRef(new HistoryManager(workflowState, setWorkflowInternal));

  const playWorkflow = async () => {
    ConsoleControls.clear();
    ConsoleControls.write(`Console cleared, running ${workflow.meta?.name}`, 'green');
    ConsoleControls.write('===============', 'white');
    if (workflow.meta?.desc) ConsoleControls.write(`${workflow.meta?.desc}`, 'green');
    setRunning(true);
    stopper.current = await runWorkflow(untagPairIds(workflowState), (idx: number) => {
      if (idx === -1) setRunning(false);
      setCurrent(idx);
    });
  };

  const stopWorkflow = async () => {
    if (!isRunning) return;
    stopper.current?.();
    stopper.current = () => {};
    await new Promise((x) => { setTimeout(x, 200); });
    setRunning(false);
    ConsoleControls.write('Workflow execution stopped.\n\n', 'yellow');
  };

  /**
     * Wrapper function for the state setter. Handles the history management,
     *  download link generation, etc.
     * @param newWorkflow New WorkflowFile to be set.
     */
  const setWorkflow = (newWorkflow: typeof workflowState) : void => {
    stopWorkflow();
    const taggedWorkflow = tagPairIds(newWorkflow);
    historyManager.current.newState(taggedWorkflow);

    setWorkflowInternal(taggedWorkflow);
  };

  useEffect(() => {
    const downloadLink = document.getElementById('downloadLink');
    downloadLink?.setAttribute(
      'href',
      `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(untagPairIds(workflowState), null, 2))}`,
    );
    downloadLink?.setAttribute('download', 'workflow.json');
  });

  return (
    <div>
    <button onClick={() => setModal(true)}>&lt; Back to the menu</button>
    <EditableHeading text={workflowState.meta?.name ?? 'Workflow'} updater={(value: string) => { setWorkflow({ ...workflowState, meta: { ...workflowState.meta, name: value } }); }}/>
    <div id="mainContainer">
    <div style={{ padding: '10px', backgroundColor: 'white' }}>
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
            onClick={!isRunning ? playWorkflow : stopWorkflow}
            icon={!isRunning ? <AiOutlinePlayCircle/> : <AiOutlineDownload/>}
            text={!isRunning ? 'Play' : 'Stop'}
        />
        </div>
        <Workflow {
            ...{
              workflow: workflowState.workflow,
              setWorkflow: (pairs: WorkflowFile['workflow']) => setWorkflow({ ...workflowState, workflow: pairs as any }),
              currentIdx,
            }
        }
        />
        </div>
        <Screen />
    </div>
    </div>
  );
}
