export default class UpdaterFactory {
    static ArrayIdxUpdater<T extends unknown>(input: T[], callback: (arg0: T[]) => void, options?: {deleteEmpty: boolean}){
        return (idx: number) => (newElement: T) => {
            if(typeof newElement !== 'object' || Object.keys(newElement as any).length !== 0 || !options?.deleteEmpty){
                callback(input.map((x,i) => i === idx ? newElement : x));
            }
            else{
                callback(input.filter((_,i) => i !== idx));
            }
        }
    }

    static ArrayIdxRearrange<T extends unknown>(input: T[], callback: (arg0: T[]) => void, options?: {deleteEmpty: boolean}){
        return (idx: number) => (newElement: T|T[]) => {
            if(typeof newElement !== 'object' || Object.keys(newElement as any).length !== 0 || !options?.deleteEmpty){
                if(Array.isArray(newElement)){
                    callback([...input.slice(0,idx), ...newElement, ...input.slice(idx+1)]);
                }
                else{
                    callback(input.map((x,i) => i === idx ? newElement : x));
                }
            }
            else{
                callback(input.filter((_,i) => i !== idx));
            }
        }
    }
    
    static ArrayIdxDeleter<T extends unknown>(input: T[], callback: (arg0: T[]) => void){
        return (idx: number) => () => {
            callback(input.filter((_,i) => i !== idx));
        }
    }
    
    static ArrayPusher<T extends unknown>(input: T[], callback: (arg0: T[]) => void){
        return () => (newElement: T) => {
            callback([...input, newElement]);
        }
    }

    static ObjectKeyUpdater<T extends Record<string, unknown>>(input: T, callback: (arg0: T) => void){
        return (oldKey: string) => (newKey: string) => {
            const value = input[oldKey];
            const {[oldKey]: _, ...rest} = input;
            callback({...rest, [newKey]: value} as any);
        }
    }

    static ObjectValueUpdater<T extends Record<string, unknown>>(input: T, callback: (arg0: T) => void){
        return (key: string) : Function => (value: any) => {
            callback({...input, [key]: value});
        }
    }
    
    static ObjectAddKey<T extends Record<string, unknown>>(input: T, callback: (arg0: T) => void){
        return () => (newKey: string) : void => {
            if(newKey){
                callback({...input, [newKey]: ''});
            }
        };
    }

    static ObjectRemoveKey<T extends Record<string, unknown>>(input: T, callback: (arg0: T) => void){
        return (keyToRemove: string) => () => {
            callback(Object.fromEntries(Object.entries(input).filter(([k]) => k !== keyToRemove)) as any);
        }
    }
}
