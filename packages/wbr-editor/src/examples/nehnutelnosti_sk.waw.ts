export default {
  meta: {
    name: 'Nehnutelnosti.sk scraper (tech demo)',
    desc: 'Scraper for the nehnutelnosti.sk, Slovak real estate online marketplace. The automation presents the parallel execution capabilities of the interpreter.',
  },
  workflow: [
    {
      id: 'closePopups',
      where: {
        $and: [
          {
            selectors: [
              '[title="SP Consent Message"]',
            ],
          },
        ],
      },
      what: [
        {
          action: 'script',
          args: [
            "const frame = page.frameLocator(\"[title='SP Consent Message']\");\nawait frame.locator(\"[title='Prijať všetko']\").click();\t\t\t\t",
          ],
        },
        {
          action: 'waitForLoadState',
        },
      ],
    },
    {
      id: 'scrapeInfoPage',
      where: {
        $and: [
          {
            selectors: [
              '.price--main.paramNo0',
            ],
          },
        ],
      },
      what: [
        {
          action: 'waitForLoadState',
        },
        {
          action: 'scrapeSchema',
          args: [
            {
              id: '.parameter--info :text("ID inzerátu") strong',
              title: 'h1',
              date: '.date',
              price: '.price--main.paramNo0',
              offerType: '.parameter--info :text("Typ") strong',
              action: '.parameter--info :text("Druh") strong',
              condition: '.parameter--info :text("Stav") strong',
              roomNo: '.additional-features--item :text("izieb") strong:visible',
              floorNo: '.additional-features--item :text("podlaží") strong:visible',
              utilityArea: '.parameter--info :text("Úžit. plocha") strong',
              builtArea: '.parameter--info :text("Zast. plocha") strong',
              landArea: '.parameter--info :text("Plocha pozemku") strong',
              location: '.top--info-location',
              desc: '.text-inner',
              broker: '.broker-name',
              brokerAddress: '.info--address',
            },
          ],
        },
        {
          action: 'close',
        },
      ],
    },
    {
      id: 'openDetailsInNewTabs',
      where: {
        $and: [
          {
            selectors: [
              'li + li .component-pagination__arrow-color',
            ],
          },
        ],
      },
      what: [
        {
          action: 'waitForLoadState',
        },
        {
          action: 'enqueueLinks',
          args: [
            'a.advertisement-item--content__title',
          ],
        },
        {
          action: 'close',
        },
      ],
    },
    {
      id: 'base',
      where: {},
      what: [
        {
          action: 'goto',
          args: [
            'https://nehnutelnosti.sk/bratislava',
          ],
        },
        {
          action: 'waitForLoadState',
        },
        {
          action: 'waitForTimeout',
          args: [
            1000,
          ],
        },
      ],
    },
  ],
};
