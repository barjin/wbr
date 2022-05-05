import './App.css';
import { useState } from 'react';
import Joyride, {
  CallBackProps, EVENTS, ACTIONS, STATUS,
} from 'react-joyride';
import WorkflowManager from './Application/WorkflowEditor/WorkflowManager';
import Modal from './Application/Modal';
import { TutorialContext } from './Application/WorkflowEditor/Utils/GlobalStates';

function App() {
  const [workflow, setWorkflow] = useState({});
  const [modalVisible, setModal] = useState(true);
  const [joyrideState, setJoyride] = useState<any>(
    {
      run: false,
      steps: [
        {
          target: '.modal',
          content: 'Welcome to WBR Editor! \n\n This tutorial will take you through the basics of creating, debugging and running your web automation.',
          disableBeacon: true,
        },
        {
          target: 'button',
          title: 'Create new workflow',
          content: 'Start by clicking the "Create new Workflow" button. This creates a new blank workflow and opens the editor.',
          hideCloseButton: true,
          hideFooter: true,
          placement: 'bottom',
          spotlightClicks: true,
          styles: {
            options: {
              zIndex: 10000,
            },
          },
        },
        {
          target: 'body',
          content: 'Good job! Now you are in the editor and you can start adding steps to your workflow.',
          hideCloseButton: true,
        },
        {
          target: '#mainContainer > div:nth-child(2)',
          title: 'Screen & console',
          content: 'The right side of the screen contains a remote browser screen and a console. We\'ll use those later.',
          placement: 'left-start',
        },
        {
          target: '#mainContainer > div:nth-child(1)',
          title: 'Workflow editor',
          content: 'And on the left, you can see the workflow editor itself.',
          placement: 'right-start',
        },
        {
          target: '.button.primary',
          title: 'Add a new rule',
          content: 'By clicking the + button, you add a new rule to your workflow.',
          hideCloseButton: true,
          hideFooter: true,
          placement: 'bottom',
          spotlightClicks: true,
          styles: {
            options: {
              zIndex: 10000,
            },
          },
        },
        {
          target: '.pair',
          title: 'Workflow pair',
          content: 'Every workflow in wbr-editor is made of condition-action pairs. You can add as many (or as little) pairs as you want.',
        },
        {
          target: '.where',
          title: 'Condition',
          content: 'Every workflow pair contains a condition. The condition (or If) part describes the conditions that must be met for the action to be executed.',
        },
        {
          target: '.where',
          title: 'Adding a condition',
          content: (
            <>
            <p>
            By clicking the blue + button, you can add a new condition to your workflow pair.
            </p>
            <p>
            When you are done, please click the "Next" button.
            </p>
            </>
          ),
          spotlightClicks: true,
          placement: 'right-start',
        },
        {
          target: '.what',
          title: 'Adding the actions',
          content: (
          <>
          <p>
          In the other part of the pair, there is the list of actions.
          These are executed when the condition above is met.
          </p>
          <p>
          Use the blue + button to add some actions to your first pair.
          When you are done, please click the "Next" button.
          </p>
          </>),
          spotlightClicks: true,
          placement: 'right-start',
        },
        {
          target: '#mainContainer > div',
          title: 'Adding new pairs',
          content: 'Great job, you\'ve finished your first workflow pair! Try adding one or two more pairs to your workflow. Click "Next" whenever you\'re done.',
          spotlightClicks: true,
          placement: 'right-start',
        },
        {
          target: '#mainContainer > div',
          title: 'WATCH OUT!',
          content: (
            <>
            <p>Before you decide to run your workflow, think twice.
              The workflow interpreter will match
              <b>the first pair that matches</b> the conditions.</p>
            <p>If you have multiple pairs that would match a condition,
              only the first one will be executed (repeatedly).</p>
            <p>This usually means that the more "general" pairs should be at the bottom,
              while the more specific ones closer to the top.</p>
            <p>Use drag&drop controls to reorder the pairs.</p>
            </>
          ),
          spotlightClicks: true,
          placement: 'right-start',
        },
        {
          target: 'body',
          title: "That's it!",
          content: 'You\'re done! Now you can run your workflow by clicking the "Run" button.',
        },
        // {
        //   target: '.my-other-step',
        //   content: 'This another awesome feature!',
        // },
      ],
      callback: (data: CallBackProps) => {
        const {
          status, type, index, action,
        } = data;

        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
        if (finishedStatuses.includes(status as any)) {
          // localStorage.setItem('tutorialFinished', 'true');
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
              <WorkflowManager {...{ workflow } as any}/>
            </div>
    }
    <div id='footer'>
      <span>build 0.1.0</span>
      <span>wbr-editor</span>
      <span>Made by <a href="mailto:jindrichbar@gmail.com">Jindřich Bär</a>, 2022</span>
    </div>
    </div>
    </TutorialContext.Provider>
  );
}

export default App;
