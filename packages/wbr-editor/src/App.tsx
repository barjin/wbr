import './App.css';
import { useState } from 'react';
import WorkflowManager from './components/WorkflowManager';
import Modal from './components/tiny/Modal';

function App() {
  const [workflow, setWorkflow] = useState({});
  const [modalVisible, setModal] = useState(true);

  if (window.innerWidth < 1200) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        textAlign: 'center',
      }}>
        <img src={'./error.svg'} style={{ width: '25vh', marginTop: '10px' }}/>
        <h1>Oh, no!</h1>
        <p>It seems to us that your screen is too narrow for wbr-editor to work properly.</p>
        <p>Please, get a wider screen and try it again.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    {
        modalVisible
          ? <Modal {...{ setWorkflow, setModal } as any}/>
          : <div className="App" style={{ filter: modalVisible ? 'blur(20px)' : '' }}>
              <WorkflowManager {...{ workflow } as any}/>
            </div>
    }
    <div id='footer'>
      <span>build 0.1.0</span>
      <span>wbr-editor</span>
      <span>Made by <a href="mailto:jindrichbar@gmail.com">Jindřich Bär</a>, 2022</span>
    </div>
    </div>
  );
}

export default App;
