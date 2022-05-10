export default {
  workflow: [
    {
      where: {
        $and: [
          {
            selectors: [
              '#info-table,.info-table',
            ],
          },
          {
            $before: 'scrape',
          },
        ],
      },
      what: [
        {
          action: 'scrape',
          args: [
            '#info-table,.info-table',
          ],
        },
        {
          action: 'script',
          args: [
            '// your code goes here\n// you can use await here, \n// the current page is available as `page` in the current context.\nawait page.close();',
          ],
        },
      ],
      id: 'scrape',
    },
    {
      where: {
        $and: [
          {
            selectors: [
              '.employee',
            ],
          },
        ],
      },
      what: [
        {
          action: 'enqueueLinks',
          args: [
            '.employee',
          ],
        },
      ],
      id: 'enqueuePpl',
    },
    {
      where: {
        $and: [
          {
            selectors: [
              '.signpost-list-item-link',
            ],
          },
        ],
      },
      what: [
        {
          action: 'enqueueLinks',
          args: [
            '.signpost-list-item-link',
          ],
        },
      ],
      id: 'enqueueInstitutes',
    },
    {
      where: {
        $and: [
          {
            url: 'about:blank',
          },
        ],
      },
      what: [
        {
          action: 'goto',
          args: [
            'https://www.mff.cuni.cz/cs/fakulta/organizacni-struktura',
          ],
        },
      ],
      id: 'base',
    },
  ],
  meta: {
    name: 'Organizační struktura MFF CUNI',
  },
};
