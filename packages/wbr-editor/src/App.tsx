import './App.css';
import { useState } from 'react';
import WorkflowManager from './components/WorkflowManager';
import Screen from './components/tiny/Player';
import Modal from './components/tiny/Modal';

const nehnutelnosti = {
  meta: {
    name: 'Nehnutelnosti.sk scraper (tech demo)',
    desc: 'Scraper for the nehnutelnosti.sk, Slovak real estate online marketplace.',
  },
  workflow: [
    {
      id: 'closePopups',
      where: {
        selectors: [
          '[title="SP Consent Message"]',
        ],
      },
      what: [
        {
          action: 'script',
          args: ["\t\t\t\tconst frame = page.frameLocator(\"[title='SP Consent Message']\");\t\t\t\tawait frame.locator(\"[title='Prijať všetko']\").click();\t\t\t\t"],
        },
        {
          action: 'waitForLoadState',
        },
      ],
    },
    {
      id: 'scrapeInfoPage',
      where: {
        selectors: [
          '.price--main.paramNo0',
        ],
      },
      what: [
        {
          action: 'waitForLoadState',
        },
        {
          action: 'scrapeSchema',
          args: [{
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
          }],
        },
        {
          action: 'close',
        },
      ],
    },
    {
      id: 'openDetailsInNewTabs',
      where: {
        selectors: [
          'li + li .component-pagination__arrow-color',
        ],
      },
      what: [
        {
          action: 'waitForLoadState',
        },
        {
          action: 'enqueueLinks',
          args: ['a.advertisement-item--content__title'],
        },
        {
          action: 'close',
        },
      ],
    },
    {
      id: 'scrape_basic',
      where: {
        selectors: [
          'li + li .component-pagination__arrow-color',
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
          args: ['li + li .component-pagination__arrow-color'],
        },
        {
          action: 'waitForTimeout',
          args: [2000],
        },
      ],
    },
    {
      id: 'base',
      where: {},
      what: [
        {
          action: 'goto',
          args: ['https://www.nehnutelnosti.sk/bratislava/'],
        },
        {
          action: 'waitForLoadState',
        },
        {
          action: 'waitForTimeout',
          args: [1000],
        },
      ],
    },
  ],
};

function App() {
  const [workflow, setWorkflow] = useState(nehnutelnosti);
  const [modalVisible, setModal] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    {
        modalVisible
          ? <Modal {...{ setWorkflow, setModal } as any}/>
          : <div className="App" style={{ filter: modalVisible ? 'blur(20px)' : '' }}>
            <WorkflowManager {...{ workflow } as any}/>
            <Screen />
        </div>
    }
    </div>
  );
}

export default App;
