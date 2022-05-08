export default {
  meta: {
    name: 'SAuto scraper',
    desc: 'Scraper for the sauto.cz online car dealership. It shows pagination as well as the scraping capabilities.',
  },
  workflow: [
    {
      id: 'closePopups',
      where: {
        $and: [
          {
            selectors: [
              '[class*=popup] button[class*=close]',
            ],
          },
        ],
      },
      what: [
        {
          action: 'click',
          args: ['[class*=popup] button[class*=close]'],
        },
        {
          action: 'waitForLoadState',
        },
      ],
    },
    {
      id: 'paginateAndScrape',
      where: {
        $and: [
          {
            selectors: [':text-matches("Další stránka")'],
          },
        ],
      },
      what: [
        {
          action: 'waitForLoadState',
        },
        {
          action: 'scrape',
        },
        {
          action: 'click',
          args: [':text-matches("Další stránka")'],
        },
        {
          action: 'waitForLoadState',
        },
        {
          action: 'waitForTimeout',
          args: [5000],
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
          args: ['https://www.sauto.cz/'],
        },
        {
          action: 'waitForLoadState',
        },
        {
          action: 'waitForTimeout',
          args: [3000],
        },
        {
          action: 'click',
          args: ['a :text-matches("Zobrazit","i")'],
        },
        {
          action: 'waitForLoadState',
        },
        {
          action: 'waitForTimeout',
          args: [7000],
        },
      ],
    },
  ],
};
