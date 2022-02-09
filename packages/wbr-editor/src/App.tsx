import './App.css';
import {Where, What, Workflow} from './workflow';
import { operators } from './logic';
import { ReactElement, useState } from 'react';

function CollapsibleObject(props: {name: string, object: any}) : JSX.Element {
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
        <CollapsibleObject name={key} object={val}/>
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
          <CollapsibleObject name={key} object={value}/>
        )
      })
    }
  </div>
  )
}

type JSONScalar = string | number | boolean;

function RecursiveCollection({collection}: {collection: Record<string, any> | any[] | JSONScalar}){
  if(collection && typeof collection === 'object'){
      return(
        <div className='recursive'>
        {
          Object.entries(collection).map(([key,value]) => (
            <Collapsible header={key} content={value} updater={() => {}}/>
          ))
        }
        </div>
      )
  }
  else{
    return(<div className='rvalue'>{collection}</div>);
  }
}
// /**
//  * Returns `true` if all the values are scalar types.
//  */
// function isSimple(obj: Record<string,any> | any[]) : boolean{
//   return Object.values(obj).reduce(
//     (p,x) => (
//       p && (typeof obj !== 'object' || obj === null)
//     ), true
//   )
// }

// function SimpleObject({content}: {content: Record<string,any> | any[]}) {
//   return (
//     <table>
//       {!Array.isArray(content) ? 
//         Object.entries(content).map(([k,v]) => (
//           <tr>
//             <td>{k}</td><td>{v}</td>
//           </tr>
//         )
//       ) : 
//       Object.values(content).map((v) => (
//         <tr>
//           <td>{v}</td>
//         </tr>
//       ))
//       }
//     </table>
//   )
// }

function isScalar (object: any) : boolean {
  return typeof object !== 'object' && object !== null
}

function Collapsible({header, content, updater}: {header: string, content: Record<string, any>, updater: ArbitraryFunction}){
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  }
  return(
    <div>
      <p className={`toggler ${collapsed ? 'on' : 'off'}`} onClick={toggleCollapsed}>{header}</p>
      <div className={`collapsible ${collapsed ? 'collapsed' : ''}`}>
        <div style={{display:'flex', flexDirection: 'column'}}>
          <div className='horizontal-line'></div>
          {!isScalar(content) ? 
            <div className='add' onClick={() => {
              alert("adding!");
            }}>+</div> 
            : 
            null}
        </div>
        <RecursiveCollection collection={content}/>
      </div>
    </div>
  )
}

function WhereEditor({where}: {where: Where}){
  let out = Object.entries(where).map(([key, value]) => {
    if(operators.includes(key as any)){
      // out.push(<WhereEditor where={where as Where}/>)
    }
    if(typeof value === 'string'){
      return (
        <div>
        <p className={`toggler`} >{key}</p>
        <div className={`collapsible`}>
          <div style={{display:'flex', flexDirection: 'column'}}>
            <div className='horizontal-line'></div>
          </div>
          <p>{value}</p>
        </div>
      </div>
      )
    }
  }
  )
  return (
    <div>
    {
      out
    }
    </div>
  )
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
      <SimpleWhere where={pair.where as Where[]}/>
      <Collapsible header="Then do..." content={pair.what} updater={updateWhat}/>
    </div>
    <div onClick={addPairBelow}>
      +
    </div>
    </>
  )
}

function CollapsibleV({header, content}: {header: string, content: ReactElement}){
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  }
  return(
    <div>
      <p className={`toggler ${collapsed ? 'on' : 'off'}`} onClick={toggleCollapsed}>{header}</p>
      <div className={`collapsible ${collapsed ? 'collapsed' : ''}`}>
        <div style={{display:'flex', flexDirection: 'column'}}>
          <div className='horizontal-line'></div>
        </div>
        {content}
      </div>
    </div>
  )
}

function RValueObj({rval} : {rval: Record<string,string>}){
  const [key,value] = Object.entries(rval)[0];
  return (
    <div>
      <p><b>{key}</b></p>
      <ScalarValue props={value}/>
    </div>
  )
}

function ScalarValue({props} : {props: JSONScalar}){
  if(typeof props === 'object'){
    return <RValueObj rval={props}/>
  }
  return (
    <p className="scalar">
      {props}
    </p>
  )
}

function Url({props}: {props: string}){
  const content = <ScalarValue props={props}/>;
  return ( <CollapsibleV header="URL" content={content}/> )
}

function SelectorList({props}: {props: string[]}){
  const content = (<div>{ props.map(x => ScalarValue({props: x}) ) }</div>);
  return (<CollapsibleV header="Selectors:" content={content}/>)
}

function CookieList({props} : {props: Record<string,string>}){
  const content = 
    <>
      {
        Object.entries(props).map(([key, value]) => (
          <div>
          <p>{key}</p>   
          <ScalarValue props={value}/>
          </div>
        ))
      }
    </>;

  return (
    <CollapsibleV header="Cookies:" content={content}/>
  )
}


function SimpleWhere({where}: {where: Where[]}){
  const key_element_mapping : Record<string,ArbitraryFunction> = {
    url: Url,
    selectors: SelectorList,
    cookies: CookieList,
  };
  console.log(where);
  return (
    <>
    {
      where.map(obj => {
        if(obj !== {}){
          const [key,value] = Object.entries(obj)[0];
          return key_element_mapping[key]({props: value});
        }
        return null
      })
    }
  </>
  );
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

const workflow_new = [
  {
    where:[
        {url: "https://apify.com"},
        {url: {$regex: "https://.*"}},
        {selectors: [
          "abcd",
          "xyz"
        ]},
        {cookies: {
          "abcd": "true"
        }}
    ],
    what:[]
  }
]

const workflow_nehnutelnosti : any = [
  {
    "name": "closePopups",
    "where": [{
        "selectors": [
            "[title=\"SP Consent Message\"]",
            "[lalalal]",
            ".classyMF"
        ]
    }],
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
    "where": [{
        "selectors": [
            ".price--main.paramNo0"
        ]
    }],
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
    "where": [{
        "selectors": [
            "li + li .component-pagination__arrow-color"
        ]
    }],
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
    "where": [{
        "selectors": [
            "li + li .component-pagination__arrow-color"
        ]
    }],
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
    "where": [{}],
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
        <WorkflowEditor w={workflow_new as Workflow}/>
    </div>
  );
}

export default App;
