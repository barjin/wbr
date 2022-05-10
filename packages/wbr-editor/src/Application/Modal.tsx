import { IoMdCreate } from 'react-icons/io';
import { AiOutlineCloudUpload } from 'react-icons/ai';
import { BiHelpCircle } from 'react-icons/bi';
import { useRef, useState, useContext } from 'react';
import { Preprocessor } from '@wbr-project/wbr-interpret';
import Button from './Reusables/Button';
import { CD, MFFCuni, NehnutelnostiSk } from '../examples';
import { TutorialContext } from './WorkflowEditor/Utils/GlobalStates';

const emptyWorkflow = {
  workflow: [],
};

export default function Modal({ setWorkflow, setModal, startTutorial }: any) {
  const fileUploadref = useRef(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<null | { filename: string, message: string }>(null);

  const handleFileUpload = async (fileEvent: any) => {
    try {
      const textFile : string = await new Promise(
        (resolve, reject) => {
          const [file] = fileEvent.target.files;
          const reader = new FileReader();

          reader.addEventListener('load', (e) => {
            resolve((e!.target!.result as string));
          });
          reader.addEventListener('error', reject);
          reader.addEventListener('abort', reject);

          reader.readAsText(file);
        },
      );

      const workflow = JSON.parse(textFile);
      const error = Preprocessor.validateWorkflow(workflow);

      if (!error) {
        setWorkflow(workflow);
        setModal(false);
      } else {
        setErrorMessage({ filename: fileEvent.target.files[0].name, message: error.message });
      }
    } catch {
      setErrorMessage({ filename: fileEvent.target.files[0].name, message: 'This file is not a valid workflow file.' });
    }
  };

  const exampleMap: Record<string, any> = {
    'People at MFF Cuni': MFFCuni,
    'Nehnuteľnosti.sk': NehnutelnostiSk,
    'České dráhy': CD,
  };

  const getExampleWorkflow = (workflowName: string) => {
    let workflow = {};

    if (exampleMap[workflowName]) {
      workflow = exampleMap[workflowName];
    } else {
      throw new Error('Example workflow not found!');
    }

    setWorkflow(workflow);
    setModal(false);
  };

  const { nextStep } = useContext(TutorialContext);

  return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header" style={{ flexDirection: 'row', display: 'flex', justifyContent: 'space-between' }}>
                    <h2>wbr-editor</h2>
                </div>
                <hr/>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <div className="modal-body">
                    <p>
                        Welcome to wbr-editor!
                    </p>
                    <p>
                        You can proceed by <b>creating a new workflow</b>,
                        or <b>loading an existing workflow from file</b>.
                    </p>
                </div>
                <Button
                    text='Create new workflow'
                    icon={<IoMdCreate/>}
                    onClick={() => {
                      setWorkflow(emptyWorkflow);
                      setModal(false);
                      nextStep();
                    }}
                    style={{ marginBottom: '10px' }}
                />
                <input
                    ref={fileUploadref}
                    type="file"
                    style={{ display: 'none' }}
                    id="hidden-file-upload"
                    onChange={handleFileUpload}
                />
                <Button
                    text='Load workflow from file'
                    icon={<AiOutlineCloudUpload/>}
                    onClick={() => {
                      (fileUploadref.current as any).click();
                    }}
                />
                <div style={{ height: '10px' }}/>
                {
                  Object.keys(exampleMap).map(
                    (name: string) => (
                      <Button
                      text={`Load example workflow (${name})`}
                      onClick={() => getExampleWorkflow(name)}
                    />
                    ),
                  )
                }
                </div>
                {
                    errorMessage
                      ? <div>
                        <h3>{errorMessage.filename}</h3>
                        <p>{errorMessage.message}</p>
                    </div>
                      : null
                }
                <Button
                    text='Start tutorial!'
                    icon={<BiHelpCircle/>}
                    onClick={startTutorial}
                />
            </div>
        </div>
  );
}
