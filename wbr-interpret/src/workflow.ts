import fs from 'fs';
// Example Smart Workflow file
// So far, this file is .ts to allow for simple imports etc.

const cookieAccept = [
  {
    where: {
      selectors: ['button:text-matches("(accept|agree|souhlasím|allow)", "i")'],
    },
    what: [
      {
        type: 'click',
        params: [
          'button:text-matches("(accept|agree|souhlasím|allow)", "i")',
        ],
      },
    ],
  },
];
const FillTheForm = [
  {
    where: {
      selectors: [
        '[id*=from],[class*=from] input',
      ],
    },
    what: [
      {
        type: 'fill',
        params: [
          '[id*=from],[class*=from] input',
          { $param: 'From' },
        ],
      },
      {
        type: 'press',
        params: [
          '[id*=from],[class*=from] input',
          'Tab',
        ],
      },
      {
        type: 'waitForTimeout',
        params: [
          2000,
        ],
      },
      {
        type: 'fill',
        params: [
          '[id*=from],[class*=from] input',
          { $param: 'To' },
        ],
      },
      {
        type: 'press',
        params: [
          '[id*=from],[class*=from] input',
          'Enter',
        ],
      },
      {
        type: 'waitForTimeout',
        params: [
          2000,
        ],
      },
    ],
  },
];
const workflow = {
  meta: {
    params: ['Carrier', 'From', 'To'],
  },
  workflow: [
    ...cookieAccept,
    ...FillTheForm,
    {
      where: {
      },
      what: [
        {
          type: 'goto',
          params: [
            { $param: 'Carrier' },
          ],
        },
        {
          type: 'waitForLoadState',
          params: [
          ],
        },
        {
          type: 'waitForTimeout',
          params: [
            3000,
          ],
        },
      ],
    },
  ],
};

fs.writeFileSync('./workflow.json', JSON.stringify(workflow));

export default workflow;
