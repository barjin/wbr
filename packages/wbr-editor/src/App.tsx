import './App.css';
import Workflow from './Workflow';

const workflow : any = [
  {
    id:"first",
    where:{
      $or: [
        {
          url: 'https://jindrich.bar'
        },
        {
          $and: [{
            url: 'https://apify.com',
            cookies: {
              hello: 'testclick'
            },
            selectors: [
                ".class",
                "#id"
            ]
          }]
        }
      ]
    },
    what: [
      {
        "action":"click",
        "args": ["lalala"]
      }
    ]
  }
]

function App() {
  return (
    <div className="App">
        <Workflow workflow={workflow}/>
    </div>
  );
}

export default App;
