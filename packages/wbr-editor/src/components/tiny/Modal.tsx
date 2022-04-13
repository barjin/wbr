import Button from "./Button";
import {IoMdCreate} from 'react-icons/io';
import { AiOutlineCloudUpload } from 'react-icons/ai';
import { useRef } from "react";
import { Preprocessor } from "@wbr-project/wbr-interpret";

const emptyWorkflow = {
    workflow: []
}

export default function Modal({setWorkflow, setModal}: any){
    const fileUploadref = useRef(null);

    const handleFileUpload = async (e: any) => {
        const textFile : string = await new Promise (
            (resolve, reject) => {
                const [file] = e.target.files;
                let reader = new FileReader();
                
                reader.addEventListener('load', (e) => {
                    resolve((e!.target!.result as string));
                });
                reader.addEventListener('error', reject);
                reader.addEventListener('abort', reject);

                reader.readAsText(file);
            }
        );
        
        const workflow = JSON.parse(textFile);
        const error = Preprocessor.validateWorkflow(workflow);
        console.log(error);
    }


    return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header" style={{flexDirection: 'row', display: 'flex', justifyContent: 'space-between'}}>
                    <h2>wbr-editor</h2>
                </div>
                <hr/>
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center'}}>
                <div className="modal-body">
                    <p>
                        Welcome to wbr-editor!
                    </p>
                    <p>
                        You can proceed by <b>creating a new workflow</b>, or <b>loading an existing workflow from file</b>.
                    </p>
                </div>
                <Button
                    text='Create new workflow'
                    icon={<IoMdCreate/>}
                    onClick={() => {
                        setWorkflow(emptyWorkflow);
                        setModal(false);
                    }}
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
                </div>
            </div>
        </div>
    );
}