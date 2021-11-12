// Example Smart Workflow file
// So far, this file is .js to allow for simple imports etc.

const credentials = {
  logins: ['loginwithoutzavinac', 'login2', 'mail@mail.mail'],
  passwords: ['heslo1', 'heslo2', 'heslo@heslo.heslo'],
};
const cookieAccept = [
  {
    where: {
      selectors: { 'button:text-matches("(accept|agree|souhlasím|allow)", "i")': [] },
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
const loginer = [
  {
    where: {
      selectors: {
        'input[type=text], input[type=email], input[class*=login]': [],
        'input[type=password]': [],
      },
    },
    what: [
      {
        type: 'fill',
        params: [
          'input[type=text],input[type=email], input[class*=login]',
          credentials.logins,
        ],
      },
      {
        type: 'fill',
        params: [
          'input[type=password]',
          credentials.passwords,
        ],
      },
      {
        type: 'press',
        params: [
          'input[type=password]',
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
const workflow = [
  ...cookieAccept,
  ...loginer,
  {
    where: {
      url: 'https://email.seznam.cz/?hp=',
    },
    what: [
      {
        type: 'goto',
        params: [
          'https://email.seznam.cz/?hp#inbox',
        ],
      },
      {
        type: 'waitForLoadState',
        params: [
          'load',
        ],
      },
    ],
  },
  {
    where: {
    },
    what: [
      {
        type: 'goto',
        params: [
          ['https://seznam.cz', 'https://www.netflix.com/cz/login', 'https://console.apify.com/sign-in', 'https://instagram.com'],
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
          1000,
        ],
      },
    ],
  },
];
export default workflow;
