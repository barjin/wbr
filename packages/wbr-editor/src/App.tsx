import './App.css';
import { useEffect, useState } from 'react';
import Joyride, {
  CallBackProps, EVENTS, ACTIONS, STATUS,
} from 'react-joyride';
import WorkflowManager from './Application/WorkflowEditor/WorkflowManager';
import Modal from './Application/Modal';
import { TutorialContext } from './Application/WorkflowEditor/Utils/GlobalStates';
import TutorialSteps from './Application/TutorialSteps';

function App() {
  const [workflow, setWorkflow] = useState({});
  const [modalVisible, setModal] = useState(true);
  const [joyrideState, setJoyride] = useState<any>(
    {
      run: false,
      steps: TutorialSteps,
      callback: (data: CallBackProps) => {
        const {
          status, type, index, action,
        } = data;

        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED, STATUS.PAUSED];
        if (finishedStatuses.includes(status as any)) {
          localStorage.setItem('tutorialFinished', 'true');
          return;
        }

        if (([EVENTS.STEP_AFTER] as string[]).includes(type)) {
          let { stepIndex } = joyrideState;
          let run = true;
          if ([ACTIONS.NEXT, ACTIONS.PREV].includes(action as any)) {
            stepIndex = index + (action === ACTIONS.NEXT ? 1 : -1);
          } else if (action === ACTIONS.CLOSE) {
            run = false;
          }
          setJoyride({
            ...joyrideState,
            stepIndex,
            run,
          });
        }
      },
      stepIndex: 0,
    },
  );

  const advanceTutorial = () => {
    if (joyrideState.run && [1, 5].includes(joyrideState.stepIndex)) {
      setJoyride({
        ...joyrideState,
        stepIndex: joyrideState.stepIndex + 1,
      });
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('tutorialFinished')) {
      setJoyride({
        ...joyrideState,
        run: true,
      });
    }
  }, [localStorage.getItem('tutorialFinished')]);

  if (window.innerWidth < 1200) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        textAlign: 'center',
      }}>
        <img src={'./error.svg'} style={{ width: '25vh', marginTop: '10px' }}/>
        <h1>Oh, no!</h1>
        <p>It seems to us that your screen is too narrow for wbr-editor to work properly.</p>
        <p>Please, get a wider screen and try it again.</p>
      </div>
    );
  }

  return (
    <TutorialContext.Provider value={{
      nextStep: advanceTutorial,
    }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {
        joyrideState
          ? <Joyride
          steps={joyrideState.steps}
          run={joyrideState.run}
          callback={joyrideState.callback}
          continuous={true}
          stepIndex={joyrideState.stepIndex}
          styles={
            [2, 6].includes(joyrideState.stepIndex)
              ? {
                buttonBack: {
                  display: 'none',
                },
              }
              : {}}
        />
          : null
      }
    {
        modalVisible
          ? <Modal {...{
            setWorkflow,
            setModal,
            startTutorial: () => { setJoyride({ ...joyrideState, run: true }); },
          } as any}/>
          : <div className="App" style={{ filter: modalVisible ? 'blur(20px)' : '' }}>
              <WorkflowManager {...{ workflow, setModal } as any}/>
            </div>
    }
    <div id='footer'>
      <span>Made by <a href="mailto:jindrichbar@gmail.com">Jindřich Bär</a>, 2022</span>
      <span>wbr-editor</span>
      <span></span>
    </div>
    </div>
    </TutorialContext.Provider>
  );
}

export default App;
