import './App.css';
import {Where, What, Workflow} from './workflow';
import { operators } from './logic';
import { useState } from 'react';

function GenericObject(props: {name: string, object: any}) : JSX.Element {
  const {name, object} = props;
  if(typeof object !== 'object'){
    return (
    <div className='genericObject'>
      <span className="key">{name}: </span>
      <span>{object}</span>
    </div>);
  }
  return (
    <div className='genericObject'>
    {
      Object.entries(object).map(([key,val]) => (
        <div className='collapsible'>
        <p className="key">{name}: </p>
        <GenericObject name={key} object={val}/>
        </div>
      ))
    }
    </div>
  );
}

const conditionsHumanReadable : Record<string,string> = {
  $and: "All of the following...",
  $or: "At least one of the following...",
  $none: "None of the following...",
}

function Conditions(props: {logic?: typeof operators[number]; where: Where}) : JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const {where} = props;
  return (
    <div className={`collapsible ${collapsed ? 'collapsed' : ''}`}>
    {
      Object.entries(where).map(([key, value]) => {
        if(operators.includes(key as any)){
          return (
            <>
            <h3 onClick={
              () => {
                setCollapsed(!collapsed);
              }
            }>{conditionsHumanReadable[key]}</h3>
            <div className={`${key.substring(1)}Block`}>
              <Conditions where={value as Where}/>
            </div>
            </>
          );
        }
        return (
          <GenericObject name={key} object={value}/>
        )
      })
    }
  </div>
  )
}

function CodeBlock(props: {code: string}){
  const lines = props.code.split(';');
  return (<div className='codeblock'>
    {
      lines.map(line => (
        <p className='codeline'>
          {line+';'}
        </p>
      ))
    }
  </div>);
}

function Action({data, updater}: {data: What, updater: ArbitraryFunction}) {
  const addActionBelow = () => {
    updater([
      data,
      {
        type: undefined,
        params: undefined
      }
    ])
  }

  const removeAction = () => updater([])

  return (
    <>
    <div className='action'>
      <b>
        {data.type}
      </b>
      <p>
        {
          data.type === 'script' ?
          <CodeBlock code={data.params}/> :
          JSON.stringify(data.params,null,2)
        }
      </p>
      <div onClick={removeAction}>---</div>
    </div>
    <div onClick={addActionBelow}>+++</div>
    </>
  )
}

function Actions({actions, updater}: {actions: What[], updater: ArbitraryFunction}) {
  const updateActionOnIndex = (idx: number) => {
    return (action: What[]) => updater(
      [
        ...actions.slice(0, idx),
        ...action,
        ...actions.slice(idx+1),
      ]
    )
  }

  return (
    <div className='collapsible'>
      {actions.map((action, idx) => (
        <Action updater={updateActionOnIndex(idx)} data={action}/>
      )
      )}
    </div>
  );
}

type PairData = Workflow[number];
type ArbitraryFunction = (...args: any[]) => any;

function Pair({pair, updater} : {pair: PairData, updater: ArbitraryFunction}){
  const addPairBelow = () => updater(
    [
      pair,
      {
        where:{
        },
        what: []
      }
    ]
  );
  const updateWhere = (where: Where) => {
    updater(
      [
        {
          ...pair,
          where: where
        }
      ]
    )
  };
  const updateWhat = (what: What) => {
    updater(
      [
        {
          ...pair,
          what: what
        }
      ]
    )
  }
  return (
    <>
    <div className='pair'>
      {pair.name ? <h1>{pair.name}</h1> : null}
      <h2>If there is...</h2>
      <Conditions where={pair.where}/>
      <h2>Then run...</h2>
      <Actions updater={updateWhat} actions={pair.what} />
    </div>
    <div onClick={addPairBelow}>
      +
    </div>
    </>
  )
}

function WorkflowEditor({w} : {w: Workflow}) {
  const [workflow, updateWorkflow] = useState(w);
  return (
  <>
    {workflow.map((pair,idx) => (
      <Pair 
        pair={pair}
        updater={(newPair: PairData[]) => {
          updateWorkflow([
            ...workflow.slice(0,idx),
            ...newPair,
            ...workflow.slice(idx + 1)
          ]);
        }}
      />
    )
    )}
  </>
  );
}

const workflow_nehnutelnosti : any = [
  {
    "name": "closePopups",
    "where": {
        "selectors": [
            "[title=\"SP Consent Message\"]"
        ]
    },
    "what": [
        {
            "type": "script",
            "params": "\t\t\t\tconst frame = page.frameLocator(\"[title='SP Consent Message']\");\t\t\t\tawait frame.locator(\"[title='Prijať všetko']\").click();\t\t\t\t"
        },
        {
            "type": "waitForLoadState"
        }
    ]
},
{
    "name": "scrapeInfoPage",
    "where": {
        "selectors": [
            ".price--main.paramNo0"
        ]
    },
    "what": [
        {
            "type": "waitForLoadState"
        },
        {
            "type": "scrapeSchema",
            "params": {
                "id": ".parameter--info :text(\"ID inzerátu\") strong",
                "title": "h1",
                "date": ".date",
                "price": ".price--main.paramNo0",
                "offerType": ".parameter--info :text(\"Typ\") strong",
                "type": ".parameter--info :text(\"Druh\") strong",
                "condition": ".parameter--info :text(\"Stav\") strong",
                "roomNo": ".additional-features--item :text(\"izieb\") strong:visible",
                "floorNo": ".additional-features--item :text(\"podlaží\") strong:visible",
                "utilityArea": ".parameter--info :text(\"Úžit. plocha\") strong",
                "builtArea": ".parameter--info :text(\"Zast. plocha\") strong",
                "landArea": ".parameter--info :text(\"Plocha pozemku\") strong",
                "location": ".top--info-location",
                "desc": ".text-inner",
                "broker": ".broker-name",
                "brokerAddress": ".info--address"
            }
        },
        {
            "type": "close"
        }
    ]
},
{
    "name": "openDetailsInNewTabs",
    "where": {
        "selectors": [
            "li + li .component-pagination__arrow-color"
        ]
    },
    "what": [
        {
            "type": "waitForLoadState"
        },
        {
            "type": "enqueueLinks",
            "params": "a.advertisement-item--content__title"
        },
        {
            "type": "close"
        }
    ]
},
{
    "name": "scrape_basic",
    "where": {
        "selectors": [
            "li + li .component-pagination__arrow-color"
        ]
    },
    "what": [
        {
            "type": "waitForLoadState"
        },
        {
            "type": "scrape"
        },
        {
            "type": "click",
            "params": "li + li .component-pagination__arrow-color"
        },
        {
            "type": "waitForTimeout",
            "params": 2000
        }
    ]
},
{
    "name": "base",
    "where": {},
    "what": [
        {
            "type": "goto",
            "params": {
                "$param": "url"
            }
        },
        {
            "type": "waitForLoadState"
        },
        {
            "type": "waitForTimeout",
            "params": 1000
        }
    ]
}
]

const workflow1 : any = [
  {
    where:{
      $or: {
				url: 'https://jindrich.bar',
				$and: {
					url: 'https://apify.com',
					cookies: {
						hello: 'cookie',
					}
				}
			}
    },
    what: []
  }
]

function App() {
  return (
    <div className="App">
        <WorkflowEditor w={workflow_nehnutelnosti}/>
    </div>
  );
}

export default App;
