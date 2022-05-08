export default [
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
          <b> the first pair that matches</b> the conditions.</p>
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
    content: (<p>You're done! Now you can run your workflow by clicking the <b>"Play"</b> button,
    or <b>Download</b> the workflow definition file for further use.</p>),
  },
].map((x) => ({ ...x, disableOverlayClose: true }));
