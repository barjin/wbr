export default {
  meta: {
    name: 'CD.cz',
    desc: 'Scraper for the Ceske Drahy online shop. It shows form handling, pagination, and schematic scraping capabilities.',
  },
  workflow: [
    {
      id: 'closePopups',
      where: {
        $and: [
          {
            selectors: [
              '#consentBtnall.btnallow',
            ],
          },
        ],
      },
      what: [
        {
          action: 'click',
          args: ['#consentBtnall.btnallow'],
        },
        {
          action: 'waitForLoadState',
        },
      ],
    },
    {
      id: 'scrapeSearchResults',
      where: {
        $and: [
          {
            url: {
              $regex: '^https://www.cd.cz/spojeni-a-jizdenka/spojeni-tam/.*',
            },
          },
        ],
      },
      what: [
        {
          action: 'scrapeSchema',
          args: [
            {
              from: '.res-city.rcheader + * > .res-cityname a',
              to: '.res-city.res-bottom.rc2:last-of-type > .res-cityname a',
              departure: '.res-city.rcheader + * > .res-inf',
              departureTime: '.res-city.rcheader + * > .res-time',
              arrival: '.res-city.res-bottom.rc2:last-of-type > .res-inf',
              arrivalTime: '.res-city.res-bottom.rc2:last-of-type > .res-time',
              price: '.buybut.green',
            },
          ],
        },
        {
          action: 'click',
          args: [
            '.link-nxt',
          ],
        },
        {
          action: 'waitForLoadState',
        },
      ],
    },
    {
      id: 'fillTheForm',
      where: {
        $and: [
          {
            selectors: [
              "[placeholder='Zadejte stanici odkud']",
              "[placeholder='Zadejte stanici kam']",
            ],
          },
        ],
      },
      what: [
        {
          action: 'waitForLoadState',
        },
        {
          action: 'fill',
          args: [
            "[placeholder='Zadejte stanici odkud']",
            'Praha',
          ],
        },
        {
          action: 'keyboard.press',
          args: [
            'Enter',
          ],
        },
        {
          action: 'fill',
          args: [
            "[placeholder='Zadejte stanici kam']",
            'Brno',
          ],
        },
        {
          action: 'keyboard.press',
          args: [
            'Enter',
          ],
        },
        {
          action: 'waitForNavigation',
        },
      ],
    },
    {
      id: 'base',
      where: {
      },
      what: [
        {
          action: 'goto',
          args: ['https://www.cd.cz/spojeni-a-jizdenka/'],
        },
        {
          action: 'waitForTimeout',
          args: [2000],
        },
      ],
    },
  ],
};
